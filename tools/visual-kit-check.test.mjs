import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkVisualKit, visualKitDir } from "./visual-kit-check.mjs";

test("visual kit exposes three screens and four mascot variants", async () => {
  const report = await checkVisualKit();
  assert.equal(report.ok, true);
  assert.equal(report.screens, 3);
  assert.deepEqual(report.mascotVariants, ["mascot-home", "mascot-meal", "mascot-growth", "mascot-streak"]);
  assert.equal(report.remoteHtmlReferences, 0);
  assert.equal(report.accessibleMascots, 3);
});

test("visual kit rejects a remote HTML resource", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nuttie-visual-kit-"));
  try {
    for (const fileName of ["index.html", "mascot-sheet.svg", "server.mjs"]) {
      await writeFile(path.join(tempDir, fileName), await readFile(path.join(visualKitDir, fileName)));
    }
    const indexPath = path.join(tempDir, "index.html");
    const html = await readFile(indexPath, "utf8");
    await writeFile(indexPath, html.replace("<title>Nuttie visual concept</title>", "<link rel=\"stylesheet\" href=\"https://example.test/app.css\"><title>Nuttie visual concept</title>"));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "REMOTE_HTML_REFERENCE" });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
