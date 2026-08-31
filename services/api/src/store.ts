import { createHash } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import {
  AccountExportSchema,
  DiaryRecordSchema,
  assertSyncPayloadSafe,
  type AccountExport,
  type DiaryRecord,
  type MutationInput,
  type RecordKind,
  type User,
} from "@nuttie/contracts";
import { applyMutation, canonicalize, type DomainError } from "@nuttie/domain";

export type UserRecord = User & { passwordHash: string };

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
};

export type StoredRecord = DiaryRecord & {
  userId: string;
  serverRevision: number;
};

export type MutationReceipt = {
  clientMutationId: string;
  fingerprint: string;
  record: StoredRecord;
  cursor: string;
  serverRevision: number;
};

export type CommitResult =
  | ({ status: "committed" | "replayed" } & MutationReceipt)
  | { status: "idempotency-conflict"; existingFingerprint: string }
  | {
      status: "revision-conflict";
      expected: number;
      actual: number;
      record?: StoredRecord;
    }
  | { status: "duplicate-record"; record: StoredRecord }
  | { status: "record-not-found" };

export type SyncResult = {
  cursor: string;
  serverRevision: number;
  hasMore: boolean;
  records: StoredRecord[];
};

export interface Repository {
  readonly mode: "memory" | "postgres";
  ready(): Promise<{ ready: boolean; detail: string }>;
  close(): Promise<void>;
  createUser(user: UserRecord): Promise<void>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createSession(session: SessionRecord): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  findSessionById(id: string): Promise<SessionRecord | null>;
  revokeSession(id: string, revokedAt: string): Promise<void>;
  /** Atomically consume an active refresh session and persist its replacement. */
  rotateSession(
    tokenHash: string,
    revokedAt: string,
    replacement: SessionRecord,
  ): Promise<SessionRecord | null>;
  exportAccount(userId: string, exportedAt: string): Promise<AccountExport>;
  deleteAccount(userId: string): Promise<boolean>;
  commitMutation(
    userId: string,
    mutation: MutationInput,
    fingerprint: string,
  ): Promise<CommitResult>;
  listChanges(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<SyncResult>;
}

export class RepositoryError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
    this.details = details;
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function userCopy(user: UserRecord): UserRecord {
  return clone(user);
}

function sessionCopy(session: SessionRecord): SessionRecord {
  return clone(session);
}

function recordCopy(record: StoredRecord): StoredRecord {
  return clone(record);
}

function parseCursor(cursor: string | undefined): number {
  if (cursor === undefined || cursor.trim() === "") return 0;
  if (!/^\d+$/.test(cursor.trim()))
    throw new RepositoryError(
      "BAD_CURSOR",
      "cursor must be a non-negative integer",
    );
  const parsed = Number(cursor);
  if (!Number.isSafeInteger(parsed) || parsed < 0)
    throw new RepositoryError("BAD_CURSOR", "cursor is out of range");
  return parsed;
}

function payloadId(mutation: MutationInput): string {
  if (typeof mutation.entityId === "string" && mutation.entityId.trim() !== "")
    return mutation.entityId;
  const candidate = mutation.payload.id;
  return typeof candidate === "string" && candidate.trim() !== ""
    ? candidate
    : mutation.clientMutationId;
}

function publicRecord(record: StoredRecord): StoredRecord {
  // Validate at the repository boundary so no malformed JSON is propagated to clients.
  const parsed = DiaryRecordSchema.parse(record);
  return clone({
    ...parsed,
    userId: record.userId,
    serverRevision: record.serverRevision,
  });
}

function exportRecord(record: StoredRecord): DiaryRecord {
  const { userId: _userId, ...withoutOwner } = publicRecord(record);
  return DiaryRecordSchema.parse(withoutOwner);
}

function publicUser(user: UserRecord): User {
  const { passwordHash: _passwordHash, ...withoutPassword } = userCopy(user);
  return clone(withoutPassword);
}

export class MemoryRepository implements Repository {
  readonly mode = "memory" as const;
  private readonly usersById = new Map<string, UserRecord>();
  private readonly userIdByEmail = new Map<string, string>();
  private readonly sessionsById = new Map<string, SessionRecord>();
  private readonly sessionIdByHash = new Map<string, string>();
  private readonly recordsByUser = new Map<string, StoredRecord[]>();
  private readonly mutationsByUser = new Map<
    string,
    Map<string, MutationReceipt>
  >();
  private readonly revisionByUser = new Map<string, number>();

  async ready(): Promise<{ ready: boolean; detail: string }> {
    return { ready: true, detail: "in-memory" };
  }

  async close(): Promise<void> {
    // Nothing to release.
  }

  async createUser(user: UserRecord): Promise<void> {
    const email = user.email.toLowerCase();
    if (this.userIdByEmail.has(email) || this.usersById.has(user.id)) {
      throw new RepositoryError(
        "EMAIL_TAKEN",
        "an account with this email already exists",
      );
    }
    const normalized = userCopy({ ...user, email });
    this.usersById.set(normalized.id, normalized);
    this.userIdByEmail.set(email, normalized.id);
    this.recordsByUser.set(normalized.id, []);
    this.mutationsByUser.set(normalized.id, new Map());
    this.revisionByUser.set(normalized.id, 0);
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const id = this.userIdByEmail.get(email.toLowerCase());
    return id ? this.findUserById(id) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.usersById.get(id);
    return user ? userCopy(user) : null;
  }

  async exportAccount(
    userId: string,
    exportedAt: string,
  ): Promise<AccountExport> {
    const user = this.usersById.get(userId);
    if (!user) throw new RepositoryError("NOT_FOUND", "user does not exist");
    const result = AccountExportSchema.parse({
      schemaVersion: "NUTTIE_ACCOUNT_EXPORT_V1",
      exportedAt,
      user: publicUser(user),
      records: (this.recordsByUser.get(userId) ?? []).map(exportRecord),
    });
    assertSyncPayloadSafe(result, "accountExport");
    return clone(result);
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const user = this.usersById.get(userId);
    if (!user) return false;
    this.usersById.delete(userId);
    this.userIdByEmail.delete(user.email.toLowerCase());
    for (const [id, session] of this.sessionsById) {
      if (session.userId !== userId) continue;
      this.sessionsById.delete(id);
      this.sessionIdByHash.delete(session.tokenHash);
    }
    this.recordsByUser.delete(userId);
    this.mutationsByUser.delete(userId);
    this.revisionByUser.delete(userId);
    return true;
  }

  async createSession(session: SessionRecord): Promise<void> {
    if (!this.usersById.has(session.userId))
      throw new RepositoryError("NOT_FOUND", "user does not exist");
    const copy = sessionCopy(session);
    this.sessionsById.set(copy.id, copy);
    this.sessionIdByHash.set(copy.tokenHash, copy.id);
  }

  async findSessionByTokenHash(
    tokenHash: string,
  ): Promise<SessionRecord | null> {
    const id = this.sessionIdByHash.get(tokenHash);
    return id ? this.findSessionById(id) : null;
  }

  async findSessionById(id: string): Promise<SessionRecord | null> {
    const session = this.sessionsById.get(id);
    return session ? sessionCopy(session) : null;
  }

  async revokeSession(id: string, revokedAt: string): Promise<void> {
    const session = this.sessionsById.get(id);
    if (session && !session.revokedAt)
      this.sessionsById.set(id, { ...session, revokedAt });
  }

  async rotateSession(
    tokenHash: string,
    revokedAt: string,
    replacement: SessionRecord,
  ): Promise<SessionRecord | null> {
    // This method has no await points, so the lookup, consume, and replacement
    // writes form one event-loop critical section for the in-memory adapter.
    const sessionId = this.sessionIdByHash.get(tokenHash);
    const existing = sessionId ? this.sessionsById.get(sessionId) : undefined;
    const revokedAtMs = Date.parse(revokedAt);
    if (
      !existing ||
      existing.revokedAt ||
      !Number.isFinite(revokedAtMs) ||
      Date.parse(existing.expiresAt) <= revokedAtMs
    ) {
      return null;
    }
    if (replacement.userId !== existing.userId) {
      throw new RepositoryError(
        "INVALID_SESSION_ROTATION",
        "replacement session belongs to a different user",
      );
    }
    if (!this.usersById.has(replacement.userId)) {
      throw new RepositoryError("NOT_FOUND", "user does not exist");
    }
    if (
      this.sessionsById.has(replacement.id) ||
      this.sessionIdByHash.has(replacement.tokenHash)
    ) {
      throw new RepositoryError(
        "SESSION_CONFLICT",
        "replacement session already exists",
      );
    }
    const replacementCopy = sessionCopy(replacement);
    this.sessionsById.set(existing.id, { ...existing, revokedAt });
    this.sessionsById.set(replacementCopy.id, replacementCopy);
    this.sessionIdByHash.set(replacementCopy.tokenHash, replacementCopy.id);
    return sessionCopy(existing);
  }

  async commitMutation(
    userId: string,
    mutation: MutationInput,
    fingerprint: string,
  ): Promise<CommitResult> {
    assertSyncPayloadSafe(mutation, "mutation");
    if (!this.usersById.has(userId))
      throw new RepositoryError("NOT_FOUND", "user does not exist");
    const receipts = this.mutationsByUser.get(userId)!;
    const existingReceipt = receipts.get(mutation.clientMutationId);
    if (existingReceipt) {
      if (existingReceipt.fingerprint !== fingerprint) {
        return {
          status: "idempotency-conflict",
          existingFingerprint: existingReceipt.fingerprint,
        };
      }
      return { status: "replayed", ...clone(existingReceipt) };
    }
    const current = this.recordsByUser.get(userId)!;
    const serverRevision = this.revisionByUser.get(userId) ?? 0;
    const applied = applyMutation(current, mutation, serverRevision);
    if (!applied.ok) {
      const details = applied.error.details;
      if (applied.error.code === "REVISION_CONFLICT") {
        const actual = typeof details?.actual === "number" ? details.actual : 0;
        const record = current.find(
          (item) =>
            item.id === payloadId(mutation) &&
            item.kind === mutation.entityType,
        );
        return {
          status: "revision-conflict",
          expected: mutation.baseRevision ?? 0,
          actual,
          ...(record ? { record: recordCopy(record) } : {}),
        };
      }
      if (applied.error.code === "DUPLICATE_RECORD") {
        const record = current.find(
          (item) =>
            item.id === payloadId(mutation) &&
            item.kind === mutation.entityType,
        );
        if (record)
          return { status: "duplicate-record", record: recordCopy(record) };
      }
      if (applied.error.code === "RECORD_NOT_FOUND")
        return { status: "record-not-found" };
      throw new RepositoryError(
        applied.error.code,
        applied.error.message,
        details,
      );
    }
    const nextServerRevision = applied.nextRevision;
    const committed = {
      ...recordCopy(applied.record as StoredRecord),
      userId,
      serverRevision: nextServerRevision,
    };
    const nextRecords = applied.records.map((record) => {
      const existing =
        record.id === committed.id && record.kind === committed.kind;
      return existing
        ? committed
        : {
            ...recordCopy(record as StoredRecord),
            userId,
            serverRevision: record.serverRevision ?? serverRevision,
          };
    });
    this.recordsByUser.set(userId, nextRecords);
    this.revisionByUser.set(userId, nextServerRevision);
    const receipt: MutationReceipt = {
      clientMutationId: mutation.clientMutationId,
      fingerprint,
      record: committed,
      cursor: String(nextServerRevision),
      serverRevision: nextServerRevision,
    };
    receipts.set(mutation.clientMutationId, clone(receipt));
    return { status: "committed", ...clone(receipt) };
  }

  async listChanges(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<SyncResult> {
    if (!this.usersById.has(userId))
      throw new RepositoryError("NOT_FOUND", "user does not exist");
    const from = parseCursor(cursor);
    const serverRevision = this.revisionByUser.get(userId) ?? 0;
    const all = (this.recordsByUser.get(userId) ?? [])
      .filter((record) => record.serverRevision > from)
      .sort((left, right) => left.serverRevision - right.serverRevision);
    const records = all.slice(0, limit).map(recordCopy).map(publicRecord);
    const hasMore = all.length > records.length;
    const next = records.at(-1)?.serverRevision ?? from;
    return { cursor: String(next), serverRevision, hasMore, records };
  }
}

type PgRow = QueryResultRow & Record<string, unknown>;

function rowUser(row: PgRow): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    createdAt: new Date(String(row.created_at)).toISOString(),
    ...(row.timezone ? { timezone: String(row.timezone) } : {}),
    revision: Number(row.revision ?? 0),
    passwordHash: String(row.password_hash),
  };
}

function rowSession(row: PgRow): SessionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tokenHash: String(row.token_hash),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    ...(row.revoked_at
      ? { revokedAt: new Date(String(row.revoked_at)).toISOString() }
      : {}),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function rowRecord(row: PgRow): StoredRecord {
  const raw =
    typeof row.record_json === "string"
      ? JSON.parse(row.record_json)
      : row.record_json;
  const record = DiaryRecordSchema.parse(raw) as DiaryRecord;
  return {
    ...record,
    userId: String(row.user_id),
    serverRevision: Number(row.server_revision),
  };
}

export class PostgresRepository implements Repository {
  readonly mode = "postgres" as const;
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl, max: 10 });
  }

  async ready(): Promise<{ ready: boolean; detail: string }> {
    try {
      await this.pool.query("SELECT 1");
      return { ready: true, detail: "postgres" };
    } catch {
      return { ready: false, detail: "postgres unavailable" };
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async createUser(user: UserRecord): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, timezone, created_at, revision)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.id,
          user.email.toLowerCase(),
          user.passwordHash,
          user.displayName,
          user.timezone ?? null,
          user.createdAt,
          user.revision ?? 0,
        ],
      );
      await this.pool.query(
        `INSERT INTO user_revisions (user_id, revision) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
        [user.id],
      );
    } catch (error) {
      if (isPgUnique(error))
        throw new RepositoryError(
          "EMAIL_TAKEN",
          "an account with this email already exists",
        );
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.pool.query<PgRow>(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()],
    );
    return result.rows[0] ? rowUser(result.rows[0]) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const result = await this.pool.query<PgRow>(
      "SELECT * FROM users WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? rowUser(result.rows[0]) : null;
  }

  async exportAccount(
    userId: string,
    exportedAt: string,
  ): Promise<AccountExport> {
    const userResult = await this.pool.query<PgRow>(
      "SELECT * FROM users WHERE id = $1 LIMIT 1",
      [userId],
    );
    const userRow = userResult.rows[0];
    if (!userRow) throw new RepositoryError("NOT_FOUND", "user does not exist");
    const recordResult = await this.pool.query<PgRow>(
      `SELECT user_id, record_json, server_revision FROM records
       WHERE user_id = $1 ORDER BY server_revision ASC, kind ASC, id ASC`,
      [userId],
    );
    const result = AccountExportSchema.parse({
      schemaVersion: "NUTTIE_ACCOUNT_EXPORT_V1",
      exportedAt,
      user: publicUser(rowUser(userRow)),
      records: recordResult.rows.map(rowRecord).map(exportRecord),
    });
    assertSyncPayloadSafe(result, "accountExport");
    return clone(result);
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM users WHERE id = $1", [
      userId,
    ]);
    return result.rowCount === 1;
  }

  async createSession(session: SessionRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, revoked_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        session.id,
        session.userId,
        session.tokenHash,
        session.expiresAt,
        session.revokedAt ?? null,
        session.createdAt,
      ],
    );
  }

  async findSessionByTokenHash(
    tokenHash: string,
  ): Promise<SessionRecord | null> {
    const result = await this.pool.query<PgRow>(
      "SELECT * FROM sessions WHERE token_hash = $1 LIMIT 1",
      [tokenHash],
    );
    return result.rows[0] ? rowSession(result.rows[0]) : null;
  }

  async findSessionById(id: string): Promise<SessionRecord | null> {
    const result = await this.pool.query<PgRow>(
      "SELECT * FROM sessions WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] ? rowSession(result.rows[0]) : null;
  }

  async revokeSession(id: string, revokedAt: string): Promise<void> {
    await this.pool.query(
      "UPDATE sessions SET revoked_at = COALESCE(revoked_at, $2) WHERE id = $1",
      [id, revokedAt],
    );
  }

  async rotateSession(
    tokenHash: string,
    revokedAt: string,
    replacement: SessionRecord,
  ): Promise<SessionRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<PgRow>(
        "SELECT * FROM sessions WHERE token_hash = $1 FOR UPDATE",
        [tokenHash],
      );
      const row = result.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return null;
      }
      const existing = rowSession(row);
      const revokedAtMs = Date.parse(revokedAt);
      if (
        existing.revokedAt ||
        !Number.isFinite(revokedAtMs) ||
        Date.parse(existing.expiresAt) <= revokedAtMs
      ) {
        await client.query("ROLLBACK");
        return null;
      }
      if (replacement.userId !== existing.userId) {
        await client.query("ROLLBACK");
        throw new RepositoryError(
          "INVALID_SESSION_ROTATION",
          "replacement session belongs to a different user",
        );
      }
      await client.query(
        "UPDATE sessions SET revoked_at = $2 WHERE id = $1 AND revoked_at IS NULL",
        [existing.id, revokedAt],
      );
      await client.query(
        `INSERT INTO sessions (id, user_id, token_hash, expires_at, revoked_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          replacement.id,
          replacement.userId,
          replacement.tokenHash,
          replacement.expiresAt,
          replacement.revokedAt ?? null,
          replacement.createdAt,
        ],
      );
      await client.query("COMMIT");
      return existing;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original database error.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async commitMutation(
    userId: string,
    mutation: MutationInput,
    fingerprint: string,
  ): Promise<CommitResult> {
    assertSyncPayloadSafe(mutation, "mutation");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const receiptResult = await client.query<PgRow>(
        "SELECT client_mutation_id, fingerprint, response_json FROM mutations WHERE user_id = $1 AND client_mutation_id = $2 FOR UPDATE",
        [userId, mutation.clientMutationId],
      );
      const previous = receiptResult.rows[0];
      if (previous) {
        if (String(previous.fingerprint) !== fingerprint) {
          await client.query("ROLLBACK");
          return {
            status: "idempotency-conflict",
            existingFingerprint: String(previous.fingerprint),
          };
        }
        const response =
          typeof previous.response_json === "string"
            ? JSON.parse(previous.response_json)
            : previous.response_json;
        await client.query("COMMIT");
        return { status: "replayed", ...(response as MutationReceipt) };
      }

      const revisionResult = await client.query<PgRow>(
        "SELECT revision FROM user_revisions WHERE user_id = $1 FOR UPDATE",
        [userId],
      );
      const currentServerRevision = Number(
        revisionResult.rows[0]?.revision ?? 0,
      );
      const currentResult = await client.query<PgRow>(
        `SELECT user_id, record_json, server_revision FROM records
         WHERE user_id = $1 AND kind = $2 AND id = $3 FOR UPDATE`,
        [userId, mutation.entityType, payloadId(mutation)],
      );
      const existing = currentResult.rows[0]
        ? rowRecord(currentResult.rows[0])
        : undefined;
      const applied = applyMutation(
        existing ? [existing] : [],
        mutation,
        currentServerRevision,
      );
      if (!applied.ok) {
        await client.query("ROLLBACK");
        const details = applied.error.details;
        if (applied.error.code === "REVISION_CONFLICT") {
          return {
            status: "revision-conflict",
            expected: mutation.baseRevision ?? 0,
            actual:
              typeof details?.actual === "number"
                ? details.actual
                : (existing?.revision ?? 0),
            ...(existing ? { record: existing } : {}),
          };
        }
        if (applied.error.code === "DUPLICATE_RECORD" && existing)
          return { status: "duplicate-record", record: existing };
        if (applied.error.code === "RECORD_NOT_FOUND")
          return { status: "record-not-found" };
        throw new RepositoryError(
          applied.error.code,
          applied.error.message,
          details,
        );
      }
      const next = applied.record as DiaryRecord;
      const nextServerRevision = applied.nextRevision;
      await client.query(
        `INSERT INTO records (user_id, id, kind, local_date, recorded_at, revision, payload, record_json, source, provenance, deleted, server_revision, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, NOW())
         ON CONFLICT (user_id, kind, id) DO UPDATE SET
           local_date = EXCLUDED.local_date, recorded_at = EXCLUDED.recorded_at, revision = EXCLUDED.revision,
           payload = EXCLUDED.payload, record_json = EXCLUDED.record_json, source = EXCLUDED.source,
           provenance = EXCLUDED.provenance, deleted = EXCLUDED.deleted, server_revision = EXCLUDED.server_revision, updated_at = NOW()`,
        [
          userId,
          next.id,
          next.kind,
          next.localDate ?? null,
          next.recordedAt,
          next.revision,
          JSON.stringify(next.payload ?? {}),
          JSON.stringify(next),
          JSON.stringify(next.source ?? null),
          JSON.stringify(next.provenance ?? null),
          next.deleted ?? false,
          nextServerRevision,
        ],
      );
      await client.query(
        `INSERT INTO user_revisions (user_id, revision) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET revision = EXCLUDED.revision`,
        [userId, nextServerRevision],
      );
      const stored: StoredRecord = {
        ...next,
        userId,
        serverRevision: nextServerRevision,
      };
      const receipt: MutationReceipt = {
        clientMutationId: mutation.clientMutationId,
        fingerprint,
        record: stored,
        cursor: String(nextServerRevision),
        serverRevision: nextServerRevision,
      };
      await client.query(
        `INSERT INTO mutations (user_id, client_mutation_id, fingerprint, operation, entity_type, device_id, entity_id, client_created_at, base_revision, payload, response_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, NOW())`,
        [
          userId,
          mutation.clientMutationId,
          fingerprint,
          mutation.operation,
          mutation.entityType,
          mutation.deviceId ?? null,
          mutation.entityId ?? payloadId(mutation),
          mutation.clientCreatedAt ??
            mutation.clientTimestamp ??
            mutation.createdAt ??
            null,
          mutation.baseRevision ?? 0,
          JSON.stringify(mutation.payload),
          JSON.stringify(receipt),
        ],
      );
      await client.query("COMMIT");
      return { status: "committed", ...receipt };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original database error.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async listChanges(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<SyncResult> {
    const from = parseCursor(cursor);
    const revisionResult = await this.pool.query<PgRow>(
      "SELECT revision FROM user_revisions WHERE user_id = $1",
      [userId],
    );
    const serverRevision = Number(revisionResult.rows[0]?.revision ?? 0);
    const result = await this.pool.query<PgRow>(
      `SELECT user_id, record_json, server_revision FROM records
       WHERE user_id = $1 AND server_revision > $2 ORDER BY server_revision ASC LIMIT $3`,
      [userId, from, limit],
    );
    const records = result.rows.map(rowRecord).map(publicRecord);
    const next = records.at(-1)?.serverRevision ?? from;
    const more = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM records WHERE user_id = $1 AND server_revision > $2",
      [userId, next],
    );
    return {
      cursor: String(next),
      serverRevision,
      hasMore: Number(more.rows[0]?.count ?? 0) > 0,
      records,
    };
  }
}

function isPgUnique(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export function hashMutationFingerprint(mutation: MutationInput): string {
  assertSyncPayloadSafe(mutation, "mutation");
  return createHash("sha256").update(canonicalize(mutation)).digest("hex");
}

export function createRepository(config: {
  allowInMemory: boolean;
  databaseUrl?: string;
}): Repository {
  if (config.allowInMemory) return new MemoryRepository();
  if (config.databaseUrl) return new PostgresRepository(config.databaseUrl);
  throw new RepositoryError(
    "DATABASE_UNAVAILABLE",
    "a persistent DATABASE_URL is required",
  );
}
