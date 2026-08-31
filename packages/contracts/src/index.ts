import { z } from "zod";

/** The seven facts used by every meal summary and sync payload. */
export const NUTRIENT_FIELDS = [
  "energyKcal",
  "proteinG",
  "carbohydrateG",
  "fatG",
  "fiberG",
  "sugarG",
  "sodiumMg",
] as const;

export type NutrientField = (typeof NUTRIENT_FIELDS)[number];

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => !/[\u0000\u0001-\u001f\u007f]/.test(value), {
    message: "must not contain control characters",
  });

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const instantPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function validCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const parts = value.split("-").map(Number);
  const year = parts[0] as number;
  const month = parts[1] as number;
  const day = parts[2] as number;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const DateKeySchema = z
  .string()
  .regex(datePattern, "expected YYYY-MM-DD")
  .refine(validCalendarDate, "not a valid calendar date");
export type DateKey = z.infer<typeof DateKeySchema>;

export const InstantSchema = z
  .string()
  .regex(instantPattern, "expected an ISO-8601 timestamp with an offset")
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid timestamp");
export type Instant = z.infer<typeof InstantSchema>;

const finiteNonNegative = z.number().finite().nonnegative();
const nullableNutrient = finiteNonNegative.nullable();

export const NutritionValuesSchema = z
  .object({
    energyKcal: nullableNutrient,
    proteinG: nullableNutrient,
    carbohydrateG: nullableNutrient,
    fatG: nullableNutrient,
    fiberG: nullableNutrient,
    sugarG: nullableNutrient,
    sodiumMg: nullableNutrient,
  })
  .strict();
export type NutritionValues = z.infer<typeof NutritionValuesSchema>;

export const NutritionFactStatusSchema = z.enum([
  "SOURCE_REPORTED",
  "MEASURED",
  "ESTIMATED",
  "USER_ENTERED",
  "USER_CONFIRMED",
  "TRACE",
  "USER_ENTERED_TRACE",
  "MISSING",
]);
export type NutritionFactStatus = z.infer<typeof NutritionFactStatusSchema>;

const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

/**
 * Synchronized records must never become a covert transport for credentials
 * or raw AI material.  Keep this check structural and deterministic so every
 * client can reject the same payload before it is fingerprinted or queued.
 */
const SENSITIVE_SYNC_KEYS = new Set([
  "aikey",
  "apikey",
  "accesstoken",
  "refreshtoken",
  "rawaipayload",
  "aipayload",
  "authorization",
  "password",
  "secret",
  "privatekey",
  "bearertoken",
  "credential",
  "credentials",
  "dataurl",
  "token",
]);

function normalizedSyncKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isSensitiveSyncKey(key: string): boolean {
  const normalized = normalizedSyncKey(key);
  return (
    SENSITIVE_SYNC_KEYS.has(normalized) ||
    normalized.endsWith("token") ||
    normalized.endsWith("apikey") ||
    normalized.endsWith("secret") ||
    normalized.endsWith("credential")
  );
}

function syncPath(path: string, key: string | number): string {
  if (typeof key === "number") return `${path}[${key}]`;
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
}

export class SyncPayloadSafetyError extends Error {
  readonly code = "SENSITIVE_DATA_NOT_ALLOWED" as const;
  readonly path: string;

  constructor(path: string) {
    super("sensitive fields cannot be synchronized");
    this.name = "SyncPayloadSafetyError";
    this.path = path;
  }
}

/** Reject credential-like keys without ever including their values in errors. */
export function assertSyncPayloadSafe(value: unknown, path = "payload"): void {
  const active = new WeakSet<object>();
  const visit = (current: unknown, currentPath: string): void => {
    if (current === null || typeof current !== "object") return;
    if (active.has(current)) throw new SyncPayloadSafetyError(currentPath);
    active.add(current);
    if (Array.isArray(current)) {
      current.forEach((item, index) =>
        visit(item, syncPath(currentPath, index)),
      );
      active.delete(current);
      return;
    }
    for (const [key, child] of Object.entries(
      current as Record<string, unknown>,
    )) {
      const childPath = syncPath(currentPath, key);
      if (isSensitiveSyncKey(key)) throw new SyncPayloadSafetyError(childPath);
      visit(child, childPath);
    }
    active.delete(current);
  };
  visit(value, path);
}

export const ProvenanceSchema = z.record(z.string(), JsonValueSchema);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const SourceSchema = z
  .object({
    sourceId: identifier,
    sourceVersion: identifier,
    sourceKind: z.string().trim().min(1).max(80).optional(),
    recordId: identifier.optional(),
    importedAt: InstantSchema.optional(),
  })
  .passthrough();
export type Source = z.infer<typeof SourceSchema>;

export const NutritionFactSchema = z
  .object({
    status: NutritionFactStatusSchema,
    value: nullableNutrient.optional(),
    rawValue: z.union([z.string(), z.number().finite()]).nullable().optional(),
    rawUnit: z.string().trim().max(40).nullable().optional(),
    normalizedUnit: z.string().trim().max(40).nullable().optional(),
    originalText: z.string().max(500).nullable().optional(),
    basis: z.record(z.string(), JsonValueSchema).nullable().optional(),
    provenance: ProvenanceSchema.optional(),
  })
  .passthrough();
export type NutritionFact = z.infer<typeof NutritionFactSchema>;

const factMapShape = Object.fromEntries(
  NUTRIENT_FIELDS.map((field) => [field, NutritionFactSchema]),
) as Record<NutrientField, typeof NutritionFactSchema>;

/**
 * A nutrition snapshot deliberately keeps source identity and provenance next
 * to the seven derived values.  `passthrough` lets newer clients add facts
 * without making an older API silently discard them.
 */
export const NutritionSnapshotSchema = z
  .object({
    schemaVersion: z
      .literal("NUTRITION_FACT_SNAPSHOT_V2")
      .nullable()
      .optional(),
    sourceId: identifier,
    sourceVersion: identifier,
    values: NutritionValuesSchema,
    missingFields: z.array(z.enum(NUTRIENT_FIELDS)).optional(),
    facts: z.object(factMapShape).partial().optional(),
    source: SourceSchema.optional(),
    provenance: ProvenanceSchema.optional(),
  })
  .passthrough();
export type NutritionSnapshot = z.infer<typeof NutritionSnapshotSchema>;

export const RecordKindSchema = z.enum(["profile", "meal", "water", "weight"]);
export type RecordKind = z.infer<typeof RecordKindSchema>;

export const SyncSourceSchema = z.union([
  z.enum(["manual", "sync", "pack", "import", "system"]),
  SourceSchema,
]);

/**
 * Canonical record envelope.  Flat fields are retained for the small mobile
 * client, while `payload`, `nutrition`, `source`, and `provenance` carry the
 * lossless server representation.
 */
export const DiaryRecordSchema = z
  .object({
    id: identifier,
    kind: RecordKindSchema,
    localDate: DateKeySchema.optional(),
    recordedAt: InstantSchema,
    revision: z.number().int().nonnegative(),
    serverRevision: z.number().int().nonnegative().optional(),
    title: z.string().max(200).optional(),
    subtitle: z.string().max(500).optional(),
    amount: finiteNonNegative.optional(),
    unit: z.string().trim().max(40).optional(),
    energyKcal: finiteNonNegative.optional(),
    proteinG: finiteNonNegative.optional(),
    carbsG: finiteNonNegative.optional(),
    carbohydrateG: finiteNonNegative.optional(),
    fatG: finiteNonNegative.optional(),
    fiberG: finiteNonNegative.optional(),
    sugarG: finiteNonNegative.optional(),
    sodiumMg: finiteNonNegative.optional(),
    nutrition: NutritionSnapshotSchema.optional(),
    payload: z.record(z.string(), JsonValueSchema).optional(),
    source: SyncSourceSchema.optional(),
    provenance: ProvenanceSchema.optional(),
    deleted: z.boolean().optional(),
    syncStatus: z.enum(["synced", "pending", "conflict"]).optional(),
  })
  .passthrough();
export type DiaryRecord = z.infer<typeof DiaryRecordSchema>;

export const UserSchema = z
  .object({
    id: identifier,
    email: z
      .string()
      .email()
      .transform((value) => value.toLowerCase()),
    displayName: z.string().trim().min(1).max(80),
    createdAt: InstantSchema,
    timezone: z.string().trim().min(1).max(80).optional(),
    revision: z.number().int().nonnegative().optional(),
  })
  .passthrough();
export type User = z.infer<typeof UserSchema>;

export const RegisterInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(128),
    displayName: z.string().trim().min(1).max(80).default("栗子用户"),
    timezone: z.string().trim().min(1).max(80).optional(),
  })
  .strict();
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshInputSchema = z
  .object({
    refreshToken: z.string().trim().min(20).max(512).optional(),
  })
  .strict();
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const LogoutInputSchema = RefreshInputSchema;
export type LogoutInput = z.infer<typeof LogoutInputSchema>;

export const AuthResponseSchema = z
  .object({
    user: UserSchema,
    accessToken: z.string().min(20),
    refreshToken: z.string().min(20).optional(),
    tokenType: z.literal("Bearer").default("Bearer"),
    expiresIn: z.number().int().positive(),
    refreshExpiresAt: InstantSchema.optional(),
  })
  .passthrough();
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Session = AuthResponse;

export const SyncRequestSchema = z
  .object({
    cursor: z.string().trim().max(200).optional(),
    limit: z.number().int().positive().max(500).default(100),
  })
  .strict();
export type SyncRequest = z.infer<typeof SyncRequestSchema>;

export const SyncResponseSchema = z
  .object({
    cursor: z.string(),
    records: z.array(DiaryRecordSchema),
    serverRevision: z.number().int().nonnegative().optional(),
    hasMore: z.boolean().optional(),
    nextCursor: z.string().optional(),
  })
  .passthrough();
export type SyncResponse = z.infer<typeof SyncResponseSchema>;

export const MutationOperationSchema = z.enum([
  "create",
  "update",
  "upsert",
  "delete",
]);
export type MutationOperation = z.infer<typeof MutationOperationSchema>;

export const MutationInputSchema = z
  .object({
    clientMutationId: identifier.max(160),
    deviceId: identifier.max(160).optional(),
    entityId: identifier.max(200).optional(),
    clientCreatedAt: InstantSchema.optional(),
    clientTimestamp: InstantSchema.optional(),
    entityType: RecordKindSchema,
    operation: MutationOperationSchema.default("create"),
    baseRevision: z.number().int().nonnegative().nullable().default(0),
    payload: z.record(z.string(), JsonValueSchema),
    createdAt: InstantSchema.optional(),
  })
  .passthrough();
export type MutationInput = z.infer<typeof MutationInputSchema>;
export type MutationDraft = MutationInput;

export type NormalizedMutationInput = MutationInput & {
  entityId: string;
  clientCreatedAt?: Instant;
};

/** Fill D-073 identity aliases while retaining the wire-compatible optional fields. */
export function normalizeMutationInput(
  input: unknown,
): NormalizedMutationInput {
  const parsed = MutationInputSchema.parse(input);
  // Validate the complete envelope so passthrough fields cannot smuggle a
  // credential outside the structured payload either.
  assertSyncPayloadSafe(parsed, "mutation");
  const payloadEntityId =
    typeof parsed.payload.id === "string" && parsed.payload.id.trim() !== ""
      ? parsed.payload.id
      : parsed.clientMutationId;
  const clientCreatedAt =
    parsed.clientCreatedAt ?? parsed.clientTimestamp ?? parsed.createdAt;
  return {
    ...parsed,
    entityId: parsed.entityId ?? payloadEntityId,
    ...(clientCreatedAt ? { clientCreatedAt } : {}),
  };
}

export const MutationDispositionSchema = z.enum(["COMMITTED", "REPLAYED"]);
export type MutationDisposition = z.infer<typeof MutationDispositionSchema>;

export const MutationResponseSchema = z
  .object({
    clientMutationId: identifier.max(160),
    disposition: MutationDispositionSchema,
    record: DiaryRecordSchema,
    cursor: z.string(),
    serverRevision: z.number().int().nonnegative(),
  })
  .passthrough();
export type MutationResponse = z.infer<typeof MutationResponseSchema>;

export const ApiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "INVALID_CREDENTIALS",
  "INVALID_REFRESH_TOKEN",
  "REVISION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "DUPLICATE_RECORD",
  "RECORD_NOT_FOUND",
  "SENSITIVE_DATA_NOT_ALLOWED",
  "DATABASE_UNAVAILABLE",
  "NOT_READY",
  "INTERNAL_ERROR",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorBodySchema = z
  .object({
    code: ApiErrorCodeSchema.or(z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/)),
    message: z.string().min(1).max(500),
    details: z.record(z.string(), JsonValueSchema).optional(),
  })
  .passthrough();
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export const ApiErrorSchema = z
  .object({
    error: ApiErrorBodySchema,
    requestId: z.string().optional(),
  })
  .passthrough();
export type ApiError = z.infer<typeof ApiErrorSchema>;

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  return schema.parse(input);
}

export function safeParse<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  return schema.safeParse(input);
}

export function parseApiError(input: unknown): ApiError {
  return ApiErrorSchema.parse(input);
}

export function apiError(
  code: ApiErrorCode | (string & {}),
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): ApiError {
  const body: ApiError = {
    error: { code, message, ...(details ? { details } : {}) },
    ...(requestId ? { requestId } : {}),
  };
  return ApiErrorSchema.parse(body);
}

export type ApiSuccess<T> = { data: T };
