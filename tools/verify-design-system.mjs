import assert from "node:assert/strict";

import {
  brand,
  breakpoints,
  colors,
  componentTokens,
  dimensions,
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

console.log("Design system contract verified.");
