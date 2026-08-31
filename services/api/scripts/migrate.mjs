import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "DATABASE_URL is required for migrations",
    }),
  );
  process.exit(1);
}

const migrationsDirectory = fileURLToPath(
  new URL("../migrations/", import.meta.url),
);
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
try {
  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  if (migrationNames.length === 0) {
    throw new Error("no SQL migrations were found");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize startup migrations when multiple API replicas are released together.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('nuttie:migrations'))",
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    let appliedCount = 0;
    for (const name of migrationNames) {
      const applied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [name],
      );
      if (applied.rowCount) continue;
      const sql = await readFile(join(migrationsDirectory, name), "utf8");
      if (!sql.trim()) throw new Error(`migration ${name} is empty`);
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [name],
      );
      appliedCount += 1;
    }
    await client.query("COMMIT");
    console.log(
      JSON.stringify({
        level: "info",
        message: "database migrations applied",
        discovered: migrationNames.length,
        applied: appliedCount,
      }),
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      message: "database migrations failed",
      ...(code ? { code } : {}),
    }),
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
