import { randomBytes } from "node:crypto";

export type RuntimeConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  allowInMemory: boolean;
  databaseUrl?: string;
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  corsOrigins: string[];
};

export class ConfigurationError extends Error {
  readonly code = "INVALID_CONFIGURATION";
}

function positiveInteger(
  value: string | undefined,
  fallback: number,
  field: string,
  allowZero = false,
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) {
    throw new ConfigurationError(`${field} must be a positive integer`);
  }
  return parsed;
}

const PLACEHOLDER_SECRET_PATTERNS = [
  /replace[-_ ]with/i,
  /change[-_ ]me/i,
  /your[-_ ]/i,
  /example/i,
];

function validateOrigins(value: string | undefined, nodeEnv: string): string[] {
  const raw =
    value === undefined || value.trim() === ""
      ? nodeEnv === "production"
        ? []
        : ["http://localhost:8081", "http://localhost:8787"]
      : value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean);
  const origins = raw.map((origin) => {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new ConfigurationError(
        "ALLOWED_ORIGINS must contain valid HTTP(S) origins",
      );
    }
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new ConfigurationError(
        "ALLOWED_ORIGINS must contain valid HTTP(S) origins",
      );
    }
    return parsed.origin;
  });
  if (nodeEnv === "production" && origins.length === 0) {
    throw new ConfigurationError("ALLOWED_ORIGINS is required in production");
  }
  return [...new Set(origins)];
}

/** Parse environment once at the process boundary; never silently fall back in production. */
export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const nodeEnv = env.NODE_ENV?.trim() || "development";
  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  const explicitlyInMemory =
    env.ALLOW_IN_MEMORY?.trim().toLowerCase() === "true";
  const explicitlyDisabled =
    env.ALLOW_IN_MEMORY?.trim().toLowerCase() === "false";
  const allowInMemory =
    nodeEnv !== "production" &&
    (explicitlyInMemory || (!explicitlyDisabled && databaseUrl === undefined));
  if (nodeEnv === "production" && databaseUrl === undefined) {
    throw new ConfigurationError(
      "DATABASE_URL is required when NODE_ENV=production",
    );
  }
  const configuredSecret = env.ACCESS_TOKEN_SECRET?.trim();
  if (
    nodeEnv === "production" &&
    (!configuredSecret ||
      configuredSecret.length < 32 ||
      PLACEHOLDER_SECRET_PATTERNS.some((pattern) =>
        pattern.test(configuredSecret),
      ))
  ) {
    throw new ConfigurationError(
      "ACCESS_TOKEN_SECRET (at least 32 characters) is required in production",
    );
  }
  const port = positiveInteger(
    env.PORT,
    8787,
    "PORT",
    nodeEnv !== "production",
  );
  const secret = configuredSecret || randomBytes(32).toString("base64url");
  const origins = validateOrigins(env.ALLOWED_ORIGINS, nodeEnv);
  return {
    nodeEnv,
    host: env.HOST?.trim() || "0.0.0.0",
    port,
    allowInMemory,
    ...(databaseUrl ? { databaseUrl } : {}),
    accessTokenSecret: secret,
    accessTokenTtlSeconds: positiveInteger(
      env.ACCESS_TOKEN_TTL_SECONDS,
      15 * 60,
      "ACCESS_TOKEN_TTL_SECONDS",
    ),
    refreshTokenTtlSeconds: positiveInteger(
      env.REFRESH_TOKEN_TTL_SECONDS,
      30 * 24 * 60 * 60,
      "REFRESH_TOKEN_TTL_SECONDS",
    ),
    corsOrigins: origins,
  };
}
