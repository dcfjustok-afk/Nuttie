-- Nuttie API PostgreSQL schema, version 1.
-- Apply this file once before starting the API with DATABASE_URL.

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  timezone      TEXT,
  created_at    TIMESTAMPTZ NOT NULL,
  revision      BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0)
);

CREATE TABLE IF NOT EXISTS user_revisions (
  user_id  TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0)
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS records (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id              TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('profile', 'meal', 'water', 'weight')),
  local_date      DATE,
  recorded_at     TIMESTAMPTZ NOT NULL,
  revision        BIGINT NOT NULL CHECK (revision >= 1),
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  record_json     JSONB NOT NULL,
  source          JSONB,
  provenance      JSONB,
  deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  server_revision BIGINT NOT NULL CHECK (server_revision >= 1),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind, id)
);
CREATE INDEX IF NOT EXISTS records_sync_idx ON records(user_id, server_revision);
CREATE INDEX IF NOT EXISTS records_date_idx ON records(user_id, local_date);

CREATE TABLE IF NOT EXISTS mutations (
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_mutation_id TEXT NOT NULL,
  fingerprint        TEXT NOT NULL,
  operation          TEXT NOT NULL CHECK (operation IN ('create', 'update', 'upsert', 'delete')),
  entity_type        TEXT NOT NULL CHECK (entity_type IN ('profile', 'meal', 'water', 'weight')),
  device_id          TEXT,
  entity_id          TEXT NOT NULL,
  client_created_at  TIMESTAMPTZ,
  base_revision      BIGINT NOT NULL CHECK (base_revision >= 0),
  payload            JSONB NOT NULL,
  response_json      JSONB NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, client_mutation_id)
);
CREATE INDEX IF NOT EXISTS mutations_created_idx ON mutations(user_id, created_at);

-- Keep timestamps and JSON records inspectable without exposing secrets.
COMMENT ON TABLE sessions IS 'Only SHA-256 refresh-token hashes are persisted; raw tokens never enter this table.';
COMMENT ON TABLE mutations IS 'Idempotency receipts keyed by user and clientMutationId.';
