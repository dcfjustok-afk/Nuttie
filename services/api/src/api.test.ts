import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import {
  assertSyncPayloadSafe,
  SyncPayloadSafetyError,
} from "@nuttie/contracts";
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

async function request(
  origin: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${origin}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-client-platform": "native",
      ...(init.headers ?? {}),
    },
  });
}

test("production configuration fails closed without a database and secret", () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: "production" }),
    ConfigurationError,
  );
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
      }),
    ConfigurationError,
  );
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
        ACCESS_TOKEN_SECRET:
          "replace-with-a-random-secret-at-least-32-characters",
        ALLOWED_ORIGINS: "https://nuttie.example",
      }),
    ConfigurationError,
  );
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
        ACCESS_TOKEN_SECRET: "a".repeat(40),
        ALLOWED_ORIGINS: "*",
      }),
    ConfigurationError,
  );
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
        ACCESS_TOKEN_SECRET: "a".repeat(40),
        ALLOWED_ORIGINS: "https://nuttie.example/app",
      }),
    ConfigurationError,
  );
  assert.throws(
    () =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
        ACCESS_TOKEN_SECRET: "a".repeat(40),
        ALLOWED_ORIGINS: "https://nuttie.example",
        PORT: "0",
      }),
    ConfigurationError,
  );
});

test("normalizes development origins and permits an ephemeral test port", () => {
  const config = loadConfig({
    NODE_ENV: "test",
    ALLOW_IN_MEMORY: "true",
    ACCESS_TOKEN_SECRET: "test-secret-that-is-long-enough-for-hmac",
    ALLOWED_ORIGINS: "http://localhost:3000/,http://localhost:3000",
    PORT: "0",
  });
  assert.equal(config.port, 0);
  assert.deepEqual(config.corsOrigins, ["http://localhost:3000"]);
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
    body: JSON.stringify({
      email: "Person@Example.com",
      password: "correct horse battery",
      displayName: "栗子",
    }),
  });
  assert.equal(registration.status, 201);
  const registered = (await registration.json()).data;
  assert.equal(registered.user.email, "person@example.com");
  assert.match(registered.accessToken, /^.+\..+\..+$/);
  assert.ok(registered.refreshToken);
  assert.equal(registration.headers.get("set-cookie"), null);

  const login = await request(origin, "/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "person@example.com",
      password: "correct horse battery",
    }),
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
    body: JSON.stringify({
      ...mutation,
      payload: { ...mutation.payload, title: "改写" },
    }),
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
    body: JSON.stringify({
      email: "web@example.com",
      password: "correct horse battery",
    }),
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

test("account export excludes secrets and confirmed deletion revokes the account", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const registration = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "lifecycle@example.com",
      password: "correct horse battery",
      displayName: "Lifecycle",
    }),
  });
  const session = (await registration.json()).data;
  const mutation = {
    clientMutationId: "lifecycle-record",
    entityType: "water",
    operation: "create",
    baseRevision: 0,
    payload: {
      id: "lifecycle-record",
      localDate: "2026-08-29",
      recordedAt: "2026-08-29T08:00:00Z",
      amount: 250,
      unit: "ml",
    },
  };
  const created = await request(origin, "/api/v1/mutations", {
    method: "POST",
    headers: { authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify(mutation),
  });
  assert.equal(created.status, 201);

  const exported = await request(origin, "/api/v1/account/export", {
    method: "GET",
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(exported.status, 200);
  assert.match(
    String(exported.headers.get("content-disposition")),
    /attachment; filename="nuttie-account-export\.json"/,
  );
  const exportBody = (await exported.json()).data;
  assert.equal(exportBody.schemaVersion, "NUTTIE_ACCOUNT_EXPORT_V1");
  assert.equal(exportBody.user.email, "lifecycle@example.com");
  assert.equal("passwordHash" in exportBody.user, false);
  assert.equal(exportBody.records.length, 1);
  assert.equal("refreshToken" in exportBody, false);
  assert.equal("tokenHash" in exportBody, false);

  const rejectedDelete = await request(origin, "/api/v1/account", {
    method: "DELETE",
    headers: { authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ confirmation: "delete" }),
  });
  assert.equal(rejectedDelete.status, 400);
  assert.equal((await rejectedDelete.json()).error.code, "VALIDATION_ERROR");

  const deleted = await request(origin, "/api/v1/account", {
    method: "DELETE",
    headers: { authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ confirmation: "DELETE" }),
  });
  assert.equal(deleted.status, 200);
  assert.deepEqual((await deleted.json()).data, { deleted: true });

  const oldAccess = await request(origin, "/api/v1/sync", {
    method: "GET",
    headers: { authorization: `Bearer ${session.accessToken}` },
  });
  assert.equal(oldAccess.status, 401);
  const oldRefresh = await request(origin, "/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  assert.equal(oldRefresh.status, 401);

  const recreated = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "lifecycle@example.com",
      password: "correct horse battery",
    }),
  });
  assert.equal(recreated.status, 201);
});

test("sync rejects credential and raw AI fields without echoing their values", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const registration = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "privacy@example.com",
      password: "correct horse battery",
    }),
  });
  const auth = (await registration.json()).data;
  const headers = { authorization: `Bearer ${auth.accessToken}` };
  const cases = [
    {
      id: "privacy-api-key",
      details: { API_KEY: "sk-live-test-value" },
      expectedPath: /payload\.details\.API_KEY/,
      forbiddenValues: /sk-live-test-value/,
    },
    {
      id: "privacy-nested-authorization",
      details: { metadata: { Authorization: "Bearer private-value" } },
      expectedPath: /payload\.details\.metadata\.Authorization/,
      forbiddenValues: /Bearer private-value/,
    },
    {
      id: "privacy-array-raw-ai",
      details: [{ raw_AI_payload: { prompt: "private meal photo" } }],
      expectedPath: /payload\.details\[0\]\.raw_AI_payload/,
      forbiddenValues: /private meal photo/,
    },
  ] as const;
  for (const item of cases) {
    const response = await request(origin, "/api/v1/mutations", {
      method: "POST",
      headers,
      body: JSON.stringify({
        clientMutationId: item.id,
        entityType: "meal",
        operation: "create",
        baseRevision: 0,
        payload: {
          id: item.id,
          recordedAt: "2026-08-29T08:00:00Z",
          localDate: "2026-08-29",
          details: item.details,
        },
      }),
    });
    assert.equal(response.status, 400);
    const body = await response.text();
    assert.doesNotMatch(body, item.forbiddenValues);
    const parsed = JSON.parse(body);
    assert.equal(parsed.error.code, "SENSITIVE_DATA_NOT_ALLOWED");
    assert.match(parsed.error.details.path, item.expectedPath);
  }
});

test("sync safety permits shared values but rejects recursive cycles", () => {
  const shared = { label: "safe" };
  assert.doesNotThrow(() =>
    assertSyncPayloadSafe({ left: shared, right: shared }),
  );

  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.throws(
    () => assertSyncPayloadSafe(cyclic),
    (error) =>
      error instanceof SyncPayloadSafetyError && error.path === "payload.self",
  );
});

test("a refresh token can be rotated only once under concurrent requests", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const registration = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "rotation@example.com",
      password: "correct horse battery",
    }),
  });
  const session = (await registration.json()).data;
  assert.ok(session.refreshToken);

  const attempts = await Promise.all([
    request(origin, "/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }),
    request(origin, "/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }),
  ]);
  assert.deepEqual(
    attempts.map((response) => response.status).sort(),
    [200, 401],
  );
  const rejected = attempts.find((response) => response.status === 401);
  assert.ok(rejected);
  assert.equal((await rejected.json()).error.code, "INVALID_REFRESH_TOKEN");
});

test("a malformed refresh cookie is rejected without becoming an internal error", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const response = await request(origin, "/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "x-client-platform": "web",
      cookie: "nuttie_refresh=%E0%A4%A",
    },
    body: "{}",
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "INVALID_REFRESH_TOKEN");
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
  assert.match(
    String(response.headers.get("access-control-allow-headers")),
    /x-client-platform/,
  );
  assert.match(
    String(response.headers.get("access-control-allow-methods")),
    /DELETE/,
  );
});

test("stale baseRevision returns a conflict without changing data", async (t) => {
  const { application, origin } = await startTestApplication();
  t.after(() => application.close());
  const registration = await request(origin, "/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "revision@example.com",
      password: "correct horse battery",
    }),
  });
  const auth = (await registration.json()).data;
  const headers = { authorization: `Bearer ${auth.accessToken}` };
  const base = {
    entityType: "water",
    operation: "create",
    baseRevision: 0,
    payload: {
      id: "water-1",
      localDate: "2026-08-29",
      recordedAt: "2026-08-29T01:00:00Z",
      amount: 250,
      unit: "ml",
    },
  };
  const first = await request(origin, "/api/v1/mutations", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...base, clientMutationId: "water-1" }),
  });
  assert.equal(first.status, 201);
  const stale = await request(origin, "/api/v1/mutations", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...base,
      clientMutationId: "water-2",
      operation: "update",
      baseRevision: 0,
      payload: { ...base.payload, id: "water-1", amount: 500 },
    }),
  });
  assert.equal(stale.status, 409);
  const staleBody = await stale.json();
  assert.equal(staleBody.error.code, "REVISION_CONFLICT");
  assert.equal(staleBody.error.details.actual, 1);
});
