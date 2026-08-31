import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { PersistedSession, Session } from "../types";

const CACHE_KEY = "nuttie.cache.v1";
const SESSION_KEY = "nuttie.session.v1";
const DEVICE_KEY = "nuttie.device.v1";

export async function readCache<T>(): Promise<T | null> {
  const value = await AsyncStorage.getItem(CACHE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    await AsyncStorage.removeItem(CACHE_KEY);
    return null;
  }
}

export async function writeCache(value: unknown): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(value));
}

export async function readSession(): Promise<PersistedSession | null> {
  // A browser refresh token belongs only to the httpOnly cookie managed by the API.
  if (Platform.OS === "web") return null;
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as PersistedSession;
    if (parsed?.mode !== "authenticated" || !parsed.refreshToken || !parsed.user?.id) {
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
  const persisted: PersistedSession = { mode: "authenticated", refreshToken: session.refreshToken, user: session.user };
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
