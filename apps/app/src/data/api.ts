import type { LocalRecord, MutationDraft, Session } from "../types";
import { Platform } from "react-native";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL;
const API_BASE = (configuredBaseUrl || (typeof window !== "undefined" ? "/api" : "http://localhost:8787/api")).replace(/\/$/, "");

type ApiResponse<T> = { data?: T; error?: { code: string; message: string; details?: Record<string, unknown> }; requestId?: string };

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  headers.set("x-client-platform", Platform.OS === "web" ? "web" : "native");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T> & T;
  if (!response.ok) {
    const apiError = "error" in payload ? payload.error : undefined;
    throw new ApiRequestError(response.status, apiError?.code ?? "REQUEST_FAILED", apiError?.message ?? `请求失败（${response.status}）`, apiError?.details);
  }
  return ("data" in payload && payload.data !== undefined ? payload.data : payload) as T;
}

function authenticated(session: Omit<Session, "mode">): Session {
  return { ...session, mode: "authenticated" };
}

export async function login(email: string, password: string): Promise<Session> {
  return authenticated(await request<Omit<Session, "mode">>("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }));
}

export async function register(email: string, password: string, displayName: string): Promise<Session> {
  return authenticated(await request<Omit<Session, "mode">>("/v1/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) }));
}

/** Web sends no token: the server reads its secure httpOnly cookie. */
export async function refresh(refreshToken?: string): Promise<Session> {
  return authenticated(await request<Omit<Session, "mode">>("/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  }));
}

export async function logout(accessToken?: string, refreshToken?: string): Promise<void> {
  await request("/v1/auth/logout", { method: "POST", body: JSON.stringify(refreshToken ? { refreshToken } : {}) }, accessToken);
}

export async function pullSync(accessToken: string, cursor?: string): Promise<{ cursor: string; records: LocalRecord[] }> {
  return request<{ cursor: string; records: LocalRecord[] }>(`/v1/sync${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, {}, accessToken);
}

export async function pushMutation(accessToken: string, mutation: MutationDraft): Promise<{ clientMutationId: string; disposition: "COMMITTED" | "REPLAYED"; record: LocalRecord; cursor: string; serverRevision: number }> {
  return request<{ clientMutationId: string; disposition: "COMMITTED" | "REPLAYED"; record: LocalRecord; cursor: string; serverRevision: number }>("/v1/mutations", { method: "POST", body: JSON.stringify(mutation) }, accessToken);
}
