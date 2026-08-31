import { create } from "zustand";
import { Platform } from "react-native";
import type { AccountExport } from "@nuttie/contracts";

import * as api from "../data/api";
import {
  clearSession,
  readCache,
  readDeviceId,
  readSession,
  writeCache,
  writeSession,
} from "../data/storage";
import type { LocalRecord, MutationDraft, RecordKind, Session } from "../types";

type Store = {
  hydrated: boolean;
  session: Session | null;
  records: LocalRecord[];
  queue: MutationDraft[];
  cursor?: string;
  isSyncing: boolean;
  lastSyncError?: string;
  hydrate: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  exportAccount: () => Promise<AccountExport>;
  deleteAccount: () => Promise<void>;
  addRecord: (input: {
    kind: RecordKind;
    title: string;
    subtitle: string;
    amount?: number;
    unit?: string;
    energyKcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }) => Promise<void>;
  sync: () => Promise<void>;
};

const seedRecords: LocalRecord[] = [
  {
    id: "seed-breakfast",
    kind: "meal",
    title: "燕麦酸奶碗",
    subtitle: "早餐 · 08:10",
    amount: 1,
    unit: "份",
    energyKcal: 410,
    proteinG: 22,
    carbsG: 48,
    fatG: 14,
    recordedAt: new Date().toISOString(),
    source: "manual",
    revision: 1,
    syncStatus: "synced",
  },
  {
    id: "seed-water",
    kind: "water",
    title: "饮水",
    subtitle: "上午 · 10:25",
    amount: 350,
    unit: "ml",
    recordedAt: new Date().toISOString(),
    source: "manual",
    revision: 1,
    syncStatus: "synced",
  },
  {
    id: "seed-weight",
    kind: "weight",
    title: "体重记录",
    subtitle: "今天 · 07:45",
    amount: 63.4,
    unit: "kg",
    recordedAt: new Date().toISOString(),
    source: "manual",
    revision: 1,
    syncStatus: "synced",
  },
];

function persist(state: Pick<Store, "records" | "queue" | "cursor">) {
  return writeCache(state);
}

export const useAppStore = create<Store>((set, get) => ({
  hydrated: false,
  session: null,
  records: seedRecords,
  queue: [],
  cursor: undefined,
  isSyncing: false,
  lastSyncError: undefined,

  hydrate: async () => {
    const [cacheRaw, persisted] = await Promise.all([
      readCache<Pick<Store, "records" | "queue" | "cursor">>(),
      readSession(),
    ]);
    let session: Session | null = null;
    try {
      // Web restores through the cookie; native restores through SecureStore.
      session =
        Platform.OS === "web"
          ? await api.refresh()
          : persisted
            ? await api.refresh(persisted.refreshToken)
            : null;
    } catch {
      if (persisted) await clearSession();
    }
    set({
      hydrated: true,
      session,
      records: cacheRaw?.records?.length ? cacheRaw.records : seedRecords,
      queue: cacheRaw?.queue ?? [],
      cursor: cacheRaw?.cursor,
    });
    if (session?.mode === "authenticated") void get().sync();
  },

  signIn: async (session) => {
    await writeSession(session);
    set({ session, lastSyncError: undefined });
    if (session.mode === "authenticated") await get().sync();
  },

  signOut: async () => {
    const session = get().session;
    if (session?.mode === "authenticated")
      await api
        .logout(session.accessToken, session.refreshToken)
        .catch(() => undefined);
    await clearSession();
    set({ session: null, queue: [], cursor: undefined });
  },

  exportAccount: async () => {
    const session = get().session;
    if (!session || session.mode !== "authenticated") {
      throw new Error("account export requires an authenticated session");
    }
    try {
      return await api.exportAccount(session.accessToken);
    } catch (error) {
      if (!(error instanceof api.ApiRequestError) || error.status !== 401) {
        throw error;
      }
      const refreshed = await api.refresh(session.refreshToken);
      await writeSession(refreshed);
      set({ session: refreshed });
      return api.exportAccount(refreshed.accessToken);
    }
  },

  deleteAccount: async () => {
    const session = get().session;
    if (!session || session.mode !== "authenticated") {
      throw new Error("account deletion requires an authenticated session");
    }
    try {
      await api.deleteAccount(session.accessToken);
    } catch (error) {
      if (!(error instanceof api.ApiRequestError) || error.status !== 401) {
        throw error;
      }
      const refreshed = await api.refresh(session.refreshToken);
      await writeSession(refreshed);
      set({ session: refreshed });
      await api.deleteAccount(refreshed.accessToken);
    }
    await clearSession();
    const cleared = { records: [], queue: [], cursor: undefined };
    set({ session: null, ...cleared, lastSyncError: undefined });
    await persist(cleared);
  },

  addRecord: async (input) => {
    const now = new Date().toISOString();
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const deviceId = await readDeviceId();
    const record: LocalRecord = {
      id,
      ...input,
      recordedAt: now,
      source: "manual",
      revision: 0,
      syncStatus: "pending",
    };
    const mutation: MutationDraft = {
      clientMutationId: id,
      deviceId,
      entityId: id,
      entityType: input.kind,
      operation: "create",
      baseRevision: 0,
      payload: { ...input, id, recordedAt: now },
      createdAt: now,
    };
    const nextRecords = [record, ...get().records];
    const nextQueue = [...get().queue, mutation];
    set({ records: nextRecords, queue: nextQueue });
    await persist({
      records: nextRecords,
      queue: nextQueue,
      cursor: get().cursor,
    });
    if (get().session?.mode === "authenticated") void get().sync();
  },

  sync: async () => {
    const session = get().session;
    if (!session || session.mode !== "authenticated" || get().isSyncing) return;
    set({ isSyncing: true, lastSyncError: undefined });
    try {
      let active = session;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const queue = [...get().queue];
          for (const mutation of queue) {
            const result = await api.pushMutation(active.accessToken, mutation);
            set((state) => ({
              records: state.records.map((record) =>
                record.id === mutation.clientMutationId
                  ? { ...result.record, syncStatus: "synced" }
                  : record,
              ),
              queue: state.queue.filter(
                (item) => item.clientMutationId !== mutation.clientMutationId,
              ),
              cursor: result.cursor,
            }));
            const afterMutation = get();
            await persist({
              records: afterMutation.records,
              queue: afterMutation.queue,
              cursor: afterMutation.cursor,
            });
          }
          const pulled = await api.pullSync(active.accessToken, get().cursor);
          set((state) => {
            const pendingIds = new Set(
              state.queue.map((item) => item.clientMutationId),
            );
            const remoteIds = new Set(
              pulled.records.map((record) => record.id),
            );
            const merged = [
              ...pulled.records.filter((record) => !pendingIds.has(record.id)),
              ...state.records.filter((record) => !remoteIds.has(record.id)),
            ];
            return { records: merged, cursor: pulled.cursor };
          });
          const state = get();
          await persist({
            records: state.records,
            queue: state.queue,
            cursor: state.cursor,
          });
          break;
        } catch (error) {
          if (
            attempt === 0 &&
            error instanceof api.ApiRequestError &&
            error.status === 401
          ) {
            const refreshed = await api.refresh(active.refreshToken);
            active = refreshed;
            await writeSession(refreshed);
            set({ session: refreshed });
            continue;
          }
          if (
            error instanceof api.ApiRequestError &&
            error.code === "REVISION_CONFLICT"
          ) {
            const remote = error.details?.record as LocalRecord | undefined;
            if (remote)
              set((state) => ({
                records: state.records.map((record) =>
                  record.id === remote.id
                    ? { ...remote, syncStatus: "conflict" }
                    : record,
                ),
              }));
          }
          throw error;
        }
      }
    } catch (error) {
      set({
        lastSyncError:
          error instanceof Error ? error.message : "同步暂时不可用",
      });
    } finally {
      set({ isSyncing: false });
    }
  },
}));
