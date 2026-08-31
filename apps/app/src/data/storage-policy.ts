export const CACHE_KEY_PREFIX = "nuttie.cache.v1";
export const LEGACY_CACHE_KEY = CACHE_KEY_PREFIX;
export const SESSION_KEY = "nuttie.session.v1";
export const DEVICE_KEY = "nuttie.device.v1";

export type CacheScope = { userId?: string };

export function getCacheKey(scope: CacheScope = {}): string {
  return scope.userId
    ? `${CACHE_KEY_PREFIX}.account.${encodeURIComponent(scope.userId)}`
    : `${CACHE_KEY_PREFIX}.anonymous`;
}
