import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const sourcePath = path.resolve("apps/app/src/state/useAppStore.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const seedStart = source.indexOf("const seedRecords");
const seedEnd = source.indexOf("let sessionEpoch");
const seedBlock = source.slice(seedStart, seedEnd);

test("exported demo records use deterministic timestamps", () => {
  assert.match(
    source,
    /const seedRecordedAt = "\d{4}-\d{2}-\d{2}T00:00:00\.000Z";/,
  );
  assert.doesNotMatch(seedBlock, /new Date\s*\(|Date\.now\s*\(|Math\.random\s*\(/);
});
