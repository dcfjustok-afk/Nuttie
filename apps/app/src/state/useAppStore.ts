import { create } from "zustand";
import { Platform } from "react-native";
import type { AccountExport } from "@nuttie/contracts";

import * as api from "../data/api";
import {
  clearCache,
  clearSession,
  discardLegacyCache,
  readCache,
  readDeviceId,
  readSession,
  writeCache,
  writeSession,
} from "../data/storage";
import { selectCachedRecords } from "../data/storage-policy";
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

let sessionEpoch = 0;
let persistenceTail: Promise<void> = Promise.resolve();
let sessionPersistenceTail: Promise<void> = Promise.resolve();

function cacheScope(session: Session | null) {
  return session?.mode === "authenticated" ? { userId: session.user.id } : {};
}

function persist(
  state: Pick<Store, "records" | "queue" | "cursor">,
  session: Session | null,
  epoch = sessionEpoch,
) {
  const task = persistenceTail.then(async () => {
    if (epoch !== sessionEpoch) return;
    await writeCache(state, cacheScope(session));
  });
  persistenceTail = task.catch(() => undefined);
  return task;
}

function persistSession(session: Session, epoch = sessionEpoch) {
  const task = sessionPersistenceTail.then(async () => {
    if (epoch !== sessionEpoch) return;
    await writeSession(session);
  });
  sessionPersistenceTail = task.catch(() => undefined);
  return task;
}

function clearPersistedSession(epoch = sessionEpoch) {
  const task = sessionPersistenceTail.then(async () => {
    if (epoch !== sessionEpoch) return;
    await clearSession();
  });
  sessionPersistenceTail = task.catch(() => undefined);
  return task;
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
    const epoch = ++sessionEpoch;
    const persisted = await readSession();
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
      if (persisted) await clearPersistedSession(epoch);
    }
    await discardLegacyCache();
    const cacheRaw = await readCache<
      Pick<Store, "records" | "queue" | "cursor">
    >(cacheScope(session));
    if (epoch !== sessionEpoch) return;
    set({
      hydrated: true,
      session,
      records: selectCachedRecords(
        cacheRaw,
        session?.mode === "authenticated" ? [] : seedRecords,
      ),
      queue: cacheRaw?.queue ?? [],
      cursor: cacheRaw?.cursor,
    });
    if (session?.mode === "authenticated") void get().sync();
  },

  signIn: async (session) => {
    const epoch = ++sessionEpoch;
    await persistSession(session, epoch);
    const scopedCache = await readCache<
      Pick<Store, "records" | "queue" | "cursor">
    >(cacheScope(session));
    if (epoch !== sessionEpoch) return;
    set({
      session,
      records: selectCachedRecords(
        scopedCache,
        session.mode === "authenticated" ? [] : seedRecords,
      ),
      queue: scopedCache?.queue ?? [],
      cursor: scopedCache?.cursor,
      lastSyncError: undefined,
      isSyncing: false,
    });
    if (session.mode === "authenticated") await get().sync();
  },

  signOut: async () => {
    const epoch = ++sessionEpoch;
    const session = get().session;
    if (session?.mode === "authenticated")
      await api
        .logout(session.accessToken, session.refreshToken)
        .catch(() => undefined);
    await Promise.all([persistenceTail, sessionPersistenceTail]);
    if (epoch !== sessionEpoch) return;
    await clearPersistedSession(epoch);
    set({
      session: null,
      records: seedRecords,
      queue: [],
      cursor: undefined,
      lastSyncError: undefined,
      isSyncing: false,
    });
  },

  exportAccount: async () => {
    const session = get().session;
    const epoch = sessionEpoch;
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
      await persistSession(refreshed, epoch);
      const current = get().session;
      if (
        epoch !== sessionEpoch ||
        current?.mode !== "authenticated" ||
        current.user.id !== session.user.id
      ) {
        throw new Error("session changed during account export");
      }
      set({ session: refreshed });
      return api.exportAccount(refreshed.accessToken);
    }
  },

  deleteAccount: async () => {
    const epoch = ++sessionEpoch;
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
      await persistSession(refreshed, epoch);
      if (epoch === sessionEpoch) set({ session: refreshed });
      await api.deleteAccount(refreshed.accessToken);
    }
    await Promise.all([persistenceTail, sessionPersistenceTail]);
    await clearCache(cacheScope(session));
    if (epoch !== sessionEpoch) return;
    await clearPersistedSession(epoch);
    const cleared = { records: [], queue: [], cursor: undefined };
    set({
      session: null,
      ...cleared,
      lastSyncError: undefined,
      isSyncing: false,
    });
  },

  addRecord: async (input) => {
    const epoch = sessionEpoch;
    const now = new Date().toISOString();
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const deviceId = await readDeviceId();
    if (epoch !== sessionEpoch) return;
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
    await persist(
      {
        records: nextRecords,
        queue: nextQueue,
        cursor: get().cursor,
      },
      get().session,
      epoch,
    );
    if (get().session?.mode === "authenticated") void get().sync();
  },

  sync: async () => {
    const session = get().session;
    if (!session || session.mode !== "authenticated" || get().isSyncing) return;
    const epoch = sessionEpoch;
    const userId = session.user.id;
    const isCurrent = () => {
      const current = get().session;
      return (
        sessionEpoch === epoch &&
        current?.mode === "authenticated" &&
        current.user.id === userId
      );
    };
    set({ isSyncing: true, lastSyncError: undefined });
    try {
      let active = session;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const queue = [...get().queue];
          for (const mutation of queue) {
            const result = await api.pushMutation(active.accessToken, mutation);
            if (!isCurrent()) return;
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
            await persist(
              {
                records: afterMutation.records,
                queue: afterMutation.queue,
                cursor: afterMutation.cursor,
              },
              active,
              epoch,
            );
          }
          if (!isCurrent()) return;
          const pulled = await api.pullSync(active.accessToken, get().cursor);
          if (!isCurrent()) return;
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
          if (!isCurrent()) return;
          await persist(
            {
              records: state.records,
              queue: state.queue,
              cursor: state.cursor,
            },
            active,
            epoch,
          );
          break;
        } catch (error) {
          if (!isCurrent()) return;
          if (
            attempt === 0 &&
            error instanceof api.ApiRequestError &&
            error.status === 401
          ) {
            const refreshed = await api.refresh(active.refreshToken);
            if (!isCurrent()) return;
            active = refreshed;
            await persistSession(refreshed, epoch);
            if (!isCurrent()) return;
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
      if (!isCurrent()) return;
      set({
        lastSyncError:
          error instanceof Error ? error.message : "同步暂时不可用",
      });
    } finally {
      if (isCurrent()) set({ isSyncing: false });
    }
  },
}));
