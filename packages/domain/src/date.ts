import { DomainError } from "./nutrition.js";

export type DateContext = { instant: string; timeZone: string; localDate: string };

export function assertDateKey(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DomainError("INVALID_DATE", "localDate must use YYYY-MM-DD");
  }
  const parts = value.split("-").map(Number);
  const year = parts[0] as number;
  const month = parts[1] as number;
  const day = parts[2] as number;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new DomainError("INVALID_DATE", "localDate is not a calendar date");
  }
  return value;
}

export function deriveLocalDate(instant: string, timeZone: string): string {
  if (
    typeof instant !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(instant) ||
    Number.isNaN(Date.parse(instant))
  ) {
    throw new DomainError("INVALID_INSTANT", "instant must be a strict ISO timestamp");
  }
  if (typeof timeZone !== "string" || timeZone.trim() === "") {
    throw new DomainError("MISSING_TIME_ZONE", "timeZone is required");
  }
  try {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(instant));
    return assertDateKey(date.replaceAll("/", "-"));
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError("INVALID_TIME_ZONE", "timeZone is not supported");
  }
}

export function dateContext(input: {
  instant: string;
  timeZone: string;
  localDate?: string;
}): DateContext {
  const localDate = deriveLocalDate(input.instant, input.timeZone);
  if (input.localDate !== undefined && assertDateKey(input.localDate) !== localDate) {
    throw new DomainError("DATE_CONTEXT_MISMATCH", "localDate does not match instant in timeZone");
  }
  return Object.freeze({
    instant: new Date(input.instant).toISOString(),
    timeZone: input.timeZone,
    localDate,
  });
}

export function addLocalDays(value: string, amount: number): string {
  const date = assertDateKey(value);
  if (!Number.isSafeInteger(amount)) throw new DomainError("INVALID_DAY_OFFSET", "amount must be an integer");
  const parts = date.split("-").map(Number);
  const year = parts[0] as number;
  const month = parts[1] as number;
  const day = parts[2] as number;
  const result = new Date(Date.UTC(year, month - 1, day + amount));
  return assertDateKey(result.toISOString().slice(0, 10));
}

export function compareLocalDates(left: string, right: string): number {
  const a = assertDateKey(left);
  const b = assertDateKey(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

export const normalizeLocalDate = assertDateKey;
export const resolveDateContext = dateContext;
