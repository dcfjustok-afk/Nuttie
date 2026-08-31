import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { PersistedSession, Session } from "../types";
import {
  DEVICE_KEY,
  getCacheKey,
  LEGACY_CACHE_KEY,
  SESSION_KEY,
  type CacheScope,
} from "./storage-policy";

export type { CacheScope } from "./storage-policy";
export { getCacheKey } from "./storage-policy";

export async function readCache<T>(scope: CacheScope = {}): Promise<T | null> {
  const key = getCacheKey(scope);
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function writeCache(
  value: unknown,
  scope: CacheScope = {},
): Promise<void> {
  await AsyncStorage.setItem(getCacheKey(scope), JSON.stringify(value));
}

export async function clearCache(scope: CacheScope = {}): Promise<void> {
  await AsyncStorage.removeItem(getCacheKey(scope));
}

/** Discard the pre-partition cache so an unknown account cannot inherit it. */
export async function discardLegacyCache(): Promise<void> {
  await AsyncStorage.removeItem(LEGACY_CACHE_KEY);
}

export async function readSession(): Promise<PersistedSession | null> {
  // A browser refresh token belongs only to the httpOnly cookie managed by the API.
  if (Platform.OS === "web") return null;
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as PersistedSession;
    if (
      parsed?.mode !== "authenticated" ||
      !parsed.refreshToken ||
      !parsed.user?.id
    ) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

export async function writeSession(session: Session): Promise<void> {
  if (Platform.OS === "web") {
    // Keep old pre-boundary values out of ordinary web storage.
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  if (session.mode !== "authenticated" || !session.refreshToken) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return;
  }
  const persisted: PersistedSession = {
    mode: "authenticated",
    refreshToken: session.refreshToken,
    user: session.user,
  };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(persisted), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function readDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const generated = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_KEY, generated);
  return generated;
}
