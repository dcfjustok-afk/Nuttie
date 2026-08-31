import {
  createHmac,
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import {
  AuthResponseSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type User,
} from "@nuttie/contracts";
import {
  RepositoryError,
  type Repository,
  type SessionRecord,
  type UserRecord,
} from "./store.js";

const PASSWORD_PREFIX = "scrypt-v1";

function deriveScrypt(
  password: string,
  salt: Buffer,
  length: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      length,
      { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived as Buffer);
      },
    );
  });
}

type AccessClaims = {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
  typ: "access";
};

export class AuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status = 401,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function asUser(record: UserRecord): User {
  const { passwordHash: _passwordHash, ...user } = record;
  return clone(user);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await deriveScrypt(password, salt, 64);
  return `${PASSWORD_PREFIX}$${base64url(salt)}$${base64url(derived)}`;
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 3 || parts[0] !== PASSWORD_PREFIX) return false;
  try {
    const salt = fromBase64url(parts[1] as string);
    const expected = fromBase64url(parts[2] as string);
    if (salt.length < 16 || expected.length !== 64) return false;
    const actual = await deriveScrypt(password, salt, expected.length);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

function tokenSignature(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function issueAccessToken(
  userId: string,
  sessionId: string,
  secret: string,
  ttlSeconds: number,
  nowMs: number,
): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "NUTTIE" }));
  const now = Math.floor(nowMs / 1000);
  const payload: AccessClaims = {
    sub: userId,
    sid: sessionId,
    iat: now,
    exp: now + ttlSeconds,
    typ: "access",
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${header}.${encodedPayload}`;
  return `${data}.${tokenSignature(data, secret)}`;
}

function decodeAccessToken(
  token: string,
  secret: string,
  nowMs: number,
): AccessClaims {
  const parts = token.split(".");
  if (parts.length !== 3)
    throw new AuthError("UNAUTHORIZED", "invalid access token");
  const header = parts[0] as string;
  const payload = parts[1] as string;
  const signature = parts[2] as string;
  const expected = fromBase64url(
    tokenSignature(`${header}.${payload}`, secret),
  );
  const actual = fromBase64url(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    throw new AuthError("UNAUTHORIZED", "invalid access token");
  let decoded: unknown;
  try {
    decoded = JSON.parse(fromBase64url(payload).toString("utf8"));
  } catch {
    throw new AuthError("UNAUTHORIZED", "invalid access token");
  }
  if (!decoded || typeof decoded !== "object")
    throw new AuthError("UNAUTHORIZED", "invalid access token");
  const claims = decoded as Partial<AccessClaims>;
  const now = Math.floor(nowMs / 1000);
  if (
    claims.typ !== "access" ||
    typeof claims.sub !== "string" ||
    typeof claims.sid !== "string" ||
    typeof claims.exp !== "number" ||
    claims.exp <= now
  ) {
    throw new AuthError("UNAUTHORIZED", "access token expired");
  }
  return claims as AccessClaims;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry(nowMs: number, ttlSeconds: number): string {
  return new Date(nowMs + ttlSeconds * 1000).toISOString();
}

export type AuthServiceOptions = {
  repository: Repository;
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  now?: () => number;
};

type PendingSession = {
  refreshToken: string;
  record: SessionRecord;
  issuedAt: number;
};

export class AuthService {
  private readonly repository: Repository;
  private readonly secret: string;
  private readonly accessTtl: number;
  private readonly refreshTtl: number;
  private readonly now: () => number;

  constructor(options: AuthServiceOptions) {
    this.repository = options.repository;
    this.secret = options.accessTokenSecret;
    this.accessTtl = options.accessTokenTtlSeconds;
    this.refreshTtl = options.refreshTokenTtlSeconds;
    this.now = options.now ?? (() => Date.now());
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const email = normalizeEmail(input.email);
    const existing = await this.repository.findUserByEmail(email);
    if (existing)
      throw new AuthError(
        "EMAIL_TAKEN",
        "an account with this email already exists",
        409,
      );
    const now = new Date(this.now()).toISOString();
    const user: UserRecord = {
      id: `usr_${randomUUID()}`,
      email,
      displayName: input.displayName,
      ...(input.timezone ? { timezone: input.timezone } : {}),
      createdAt: now,
      revision: 0,
      passwordHash: await hashPassword(input.password),
    };
    try {
      await this.repository.createUser(user);
    } catch (error) {
      if (error instanceof RepositoryError && error.code === "EMAIL_TAKEN")
        throw new AuthError("EMAIL_TAKEN", error.message, 409);
      throw error;
    }
    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.repository.findUserByEmail(
      normalizeEmail(input.email),
    );
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "email or password is incorrect",
        401,
      );
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResponse> {
    if (!refreshToken)
      throw new AuthError(
        "INVALID_REFRESH_TOKEN",
        "refresh token is required",
        401,
      );
    const refreshHash = tokenHash(refreshToken);
    const now = this.now();
    const session = await this.repository.findSessionByTokenHash(refreshHash);
    if (!session || session.revokedAt || Date.parse(session.expiresAt) <= now) {
      throw new AuthError(
        "INVALID_REFRESH_TOKEN",
        "refresh token is invalid or expired",
        401,
      );
    }
    const user = await this.repository.findUserById(session.userId);
    if (!user)
      throw new AuthError(
        "INVALID_REFRESH_TOKEN",
        "session user no longer exists",
        401,
      );
    const replacement = this.createPendingSession(user, now);
    const consumed = await this.repository.rotateSession(
      refreshHash,
      new Date(now).toISOString(),
      replacement.record,
    );
    if (!consumed)
      throw new AuthError(
        "INVALID_REFRESH_TOKEN",
        "refresh token is invalid or expired",
        401,
      );
    return this.authResponse(user, replacement);
  }

  async logout(input: {
    refreshToken?: string;
    accessToken?: string;
  }): Promise<void> {
    let sessionId: string | undefined;
    if (input.refreshToken) {
      const session = await this.repository.findSessionByTokenHash(
        tokenHash(input.refreshToken),
      );
      sessionId = session?.id;
    }
    if (!sessionId && input.accessToken) {
      try {
        sessionId = decodeAccessToken(
          input.accessToken,
          this.secret,
          this.now(),
        ).sid;
      } catch {
        // Logout is idempotent even when an already expired access token is supplied.
      }
    }
    if (sessionId)
      await this.repository.revokeSession(
        sessionId,
        new Date(this.now()).toISOString(),
      );
  }

  async authenticate(accessToken: string | undefined): Promise<User> {
    if (!accessToken)
      throw new AuthError("UNAUTHORIZED", "authorization is required", 401);
    const claims = decodeAccessToken(accessToken, this.secret, this.now());
    const session = await this.repository.findSessionById(claims.sid);
    if (
      !session ||
      session.revokedAt ||
      Date.parse(session.expiresAt) <= this.now() ||
      session.userId !== claims.sub
    ) {
      throw new AuthError("UNAUTHORIZED", "session is no longer active", 401);
    }
    const user = await this.repository.findUserById(claims.sub);
    if (!user)
      throw new AuthError("UNAUTHORIZED", "account no longer exists", 401);
    return asUser(user);
  }

  private async issueSession(user: UserRecord): Promise<AuthResponse> {
    const pending = this.createPendingSession(user, this.now());
    await this.repository.createSession(pending.record);
    return this.authResponse(user, pending);
  }

  private createPendingSession(user: UserRecord, now: number): PendingSession {
    const refreshToken = randomBytes(48).toString("base64url");
    const session: SessionRecord = {
      id: `ses_${randomUUID()}`,
      userId: user.id,
      tokenHash: tokenHash(refreshToken),
      expiresAt: sessionExpiry(now, this.refreshTtl),
      createdAt: new Date(now).toISOString(),
    };
    return { refreshToken, record: session, issuedAt: now };
  }

  private authResponse(
    user: UserRecord,
    pending: PendingSession,
  ): AuthResponse {
    const response: AuthResponse = {
      user: asUser(user),
      accessToken: issueAccessToken(
        user.id,
        pending.record.id,
        this.secret,
        this.accessTtl,
        pending.issuedAt,
      ),
      refreshToken: pending.refreshToken,
      tokenType: "Bearer",
      expiresIn: this.accessTtl,
      refreshExpiresAt: pending.record.expiresAt,
    };
    return AuthResponseSchema.parse(response);
  }
}

export { decodeAccessToken, tokenHash };
