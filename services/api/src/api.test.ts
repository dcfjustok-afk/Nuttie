import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApplication } from "./index.js";
import { loadConfig, ConfigurationError } from "./config.js";

async function startTestApplication() {
  const application = createApplication({
    NODE_ENV: "test",
    ALLOW_IN_MEMORY: "true",
    ACCESS_TOKEN_SECRET: "test-secret-that-is-long-enough-for-hmac",
    PORT: "0",
    ALLOWED_ORIGINS: "http://localhost:3000",
  });
  application.server.listen(0, "127.0.0.1");
  await once(application.server, "listening");
  const address = application.server.address();
  assert.ok(address && typeof address === "object");
  return { application, origin: `http://127.0.0.1:${address.port}` };
}

async function request(origin: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${origin}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

test("production configuration fails closed without a database and secret", () => {
  assert.throws(() => loadConfig({ NODE_ENV: "production" }), ConfigurationError);
  assert.throws(() => loadConfig({ NODE_ENV: "production", DATABASE_URL: "postgres://example" }), ConfigurationError);
});

test("health and readiness are available in memory", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const health = await request(origin, "/health", { method: "GET" });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  const ready = await request(origin, "/ready", { method: "GET" });
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).status, "ready");
});

test("register/login/refresh/logout and mutation idempotency work end to end", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());

  const registration = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "Person@Example.com", password: "correct horse battery", displayName: "栗子" }),
  });
  assert.equal(registration.status, 201);
  const registered = (await registration.json()).data;
  assert.equal(registered.user.email, "person@example.com");
  assert.match(registered.accessToken, /^.+\..+\..+$/);
  assert.ok(registered.refreshToken);

  const login = await request(origin, "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "person@example.com", password: "correct horse battery" }),
  });
  assert.equal(login.status, 200);
  const loggedIn = (await login.json()).data;

  const mutation = {
    clientMutationId: "client-1",
    deviceId: "device-test",
    entityId: "meal-1",
    clientCreatedAt: "2026-08-29T00:00:00Z",
    entityType: "meal",
    operation: "create",
    baseRevision: 0,
    payload: {
      id: "meal-1",
      localDate: "2026-08-29",
      recordedAt: "2026-08-29T08:00:00+08:00",
      title: "早餐",
      nutrition: {
        sourceId: "manual",
        sourceVersion: "v1",
        values: {
          energyKcal: 400,
          proteinG: 20,
          carbohydrateG: 30,
          fatG: 10,
          fiberG: null,
          sugarG: 4,
          sodiumMg: 100,
        },
      },
    },
  };
  const created = await request(origin, "/api/v1/mutations", {
    method: "POST",
    headers: { authorization: `Bearer ${loggedIn.accessToken}` },
    body: JSON.stringify(mutation),
  });
  assert.equal(created.status, 201);
  const createdBody = (await created.json()).data;
  assert.equal(createdBody.disposition, "COMMITTED");
  assert.equal(createdBody.record.revision, 1);

  const replay = await request(origin, "/api/v1/mutations", {
    method: "POST",
    headers: { authorization: `Bearer ${loggedIn.accessToken}` },
    body: JSON.stringify(mutation),
  });
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).data.disposition, "REPLAYED");

  const conflict = await request(origin, "/api/v1/mutations", {
    method: "POST",
    headers: { authorization: `Bearer ${loggedIn.accessToken}` },
    body: JSON.stringify({ ...mutation, payload: { ...mutation.payload, title: "改写" } }),
  });
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error.code, "IDEMPOTENCY_CONFLICT");

  const sync = await request(origin, "/api/v1/sync", {
    method: "GET",
    headers: { authorization: `Bearer ${loggedIn.accessToken}` },
  });
  assert.equal(sync.status, 200);
  const syncBody = (await sync.json()).data;
  assert.equal(syncBody.records.length, 1);
  assert.equal(syncBody.records[0].nutrition.values.energyKcal, 400);

  const refreshed = await request(origin, "/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: registered.refreshToken }),
  });
  assert.equal(refreshed.status, 200);
  const refreshedBody = (await refreshed.json()).data;
  assert.notEqual(refreshedBody.accessToken, registered.accessToken);

  const loggedOut = await request(origin, "/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refreshedBody.refreshToken }),
  });
  assert.equal(loggedOut.status, 200);
  const unauthorized = await request(origin, "/api/v1/sync", {
    method: "GET",
    headers: { authorization: `Bearer ${refreshedBody.accessToken}` },
  });
  assert.equal(unauthorized.status, 401);
});

test("browser auth responses keep refresh credentials in the HttpOnly cookie", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const response = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    headers: { origin: "http://localhost:3000", "x-client-platform": "web" },
    body: JSON.stringify({ email: "web@example.com", password: "correct horse battery" }),
  });
  assert.equal(response.status, 201);
  const body = (await response.json()).data;
  assert.equal("refreshToken" in body, false);
  const cookie = String(response.headers.get("set-cookie"));
  assert.match(cookie, /Path=\/api\/v1\/auth/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  const refreshToken = /nuttie_refresh=([^;]+)/.exec(cookie)?.[1];
  assert.ok(refreshToken);
  const refreshed = await request(origin, "/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "x-client-platform": "web",
      cookie: `nuttie_refresh=${refreshToken}`,
    },
    body: "{}",
  });
  assert.equal(refreshed.status, 200);
  assert.equal("refreshToken" in (await refreshed.json()).data, false);
});

test("web preflight allows the platform header used by cookie clients", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const response = await request(origin, "/api/v1/auth/refresh", {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:3000",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type, x-client-platform",
    },
  });
  assert.equal(response.status, 204);
  assert.match(String(response.headers.get("access-control-allow-headers")), /x-client-platform/);
});

test("stale baseRevision returns a conflict without changing data", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const registration = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "revision@example.com", password: "correct horse battery" }),
  });
  const auth = (await registration.json()).data;
  const headers = { authorization: `Bearer ${auth.accessToken}` };
  const base = {
    entityType: "water",
    operation: "create",
    baseRevision: 0,
    payload: { id: "water-1", localDate: "2026-08-29", recordedAt: "2026-08-29T01:00:00Z", amount: 250, unit: "ml" },
  };
  const first = await request(origin, "/api/v1/mutations", { method: "POST", headers, body: JSON.stringify({ ...base, clientMutationId: "water-1" }) });
  assert.equal(first.status, 201);
  const stale = await request(origin, "/api/v1/mutations", { method: "POST", headers, body: JSON.stringify({ ...base, clientMutationId: "water-2", operation: "update", baseRevision: 0, payload: { ...base.payload, id: "water-1", amount: 500 } }) });
  assert.equal(stale.status, 409);
  const staleBody = await stale.json();
  assert.equal(staleBody.error.code, "REVISION_CONFLICT");
  assert.equal(staleBody.error.details.actual, 1);
});
