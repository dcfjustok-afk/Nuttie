import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import {
  EXPECTED_PRERENDERED_ROUTES,
  WEB_DIRECTION_CONTRACT_COMMENT,
} from "./web-export-contract.mjs";
import {
  WebExportVerificationError,
  verifyWebExport,
} from "./verify-web-export.mjs";

const favicon =
  '<svg xmlns="http://www.w3.org/2000/svg"><title>Nuttie</title></svg>';

function html({
  body = `${WEB_DIRECTION_CONTRACT_COMMENT}<div id="root"></div>`,
} = {}) {
  return `<!doctype html><html><head><link rel="icon" href="/favicon.svg"></head><body>${body}</body></html>`;
}

async function fixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "nuttie-web-export-"));
  await writeFile(path.join(root, "favicon.svg"), favicon);
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  return root;
}

test("accepts a complete export and checks every HTML entry", async () => {
  const root = await fixture({ "index.html": html(), "diary.html": html() });
  try {
    const report = await verifyWebExport({
      exportRoot: root,
      expectedRoutes: { "/": "index.html", "/diary": "diary.html" },
    });
    assert.equal(report.ok, true);
    assert.equal(report.htmlFileCount, 2);
    assert.deepEqual(report.prerenderedRoutes, ["/", "/diary"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects an empty body and a missing prerendered route", async () => {
  const root = await fixture({ "index.html": html({ body: "" }) });
  try {
    await assert.rejects(
      verifyWebExport({
        exportRoot: root,
        expectedRoutes: EXPECTED_PRERENDERED_ROUTES,
      }),
      (error) => {
        assert.ok(error instanceof WebExportVerificationError);
        const codes = error.failures.map((failure) => failure.code);
        assert.ok(codes.includes("BODY_CONTRACT_NOT_FIRST"));
        assert.ok(codes.includes("PRERENDERED_ROUTE_MISSING"));
        return true;
      },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
