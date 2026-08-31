import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import {
  LoginInputSchema,
  LogoutInputSchema,
  MutationInputSchema,
  normalizeMutationInput,
  RefreshInputSchema,
  RegisterInputSchema,
  SyncPayloadSafetyError,
  apiError,
  type ApiErrorCode,
  type MutationResponse,
  type SyncResponse,
} from "@nuttie/contracts";
import { z, ZodError } from "zod";
import { AuthError, AuthService } from "./auth.js";
import type { RuntimeConfig } from "./config.js";
import {
  hashMutationFingerprint,
  RepositoryError,
  type Repository,
} from "./store.js";

const MAX_BODY_BYTES = 256 * 1024;
const COOKIE_NAME = "nuttie_refresh";

type ApiContext = {
  config: RuntimeConfig;
  repository: Repository;
  auth: AuthService;
};

type HttpErrorDetails = Record<string, unknown>;

class HttpError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | (string & {});
  readonly details?: HttpErrorDetails;

  constructor(
    status: number,
    code: ApiErrorCode | (string & {}),
    message: string,
    details?: HttpErrorDetails,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function securityHeaders(response: ServerResponse): void {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("referrer-policy", "no-referrer");
}

function applyCors(
  request: IncomingMessage,
  response: ServerResponse,
  config: RuntimeConfig,
): void {
  const origin = request.headers.origin;
  if (origin && config.corsOrigins.includes(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("access-control-allow-credentials", "true");
    response.setHeader("vary", "Origin");
  }
  response.setHeader(
    "access-control-allow-headers",
    "authorization, content-type, x-request-id, x-client-platform",
  );
  response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
}

function sendJson(
  response: ServerResponse,
  status: number,
  value: unknown,
): void {
  securityHeaders(response);
  response.statusCode = status;
  response.end(JSON.stringify(value));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers["content-type"]
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== "application/json")
    throw new HttpError(
      415,
      "BAD_REQUEST",
      "content-type must be application/json",
    );
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES)
      throw new HttpError(413, "BAD_REQUEST", "request body is too large");
    chunks.push(buffer);
  }
  if (total === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "BAD_REQUEST", "request body must be valid JSON");
  }
}

function parseCookie(
  request: IncomingMessage,
  name: string,
): string | undefined {
  const raw = request.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        throw new AuthError(
          "INVALID_REFRESH_TOKEN",
          "refresh token cookie is malformed",
          401,
        );
      }
    }
  }
  return undefined;
}

function refreshCookie(token: string, config: RuntimeConfig): string {
  const secure = config.nodeEnv === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=${config.refreshTokenTtlSeconds}${secure}`;
}

function browserSession(request: IncomingMessage): boolean {
  // Any Origin-bearing request is browser-like, even if a caller spoofs the
  // platform header. Native clients are the only callers allowed to receive a
  // refresh token in JSON, and they must explicitly identify themselves.
  if (
    typeof request.headers.origin === "string" &&
    request.headers.origin.trim() !== ""
  )
    return true;
  const platform = request.headers["x-client-platform"]
    ?.toString()
    .trim()
    .toLowerCase();
  return platform !== "native";
}

function authPayload(
  request: IncomingMessage,
  result: import("@nuttie/contracts").AuthResponse,
): import("@nuttie/contracts").AuthResponse {
  // Browser callers receive the refresh credential only as an HttpOnly cookie.
  if (browserSession(request)) {
    const { refreshToken: _refreshToken, ...withoutRefreshToken } = result;
    return withoutRefreshToken;
  }
  return result;
}

function clearRefreshCookie(config: RuntimeConfig): string {
  const secure = config.nodeEnv === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function bearerToken(request: IncomingMessage): string | undefined {
  const value = request.headers.authorization;
  if (!value) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1];
}

function errorDetails(error: ZodError): Record<string, unknown> {
  return {
    fields: error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    })),
  };
}

function errorResponse(
  error: unknown,
  requestId: string,
): { status: number; body: unknown } {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: apiError(error.code, error.message, error.details, requestId),
    };
  }
  if (error instanceof SyncPayloadSafetyError) {
    return {
      status: 400,
      body: apiError(
        "SENSITIVE_DATA_NOT_ALLOWED",
        "sensitive fields cannot be synchronized",
        { path: error.path },
        requestId,
      ),
    };
  }
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: apiError(
        "VALIDATION_ERROR",
        "request validation failed",
        errorDetails(error),
        requestId,
      ),
    };
  }
  if (error instanceof AuthError) {
    return {
      status: error.status,
      body: apiError(error.code, error.message, error.details, requestId),
    };
  }
  if (error instanceof RepositoryError) {
    const status =
      error.code === "EMAIL_TAKEN"
        ? 409
        : error.code === "BAD_CURSOR"
          ? 400
          : 503;
    const code = error.code === "BAD_CURSOR" ? "BAD_REQUEST" : error.code;
    return {
      status,
      body: apiError(code, error.message, error.details, requestId),
    };
  }
  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  return {
    status: 500,
    body: apiError(
      "INTERNAL_ERROR",
      "an unexpected error occurred",
      undefined,
      requestId,
    ),
  };
}

function isRoute(
  method: string | undefined,
  pathname: string,
  expectedMethod: string,
  expectedPath: string,
): boolean {
  return method === expectedMethod && pathname === expectedPath;
}

async function route(
  request: IncomingMessage,
  response: ServerResponse,
  context: ApiContext,
): Promise<void> {
  const host = request.headers.host || "localhost";
  const url = new URL(request.url || "/", `http://${host}`);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }
  if (
    isRoute(request.method, url.pathname, "GET", "/health") ||
    isRoute(request.method, url.pathname, "GET", "/api/v1/health")
  ) {
    sendJson(response, 200, {
      status: "ok",
      service: "nuttie-api",
      version: "v1",
    });
    return;
  }
  if (
    isRoute(request.method, url.pathname, "GET", "/ready") ||
    isRoute(request.method, url.pathname, "GET", "/api/v1/ready")
  ) {
    const readiness = await context.repository.ready();
    sendJson(response, readiness.ready ? 200 : 503, {
      status: readiness.ready ? "ready" : "not-ready",
      repository: context.repository.mode,
      detail: readiness.detail,
    });
    return;
  }
  if (isRoute(request.method, url.pathname, "POST", "/api/v1/auth/register")) {
    const input = RegisterInputSchema.parse(await readJson(request));
    const result = await context.auth.register(input);
    if (result.refreshToken && browserSession(request))
      response.setHeader(
        "set-cookie",
        refreshCookie(result.refreshToken, context.config),
      );
    sendJson(response, 201, { data: authPayload(request, result) });
    return;
  }
  if (isRoute(request.method, url.pathname, "POST", "/api/v1/auth/login")) {
    const input = LoginInputSchema.parse(await readJson(request));
    const result = await context.auth.login(input);
    if (result.refreshToken && browserSession(request))
      response.setHeader(
        "set-cookie",
        refreshCookie(result.refreshToken, context.config),
      );
    sendJson(response, 200, { data: authPayload(request, result) });
    return;
  }
  if (isRoute(request.method, url.pathname, "POST", "/api/v1/auth/refresh")) {
    const input = RefreshInputSchema.parse(await readJson(request));
    const result = await context.auth.refresh(
      input.refreshToken ?? parseCookie(request, COOKIE_NAME),
    );
    if (result.refreshToken && browserSession(request))
      response.setHeader(
        "set-cookie",
        refreshCookie(result.refreshToken, context.config),
      );
    sendJson(response, 200, { data: authPayload(request, result) });
    return;
  }
  if (isRoute(request.method, url.pathname, "POST", "/api/v1/auth/logout")) {
    const input = LogoutInputSchema.parse(await readJson(request));
    await context.auth.logout({
      refreshToken: input.refreshToken ?? parseCookie(request, COOKIE_NAME),
      accessToken: bearerToken(request),
    });
    if (browserSession(request))
      response.setHeader("set-cookie", clearRefreshCookie(context.config));
    sendJson(response, 200, { data: { loggedOut: true } });
    return;
  }
  if (isRoute(request.method, url.pathname, "GET", "/api/v1/sync")) {
    const user = await context.auth.authenticate(bearerToken(request));
    const query = z
      .object({
        cursor: z.string().optional(),
        limit: z.coerce.number().int().positive().max(500).default(100),
      })
      .parse({
        cursor: url.searchParams.get("cursor") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
      });
    const sync = await context.repository.listChanges(
      user.id,
      query.cursor,
      query.limit,
    );
    const result: SyncResponse = {
      cursor: sync.cursor,
      records: sync.records,
      serverRevision: sync.serverRevision,
      hasMore: sync.hasMore,
      ...(sync.hasMore ? { nextCursor: sync.cursor } : {}),
    };
    sendJson(response, 200, { data: result });
    return;
  }
  if (isRoute(request.method, url.pathname, "POST", "/api/v1/mutations")) {
    const user = await context.auth.authenticate(bearerToken(request));
    const mutation = normalizeMutationInput(await readJson(request));
    const committed = await context.repository.commitMutation(
      user.id,
      mutation,
      hashMutationFingerprint(mutation),
    );
    if (committed.status === "idempotency-conflict") {
      throw new HttpError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "clientMutationId was already used with different content",
        {
          clientMutationId: mutation.clientMutationId,
        },
      );
    }
    if (committed.status === "revision-conflict") {
      throw new HttpError(
        409,
        "REVISION_CONFLICT",
        "record revision is stale",
        {
          expected: committed.expected,
          actual: committed.actual,
          ...(committed.record ? { record: committed.record } : {}),
        },
      );
    }
    if (committed.status === "duplicate-record") {
      throw new HttpError(409, "DUPLICATE_RECORD", "record already exists", {
        record: committed.record,
      });
    }
    if (committed.status === "record-not-found") {
      throw new HttpError(404, "RECORD_NOT_FOUND", "record does not exist");
    }
    const result: MutationResponse = {
      clientMutationId: committed.clientMutationId,
      disposition: committed.status === "committed" ? "COMMITTED" : "REPLAYED",
      record: committed.record,
      cursor: committed.cursor,
      serverRevision: committed.serverRevision,
    };
    sendJson(response, committed.status === "committed" ? 201 : 200, {
      data: result,
    });
    return;
  }
  throw new HttpError(404, "NOT_FOUND", "route not found");
}

export function createApiServer(context: ApiContext): Server {
  return createServer(async (request, response) => {
    const requestId =
      typeof request.headers["x-request-id"] === "string"
        ? request.headers["x-request-id"].slice(0, 128)
        : randomUUID();
    response.setHeader("x-request-id", requestId);
    applyCors(request, response, context.config);
    try {
      await route(request, response, context);
    } catch (error) {
      if (response.headersSent) {
        response.destroy(error instanceof Error ? error : undefined);
        return;
      }
      const result = errorResponse(error, requestId);
      sendJson(response, result.status, result.body);
    }
  });
}

export type { ApiContext };
