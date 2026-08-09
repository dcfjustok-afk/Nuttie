import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkVisualKit, visualKitDir } from "./visual-kit-check.mjs";

const fixtureFiles = ["index.html", "mascot-sheet.svg", "spot-illustrations.svg", "design-tokens.json", "components.html", "patterns.html", "feature-flows.html", "server.mjs"];

async function withVisualKitFixture(run) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "nuttie-visual-kit-"));
  try {
    for (const fileName of fixtureFiles) {
      await writeFile(path.join(tempDir, fileName), await readFile(path.join(visualKitDir, fileName)));
    }
    await run(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
function replaceOnce(source, search, replacement) {
  const firstIndex = source.indexOf(search);
  assert.notEqual(firstIndex, -1, `fixture must contain ${search}`);
  assert.equal(source.indexOf(search, firstIndex + search.length), -1, `fixture anchor must be unique: ${search}`);
  return source.slice(0, firstIndex) + replacement + source.slice(firstIndex + search.length);
}

async function mutatePatterns(tempDir, mutate) {
  const patternPath = path.join(tempDir, "patterns.html");
  const patterns = await readFile(patternPath, "utf8");
  const mutated = mutate(patterns);
  assert.notEqual(mutated, patterns, "pattern mutation must change the fixture");
  await writeFile(patternPath, mutated);
}


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
  assert.equal(report.accessibleComponentControls, true);
  assert.equal(report.systemPatterns, 9);
  assert.equal(report.featureFlows, 5);
  assert.equal(report.accessibleFeatureControls, true);
});

test("visual kit rejects a remote HTML resource", async () => {
  await withVisualKitFixture(async (tempDir) => {
    const indexPath = path.join(tempDir, "index.html");
    const html = await readFile(indexPath, "utf8");
    await writeFile(indexPath, html.replace("<title>Nuttie visual concept</title>", "<link rel=\"stylesheet\" href=\"https://example.test/app.css\"><title>Nuttie visual concept</title>"));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "REMOTE_HTML_REFERENCE" });
  });
});

test("visual kit rejects a fake feature search control", async () => {
  await withVisualKitFixture(async (tempDir) => {
    const featurePath = path.join(tempDir, "feature-flows.html");
    const features = await readFile(featurePath, "utf8");
    await writeFile(featurePath, features.replace('type="search"', 'data-fake="search"'));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "FEATURE_FORM_SEMANTICS_MISSING" });
  });
});

test("visual kit rejects a fake component input", async () => {
  await withVisualKitFixture(async (tempDir) => {
    const componentPath = path.join(tempDir, "components.html");
    const components = await readFile(componentPath, "utf8");
    await writeFile(componentPath, components.replace('name="foodName" type="text"', 'name="foodName" data-fake-type="text"'));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "COMPONENT_NATIVE_INPUT_MISSING" });
  });
});

test("visual kit rejects an undersized segmented control", async () => {
  await withVisualKitFixture(async (tempDir) => {
    const componentPath = path.join(tempDir, "components.html");
    const components = await readFile(componentPath, "utf8");
    await writeFile(componentPath, components.replace(".segment button{min-height:44px", ".segment button{min-height:40px"));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "COMPONENT_TOUCH_TARGET_INVALID" });
  });
});

test("visual kit rejects an unapproved nutrition progress claim", async () => {
  await withVisualKitFixture(async (tempDir) => {
    const componentPath = path.join(tempDir, "components.html");
    const components = await readFile(componentPath, "utf8");
    await writeFile(componentPath, components.replace("食品数据包导入", "今日进度"));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "COMPONENT_PROGRESS_CONTRACT_INVALID" });
  });
});

test("visual kit rejects a duplicated pattern identity", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(patterns, 'data-pattern="celebration"', 'data-pattern="feedback"'));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "PATTERN_IDENTITY_SET_INVALID" });
  });
});

test("visual kit rejects a pattern screen without internal scrolling", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      ".screen{min-height:0;height:100%;display:flex;flex-direction:column;overflow-x:hidden;overflow-y:auto",
      ".screen{min-height:0;height:100%;display:flex;flex-direction:column;overflow-x:hidden;overflow-y:hidden"
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "PATTERN_SCROLL_CONTRACT_MISSING" });
  });
});

test("visual kit rejects a dialog description outside its pattern", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      'aria-describedby="ai-consent-description"',
      'aria-describedby="missing-consent-description"'
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "DIALOG_ASSOCIATION_INVALID" });
  });
});

test("visual kit rejects modal semantics on an always-visible catalog sheet", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      'role="dialog" aria-labelledby="ai-consent-title"',
      'role="dialog" aria-modal="true" aria-labelledby="ai-consent-title"'
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "STATIC_MODAL_SEMANTICS_INVALID" });
  });
});

test("visual kit rejects a dangerous default focus target", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => {
      const withDangerId = replaceOnce(
        patterns,
        '<button type="button" class="button danger">继续检查删除范围',
        '<button id="delete-confirm" type="button" class="button danger">继续检查删除范围'
      );
      return replaceOnce(withDangerId, 'data-initial-focus="delete-cancel"', 'data-initial-focus="delete-confirm"');
    });
    await assert.rejects(() => checkVisualKit(tempDir), { code: "DESTRUCTIVE_DEFAULT_FOCUS_UNSAFE" });
  });
});

test("visual kit rejects a pattern button without a non-submitting type", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      '<button type="button" class="button primary">添加餐食</button>',
      '<button class="button primary">添加餐食</button>'
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "PATTERN_BUTTON_SEMANTICS_INVALID" });
  });
});

test("visual kit rejects an unapproved undo action", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      '<button type="button">查看记录</button>',
      '<button type="button" data-action="undo">撤销</button>'
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "PATTERN_UNAPPROVED_UNDO" });
  });
});

test("visual kit rejects an enabled AI send before provider approval", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      'class="button primary" disabled aria-describedby="ai-policy-reason"',
      'class="button primary" aria-describedby="ai-policy-reason"'
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "PATTERN_AI_POLICY_NOT_FAIL_CLOSED" });
  });
});

test("visual kit rejects content outside accepted pattern boundaries", async () => {
  await withVisualKitFixture(async (tempDir) => {
    await mutatePatterns(tempDir, (patterns) => replaceOnce(
      patterns,
      "CANDIDATE / NON_PRODUCTION",
      "CANDIDATE / NON_PRODUCTION · 连续记录 7 天"
    ));
    await assert.rejects(() => checkVisualKit(tempDir), { code: "PATTERN_UNAPPROVED_CONTENT" });
  });
});
