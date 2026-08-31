import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  brand,
  breakpoints,
  colors,
  componentTokens,
  dimensions,
  getGrowthMarkSize,
  getSizeClass,
  growthStates,
  layers,
  motion,
  radii,
  spacing,
  stateColorRoles,
  typeScale,
} from "../packages/design-tokens/dist/index.js";

assert.equal(brand.name, "Nuttie");
assert.equal(brand.northStar, "Living Growth Mark");
assert.deepEqual(brand.roles, ["home", "meal", "growth", "streak"]);
assert.deepEqual(growthStates, ["quiet", "growing", "complete", "syncing"]);

for (const scheme of ["light", "dark"]) {
  for (const role of [
    "canvas",
    "surface",
    "border",
    "track",
    "ink",
    "chestnut",
    "sprout",
    "amber",
    "sky",
    "danger",
  ]) {
    assert.match(colors[scheme][role], /^#[0-9A-F]{6}$/);
  }
  assert.match(colors[scheme].scrim, /^#[0-9A-F]{8}$/);
}

assert.equal(typeScale.body.letterSpacing, 0);
assert.equal(typeScale.caption.letterSpacing, 0);
assert.equal(dimensions.minTouch >= 44, true);
assert.equal(dimensions.control >= dimensions.minTouch, true);
assert.equal(componentTokens.touchTarget.minSize, dimensions.minTouch);
assert.equal(componentTokens.control.minHeight, dimensions.control);
assert.equal(componentTokens.navigation.railWidth, dimensions.desktopRail);
assert.equal(componentTokens.addRecordSheet.maxWidth, dimensions.sheet);
assert.equal(componentTokens.growthMark.defaultSize, 188);
assert.equal(
  getGrowthMarkSize("compact"),
  componentTokens.growthMark.compactSize,
);
assert.equal(
  getGrowthMarkSize("regular"),
  componentTokens.growthMark.defaultSize,
);
assert.equal(
  getGrowthMarkSize("expanded"),
  componentTokens.growthMark.wideSize,
);
assert.equal(getGrowthMarkSize("wide"), componentTokens.growthMark.wideSize);
assert.ok(
  spacing.xs < spacing.sm && spacing.sm < spacing.md && spacing.md < spacing.lg,
);
assert.ok(
  radii.segment < radii.compact &&
    radii.compact < radii.card &&
    radii.card < radii.feature,
);
assert.ok(
  breakpoints.compact < breakpoints.regular &&
    breakpoints.regular < breakpoints.expanded &&
    breakpoints.expanded < breakpoints.wide,
);
assert.equal(getSizeClass(320), "compact");
assert.equal(getSizeClass(600), "regular");
assert.equal(getSizeClass(768), "expanded");
assert.equal(getSizeClass(1440), "wide");
assert.equal(stateColorRoles.complete, "sprout");
assert.equal(stateColorRoles.conflict, "danger");
assert.ok(motion.duration.standard > motion.duration.fast);
assert.ok(layers.sheet > layers.scrim && layers.scrim > layers.base);

const uiRoots = [
  path.resolve("apps/app/app"),
  path.resolve("apps/app/src"),
  path.resolve("packages/ui/src"),
];
const sourceFiles = [];
async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(target);
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(target);
  }
}
for (const root of uiRoots) await collect(root);
const forbiddenInlineStyle =
  /#[0-9A-Fa-f]{3,8}|rgba?\(|(?:fontSize|lineHeight|borderRadius|padding|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginHorizontal|gap|width|height|minHeight|maxWidth|flexBasis):\s*\d+(?:\.\d+)?\b/;
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  assert.equal(
    forbiddenInlineStyle.test(source),
    false,
    `${path.relative(process.cwd(), file)} bypasses design tokens`,
  );
}

console.log("Design system contract verified.");
