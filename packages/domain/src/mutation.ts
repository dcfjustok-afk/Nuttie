import { NUTRIENT_FIELDS, type DiaryRecord, type MutationInput, type RecordKind } from "@nuttie/contracts";
import { DomainError } from "./nutrition.js";

export type MutationQueueItem = MutationInput & { enqueuedAt?: string };
export type RevisionCheck =
  | { ok: true; nextRevision: number }
  | { ok: false; code: "REVISION_CONFLICT"; expected: number; actual: number };

export type MutationApplyResult =
  | { ok: true; records: DiaryRecord[]; record: DiaryRecord; disposition: "COMMITTED"; nextRevision: number }
  | { ok: false; records: DiaryRecord[]; error: { code: string; message: string; details?: Record<string, unknown> } };

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
}

export function nextRevision(current: number): number {
  if (!Number.isSafeInteger(current) || current < 0 || current >= Number.MAX_SAFE_INTEGER) {
    throw new DomainError("INVALID_REVISION", "revision must be a safe non-negative integer");
  }
  return current + 1;
}

export function checkRevision(expected: number | null | undefined, actual: number): RevisionCheck {
  if (!Number.isSafeInteger(actual) || actual < 0) throw new DomainError("INVALID_REVISION", "actual revision is invalid");
  const normalizedExpected = expected ?? 0;
  if (!Number.isSafeInteger(normalizedExpected) || normalizedExpected < 0) {
    throw new DomainError("INVALID_REVISION", "expected revision is invalid");
  }
  return normalizedExpected === actual
    ? { ok: true, nextRevision: nextRevision(actual) }
    : { ok: false, code: "REVISION_CONFLICT", expected: normalizedExpected, actual };
}

/** Stable JSON representation used for idempotency fingerprints. */
export function canonicalize(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "__proto__" && key !== "constructor" && key !== "prototype")
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
}

export function mutationFingerprint(mutation: MutationInput): string {
  return canonicalize({
    entityType: mutation.entityType,
    entityId: mutation.entityId ?? (typeof mutation.payload.id === "string" ? mutation.payload.id : mutation.clientMutationId),
    deviceId: mutation.deviceId ?? null,
    operation: mutation.operation,
    baseRevision: mutation.baseRevision ?? 0,
    clientCreatedAt: mutation.clientCreatedAt ?? mutation.clientTimestamp ?? mutation.createdAt ?? null,
    payload: mutation.payload,
  });
}

export function enqueueMutation(
  queue: readonly MutationQueueItem[],
  mutation: MutationQueueItem,
): MutationQueueItem[] {
  if (queue.some((item) => item.clientMutationId === mutation.clientMutationId)) {
    throw new DomainError("IDEMPOTENCY_CONFLICT", "clientMutationId is already queued");
  }
  return freeze([...queue.map(clone), clone(mutation)]);
}

export function removeMutation(
  queue: readonly MutationQueueItem[],
  clientMutationId: string,
): MutationQueueItem[] {
  return freeze(queue.filter((item) => item.clientMutationId !== clientMutationId).map(clone));
}

export function sortMutationQueue(queue: readonly MutationQueueItem[]): MutationQueueItem[] {
  return freeze(
    queue
      .map(clone)
      .sort((a, b) => {
        const left = a.createdAt ?? a.enqueuedAt ?? "";
        const right = b.createdAt ?? b.enqueuedAt ?? "";
        return left.localeCompare(right) || a.clientMutationId.localeCompare(b.clientMutationId);
      }),
  );
}

/** Compatibility aliases used by early mobile adapters. */
export const mutationQueueFingerprint = mutationFingerprint;
export const assertRevision = checkRevision;

function payloadRecord(
  mutation: MutationInput,
  existing: DiaryRecord | undefined,
  revision: number,
  serverRevision: number,
): DiaryRecord {
  const payload = clone(mutation.payload) as Record<string, unknown>;
  const id = mutation.entityId
    ?? (typeof payload.id === "string" && payload.id.length > 0 ? payload.id : mutation.clientMutationId);
  const recordedAt = typeof payload.recordedAt === "string" ? payload.recordedAt : new Date(0).toISOString();
  const localDate = typeof payload.localDate === "string" ? payload.localDate : undefined;
  const record: DiaryRecord = {
    ...(existing ?? {}),
    ...payload,
    id,
    kind: mutation.entityType as RecordKind,
    recordedAt,
    revision,
    serverRevision,
    payload,
    source: payload.source as DiaryRecord["source"] ?? "manual",
    ...(localDate ? { localDate } : {}),
  };
  // Keep the canonical seven fields in flattened records when present.
  if (mutation.entityType === "meal" && record.nutrition === undefined) {
    const values = Object.fromEntries(
      NUTRIENT_FIELDS.map((field) => [field, typeof payload[field] === "number" ? payload[field] : null]),
    );
    if (Object.values(values).some((value) => value !== null)) {
      record.nutrition = {
        sourceId: "user",
        sourceVersion: "manual",
        values: values as never,
      };
    }
  }
  return record;
}

export function applyMutation(
  currentRecords: readonly DiaryRecord[],
  mutation: MutationInput,
  currentServerRevision = 0,
): MutationApplyResult {
  const before = currentRecords.map(clone);
  const records = currentRecords.map(clone);
  try {
    const payloadId = mutation.entityId
      ?? (typeof mutation.payload.id === "string" && mutation.payload.id.length > 0
        ? mutation.payload.id
        : mutation.clientMutationId);
    const index = records.findIndex((record) => record.id === payloadId && record.kind === mutation.entityType);
    const existing = index >= 0 ? records[index] : undefined;
    const expected = mutation.baseRevision ?? 0;
    if ((mutation.operation === "create" || mutation.operation === "upsert") && existing && mutation.operation === "create") {
      throw new DomainError("DUPLICATE_RECORD", "record already exists", { id: payloadId });
    }
    if ((mutation.operation === "update" || mutation.operation === "delete") && !existing) {
      throw new DomainError("RECORD_NOT_FOUND", "record does not exist", { id: payloadId });
    }
    if (existing && expected !== existing.revision) {
      throw new DomainError("REVISION_CONFLICT", "record revision is stale", {
        id: payloadId,
        expected,
        actual: existing.revision,
      });
    }
    if (!existing && expected !== 0) {
      throw new DomainError("REVISION_CONFLICT", "new record must use baseRevision 0", {
        id: payloadId,
        expected,
        actual: 0,
      });
    }
    const serverRevision = nextRevision(currentServerRevision);
    const nextRecordRevision = existing ? nextRevision(existing.revision) : 1;
    if (mutation.operation === "delete") {
      const tombstone: DiaryRecord = {
        ...existing!,
        revision: nextRecordRevision,
        serverRevision,
        deleted: true,
        payload: {},
      };
      records[index] = tombstone;
      return freeze({ ok: true, records, record: tombstone, disposition: "COMMITTED", nextRevision: serverRevision });
    }
    const record = payloadRecord(mutation, existing, nextRecordRevision, serverRevision);
    if (existing) records[index] = record;
    else records.push(record);
    return freeze({ ok: true, records, record, disposition: "COMMITTED", nextRevision: serverRevision });
  } catch (error) {
    const domainError = error instanceof DomainError
      ? error
      : new DomainError("INVALID_MUTATION", error instanceof Error ? error.message : "invalid mutation");
    return freeze({
      ok: false,
      records: before,
      error: {
        code: domainError.code,
        message: domainError.message,
        ...(domainError.details ? { details: domainError.details } : {}),
      },
    });
  }
}
