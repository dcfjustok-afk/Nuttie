import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 10_000;

export function normalizeOrigin(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    throw new Error("WEB_URL is required");
  }

  const url = new URL(rawValue.trim());
  if (url.protocol !== "https:") {
    throw new Error("WEB_URL must use https");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("WEB_URL must be an HTTPS origin without credentials, path, query, or hash");
  }
  return url.origin;
}

export function parseTimeout(rawValue) {
  if (rawValue === undefined || rawValue === "") return DEFAULT_TIMEOUT_MS;
  const timeout = Number(rawValue);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60_000) {
    throw new Error("SMOKE_TIMEOUT_MS must be an integer between 1 and 60000");
  }
  return timeout;
}

function requireStatus(check, response, expected) {
  if (response.status !== expected) {
    throw new Error(`${check} returned HTTP ${response.status}; expected ${expected}`);
  }
}

function requireHeader(check, response, name, expected) {
  const value = response.headers.get(name);
  if (value === null || (expected && value !== expected)) {
    throw new Error(`${check} is missing required ${name} header`);
  }
}

export async function runSmoke(env = process.env, fetchImpl = globalThis.fetch) {
  const origin = normalizeOrigin(env.WEB_URL);
  const timeoutMs = parseTimeout(env.SMOKE_TIMEOUT_MS);

  async function get(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${origin}${path}`, {
        headers: { accept: "application/json, text/html" },
        redirect: "manual",
        signal: controller.signal,
      });
      return { response, body: await response.text() };
    } finally {
      clearTimeout(timer);
    }
  }

  const health = await get("/healthz");
  requireStatus("/healthz", health.response, 200);
  if (health.body.trim() !== "ok") {
    throw new Error("/healthz did not return the expected body");
  }
  requireHeader("/healthz", health.response, "x-content-type-options", "nosniff");
  requireHeader("/healthz", health.response, "referrer-policy", "no-referrer");
  requireHeader("/healthz", health.response, "content-security-policy");
  requireHeader("/healthz", health.response, "strict-transport-security");

  const readiness = await get("/api/v1/ready");
  requireStatus("/api/v1/ready", readiness.response, 200);
  let readinessPayload;
  try {
    readinessPayload = JSON.parse(readiness.body);
  } catch {
    throw new Error("/api/v1/ready did not return JSON");
  }
  if (readinessPayload.status !== "ready") {
    throw new Error("/api/v1/ready did not report ready");
  }

  const signIn = await get("/sign-in");
  requireStatus("/sign-in", signIn.response, 200);
  const contentType = signIn.response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") || !signIn.body.includes("Nuttie")) {
    throw new Error("/sign-in did not return the Nuttie HTML entrypoint");
  }

  return {
    origin,
    checks: ["healthz", "security-headers", "api-ready", "sign-in"],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSmoke()
    .then((report) => {
      console.log(`[production-smoke] passed ${report.checks.join(", ")} at ${report.origin}`);
    })
    .catch((error) => {
      console.error(`[production-smoke] failed: ${error.message}`);
      process.exitCode = 1;
    });
}
