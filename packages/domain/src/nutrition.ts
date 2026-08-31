import {
  NUTRIENT_FIELDS,
  NutritionSnapshotSchema,
  type DiaryRecord,
  type NutrientField,
  type NutritionFactStatus,
  type NutritionSnapshot,
  type NutritionValues,
} from "@nuttie/contracts";

export { NUTRIENT_FIELDS };

export type NutritionCompleteness = "MISSING" | "PARTIAL" | "COMPLETE";

export type NutritionSummary = {
  localDate: string;
  mealCount: number;
  values: NutritionValues;
  completeness: Record<NutrientField, NutritionCompleteness>;
  factQuality: Record<NutrientField, FactQualityCounts>;
  sources: Array<{ sourceId: string; sourceVersion: string; provenance?: unknown }>;
};

export type FactQualityCounts = {
  sourceReported: number;
  measured: number;
  estimated: number;
  userEntered: number;
  userConfirmed: number;
  trace: number;
  missing: number;
  legacyKnown: number;
  legacyMissing: number;
};

const FACT_STATUS_TO_COUNTER: Record<NutritionFactStatus, keyof FactQualityCounts> = {
  SOURCE_REPORTED: "sourceReported",
  MEASURED: "measured",
  ESTIMATED: "estimated",
  USER_ENTERED: "userEntered",
  USER_CONFIRMED: "userConfirmed",
  TRACE: "trace",
  USER_ENTERED_TRACE: "trace",
  MISSING: "missing",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  if (value === undefined || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => deepClone(item)) as T;
  const clone: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    clone[key] = deepClone(item);
  }
  return clone as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function assertFiniteNonNegative(value: unknown, field: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new DomainError("INVALID_NUTRITION_VALUE", `${field} must be a finite non-negative number`);
  }
}

export class DomainError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

function validateDateKey(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DomainError("INVALID_DATE", "localDate must use YYYY-MM-DD");
  }
  const parts = value.split("-").map(Number);
  const year = parts[0] as number;
  const month = parts[1] as number;
  const day = parts[2] as number;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new DomainError("INVALID_DATE", "localDate is not a valid calendar date");
  }
  return value;
}

/** Normalize and freeze a snapshot without dropping source/provenance details. */
export function normalizeNutritionSnapshot(input: unknown): NutritionSnapshot {
  if (!isRecord(input)) throw new DomainError("INVALID_NUTRITION_SNAPSHOT", "nutrition must be an object");
  const sourceId = input.sourceId;
  const sourceVersion = input.sourceVersion;
  if (typeof sourceId !== "string" || sourceId.trim() === "") {
    throw new DomainError("MISSING_SOURCE_ID", "nutrition.sourceId is required");
  }
  if (typeof sourceVersion !== "string" || sourceVersion.trim() === "") {
    throw new DomainError("MISSING_SOURCE_VERSION", "nutrition.sourceVersion is required");
  }
  const rawValues = isRecord(input.values) ? input.values : {};
  const values = {} as NutritionValues;
  const missingFields: NutrientField[] = [];
  for (const field of NUTRIENT_FIELDS) {
    const value = rawValues[field];
    if (value === null || value === undefined) {
      values[field] = null;
      missingFields.push(field);
    } else {
      assertFiniteNonNegative(value, `nutrition.values.${field}`);
      values[field] = value;
    }
  }

  const candidate: Record<string, unknown> = {
    ...deepClone(input),
    ...(input.schemaVersion === undefined ? {} : { schemaVersion: input.schemaVersion }),
    sourceId,
    sourceVersion,
    values,
    missingFields,
  };
  // Parse after deriving values so malformed V2 facts or unsafe additions fail closed.
  const parsed = NutritionSnapshotSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new DomainError("INVALID_NUTRITION_SNAPSHOT", parsed.error.message);
  }
  return deepFreeze(deepClone(parsed.data));
}

function blankQuality(): FactQualityCounts {
  return {
    sourceReported: 0,
    measured: 0,
    estimated: 0,
    userEntered: 0,
    userConfirmed: 0,
    trace: 0,
    missing: 0,
    legacyKnown: 0,
    legacyMissing: 0,
  };
}

function qualityFor(snapshot: NutritionSnapshot, field: NutrientField): FactQualityCounts {
  const result = blankQuality();
  const fact = snapshot.facts?.[field];
  const status = fact?.status;
  if (status) result[FACT_STATUS_TO_COUNTER[status] as keyof FactQualityCounts] += 1;
  else if (snapshot.values[field] === null) result.legacyMissing += 1;
  else result.legacyKnown += 1;
  return result;
}

function snapshotForMeal(meal: DiaryRecord): NutritionSnapshot {
  if (meal.nutrition !== undefined) return normalizeNutritionSnapshot(meal.nutrition);
  const flatValues = {
    energyKcal: meal.energyKcal ?? null,
    proteinG: meal.proteinG ?? null,
    carbohydrateG: meal.carbohydrateG ?? meal.carbsG ?? null,
    fatG: meal.fatG ?? null,
    fiberG: meal.fiberG ?? null,
    sugarG: meal.sugarG ?? null,
    sodiumMg: meal.sodiumMg ?? null,
  } satisfies NutritionValues;
  if (Object.values(flatValues).every((value) => value === null)) {
    throw new DomainError("MISSING_NUTRITION", "meal.nutrition or a flat nutrition value is required");
  }
  const source = typeof meal.source === "object" && meal.source !== null ? meal.source : undefined;
  return normalizeNutritionSnapshot({
    sourceId: source && "sourceId" in source && typeof source.sourceId === "string" ? source.sourceId : "legacy",
    sourceVersion: source && "sourceVersion" in source && typeof source.sourceVersion === "string" ? source.sourceVersion : "flat-v1",
    values: flatValues,
    provenance: meal.provenance,
  });
}

/** Sum complete/partial nutrition values for one local date. */
export function dailyNutritionSummary(input: {
  meals: readonly DiaryRecord[];
  localDate: string;
}): NutritionSummary {
  const localDate = validateDateKey(input.localDate);
  if (!Array.isArray(input.meals)) throw new DomainError("INVALID_MEALS", "meals must be an array");
  const selected = input.meals.filter((meal, index) => {
    if (!isRecord(meal)) throw new DomainError("INVALID_MEAL", `meals[${index}] must be an object`);
    const mealDate = validateDateKey(meal.localDate);
    return mealDate === localDate && (meal.kind === undefined || meal.kind === "meal");
  });
  const snapshots = selected.map((meal, index) => {
    try {
      return snapshotForMeal(meal);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new DomainError(error.code, `meals[${index}]: ${error.message}`, error.details);
      }
      throw error;
    }
  });
  const values = {} as NutritionValues;
  const completeness = {} as Record<NutrientField, NutritionCompleteness>;
  const factQuality = {} as Record<NutrientField, FactQualityCounts>;
  for (const field of NUTRIENT_FIELDS) {
    let knownCount = 0;
    let total = 0;
    const quality = blankQuality();
    for (const snapshot of snapshots) {
      const value = snapshot.values[field];
      if (value === null) {
        // Do not turn explicit missing into zero.
      } else {
        knownCount += 1;
        total += value;
      }
      const current = qualityFor(snapshot, field);
      for (const key of Object.keys(quality) as Array<keyof FactQualityCounts>) quality[key] += current[key];
    }
    values[field] = knownCount === 0 ? null : total;
    completeness[field] = knownCount === 0 ? "MISSING" : knownCount === snapshots.length ? "COMPLETE" : "PARTIAL";
    factQuality[field] = quality;
  }
  const sourceMap = new Map<string, { sourceId: string; sourceVersion: string; provenance?: unknown }>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.sourceId}\u0000${snapshot.sourceVersion}`;
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        sourceId: snapshot.sourceId,
        sourceVersion: snapshot.sourceVersion,
        ...(snapshot.provenance === undefined ? {} : { provenance: deepClone(snapshot.provenance) }),
      });
    }
  }
  return deepFreeze({
    localDate,
    mealCount: selected.length,
    values,
    completeness,
    factQuality,
    sources: [...sourceMap.values()],
  });
}

export function aggregateNutritionSnapshots(
  snapshots: readonly unknown[],
): Omit<NutritionSummary, "localDate" | "mealCount" | "sources"> & { snapshotCount: number } {
  const records = snapshots.map((snapshot) => ({
    id: "snapshot",
    kind: "meal" as const,
    recordedAt: "2000-01-01T00:00:00Z",
    revision: 0,
    localDate: "2000-01-01",
    nutrition: normalizeNutritionSnapshot(snapshot),
  }));
  const summary = dailyNutritionSummary({ meals: records, localDate: "2000-01-01" });
  return deepFreeze({
    snapshotCount: snapshots.length,
    values: summary.values,
    completeness: summary.completeness,
    factQuality: summary.factQuality,
  });
}

export function nutritionFieldList(): readonly NutrientField[] {
  return NUTRIENT_FIELDS;
}
