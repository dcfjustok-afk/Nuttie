import assert from "node:assert/strict";
import test from "node:test";

import {
  CACHE_KEY_PREFIX,
  DEVICE_KEY,
  getCacheKey,
  LEGACY_CACHE_KEY,
  selectCachedRecords,
  SESSION_KEY,
} from "./storage-policy.ts";

test("keeps anonymous and account caches in separate namespaces", () => {
  const anonymous = getCacheKey();
  const accountA = getCacheKey({ userId: "user-a" });
  const accountB = getCacheKey({ userId: "user-b" });

  assert.equal(anonymous, `${CACHE_KEY_PREFIX}.anonymous`);
  assert.equal(accountA, `${CACHE_KEY_PREFIX}.account.user-a`);
  assert.equal(accountB, `${CACHE_KEY_PREFIX}.account.user-b`);
  assert.notEqual(anonymous, accountA);
  assert.notEqual(accountA, accountB);
});

test("encodes account ids without allowing key traversal", () => {
  const key = getCacheKey({ userId: "a/b?c#d" });
  assert.equal(key, `${CACHE_KEY_PREFIX}.account.a%2Fb%3Fc%23d`);
  assert.equal(key.includes(".."), false);
});

test("keeps legacy, session, and device keys explicit", () => {
  assert.equal(LEGACY_CACHE_KEY, CACHE_KEY_PREFIX);
  assert.equal(SESSION_KEY, "nuttie.session.v1");
  assert.equal(DEVICE_KEY, "nuttie.device.v1");
});

test("preserves an explicit empty account cache and uses fallback when absent", () => {
  const seed = [{ id: "demo" }];
  assert.deepEqual(selectCachedRecords({ records: [] }, seed), []);
  assert.deepEqual(selectCachedRecords(null, seed), seed);
  assert.deepEqual(selectCachedRecords({ queue: [] }, seed), seed);
});
