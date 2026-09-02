import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOrigin, parseTimeout, runSmoke } from "./production-smoke.mjs";

function response(status, body, headers) {
  return {
    status,
    headers: new Headers(headers),
    async text() {
      return body;
    },
  };
}

test("production smoke checks the public Web gateway and readiness proxy", async () => {
  const requests = [];
  const fakeFetch = async (url) => {
    requests.push(url);
    if (url.endsWith("/healthz")) {
      return response(200, "ok\n", {
        "content-security-policy": "default-src 'self'",
        "referrer-policy": "no-referrer",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff",
      });
    }
    if (url.endsWith("/api/v1/ready")) {
      return response(200, JSON.stringify({ status: "ready" }), {
        "content-type": "application/json",
      });
    }
    if (url.endsWith("/.env") || url.endsWith("/.git/HEAD")) {
      return response(404, "", { "content-type": "text/plain" });
    }
    return response(200, "<html><title>Nuttie</title></html>", {
      "content-type": "text/html; charset=utf-8",
    });
  };

  const report = await runSmoke({ WEB_URL: "https://nuttie.example", SMOKE_TIMEOUT_MS: "1000" }, fakeFetch);

  assert.deepEqual(report.checks, ["healthz", "security-headers", "api-ready", "sign-in", "hidden-paths"]);
  assert.deepEqual(requests, [
    "https://nuttie.example/healthz",
    "https://nuttie.example/api/v1/ready",
    "https://nuttie.example/sign-in",
    "https://nuttie.example/.env",
    "https://nuttie.example/.git/HEAD",
  ]);
});

test("production smoke accepts only a bare HTTPS origin", () => {
  assert.equal(normalizeOrigin("https://nuttie.example/"), "https://nuttie.example");
  assert.throws(() => normalizeOrigin("http://nuttie.example"), /https/);
  assert.throws(() => normalizeOrigin("https://nuttie.example/app"), /origin/);
  assert.throws(() => normalizeOrigin("https://user:pass@nuttie.example"), /origin/);
});

test("production smoke validates timeout bounds", () => {
  assert.equal(parseTimeout(undefined), 10_000);
  assert.equal(parseTimeout("5000"), 5000);
  assert.throws(() => parseTimeout("0"), /between 1 and 60000/);
  assert.throws(() => parseTimeout("60001"), /between 1 and 60000/);
});

test("production smoke fails closed when readiness is unavailable", async () => {
  const fakeFetch = async (url) => {
    if (url.endsWith("/healthz")) {
      return response(200, "ok\n", {
        "content-security-policy": "default-src 'self'",
        "referrer-policy": "no-referrer",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff",
      });
    }
    return response(503, JSON.stringify({ status: "not-ready" }), {
      "content-type": "application/json",
    });
  };

  await assert.rejects(
    runSmoke({ WEB_URL: "https://nuttie.example" }, fakeFetch),
    /\/api\/v1\/ready returned HTTP 503/,
  );
});

test("production smoke fails closed when hidden paths fall through to the SPA", async () => {
  const fakeFetch = async (url) => {
    if (url.endsWith("/healthz")) {
      return response(200, "ok\n", {
        "content-security-policy": "default-src 'self'",
        "referrer-policy": "no-referrer",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff",
      });
    }
    if (url.endsWith("/api/v1/ready")) {
      return response(200, JSON.stringify({ status: "ready" }), {
        "content-type": "application/json",
      });
    }
    if (url.endsWith("/sign-in")) {
      return response(200, "<html><title>Nuttie</title></html>", {
        "content-type": "text/html; charset=utf-8",
      });
    }
    return response(200, "<html><title>Nuttie</title></html>", {
      "content-type": "text/html; charset=utf-8",
    });
  };

  await assert.rejects(
    runSmoke({ WEB_URL: "https://nuttie.example" }, fakeFetch),
    /\/\.env returned HTTP 200/,
  );
});
