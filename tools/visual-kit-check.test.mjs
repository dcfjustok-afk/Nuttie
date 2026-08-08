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
  assert.equal(report.spotIllustrations.length, 9);
  assert.equal(report.referencedSpots.length, 7);
  assert.equal(report.remoteHtmlReferences, 0);
  assert.equal(report.accessibleMascots, 3);
  assert.equal(report.accessibleNavigations, 3);
  assert.equal(report.minimumTouchTarget, 44);
  assert.equal(report.tokenVersion, "0.2.0");
  assert.deepEqual(report.tokenCategories, ["color", "space", "radius", "size", "type", "shadow", "motion", "component", "mascot"]);
  assert.equal(report.componentCatalog, true);
  assert.equal(report.systemPatterns, 9);
  assert.equal(report.featureFlows, 5);
  assert.equal(report.accessibleFeatureControls, true);
});

test("visual kit rejects a remote HTML resource", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nuttie-visual-kit-"));
  try {
    for (const fileName of ["index.html", "mascot-sheet.svg", "spot-illustrations.svg", "design-tokens.json", "components.html", "patterns.html", "feature-flows.html", "server.mjs"]) {
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

test("visual kit rejects a fake feature search control", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nuttie-visual-kit-"));
  try {
    for (const fileName of ["index.html", "mascot-sheet.svg", "spot-illustrations.svg", "design-tokens.json", "components.html", "patterns.html", "feature-flows.html", "server.mjs"]) {
      await writeFile(path.join(tempDir, fileName), await readFile(path.join(visualKitDir, fileName)));
    }
    const featurePath = path.join(tempDir, "feature-flows.html");
    const features = await readFile(featurePath, "utf8");
    await writeFile(featurePath, features.replace('type="search"', 'data-fake="search"'));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "FEATURE_FORM_SEMANTICS_MISSING" });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
