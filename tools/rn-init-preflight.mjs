import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { reconcileWorkspace } from "../project-ops/reconcile.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

const REQUIRED_OWNER_GATE = Object.freeze({
  questionId: "oi03_device_availability",
  channel: "CODEX_REQUEST_USER_INPUT",
  mode: "PLAN",
  tool: "request_user_input",
});

const TOOL_NAMES = Object.freeze(["node", "pnpm", "expo", "xcodebuild", "pod"]);
const FORBIDDEN_ARTIFACTS = Object.freeze([
  "package.json",
  "pnpm-lock.yaml",
  "ios",
]);

function pathEntries() {
  return (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
}

function commandCandidates(name) {
  if (process.platform !== "win32") return [name];
  const extensions = (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM")
    .split(";")
    .filter(Boolean)
    .map((extension) => extension.toLowerCase());
  return [name, ...extensions.map((extension) => `${name}${extension}`)];
}

export function findCommand(name) {
  for (const entry of pathEntries()) {
    for (const candidate of commandCandidates(name)) {
      const candidatePath = path.join(entry, candidate);
      try {
        if (fs.statSync(candidatePath).isFile()) return candidatePath;
      } catch {
        // PATH entries can disappear while a shell is running.
      }
    }
  }
  return null;
}

export function inspectToolchain() {
  return Object.fromEntries(TOOL_NAMES.map((name) => [name, {
    available: Boolean(findCommand(name)),
    path: findCommand(name),
  }]));
}

export function inspectArtifacts(workspaceRoot) {
  return Object.fromEntries(FORBIDDEN_ARTIFACTS.map((relativePath) => {
    const absolutePath = path.join(workspaceRoot, relativePath);
    return [relativePath, {
      present: fs.existsSync(absolutePath),
      path: absolutePath,
    }];
  }));
}

function ownerGateStatus(report) {
  const gate = report.ownerGate ?? {};
  const nextQuestion = gate.nextQuestion ?? {};
  const nativeGate = gate.nativeSelectionGate ?? {};
  const passed = gate.channel === REQUIRED_OWNER_GATE.channel
    && nextQuestion.id === REQUIRED_OWNER_GATE.questionId
    && nextQuestion.requiresMode === REQUIRED_OWNER_GATE.mode
    && nextQuestion.tool === REQUIRED_OWNER_GATE.tool
    && nativeGate.passed === true;
  return {
    passed,
    acceptanceStateChanged: gate.acceptanceStateChanged,
    status: gate.status,
    nextQuestionId: nextQuestion.id ?? null,
    expected: REQUIRED_OWNER_GATE,
  };
}

export function runPreflight(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const resolvedRoot = path.resolve(workspaceRoot);
  const reconcile = reconcileWorkspace(resolvedRoot);
  const owner = ownerGateStatus(reconcile);
  const artifacts = inspectArtifacts(resolvedRoot);
  const toolchain = inspectToolchain();
  const presentArtifacts = Object.entries(artifacts)
    .filter(([, artifact]) => artifact.present)
    .map(([relativePath]) => relativePath);
  const diagnostics = [];

  if (!reconcile.ok) diagnostics.push({ code: "PROJECT_OPS_RECONCILE_FAILED", details: reconcile.diagnostics });
  if (!owner.passed) diagnostics.push({ code: "OWNER_NATIVE_SELECTION_GATE_NOT_READY", details: owner });
  if (owner.acceptanceStateChanged !== false) diagnostics.push({ code: "OWNER_BATCH_ALREADY_CHANGED", details: owner });
  if (presentArtifacts.length > 0) diagnostics.push({ code: "FORMAL_RN_ARTIFACT_PRESENT", details: { presentArtifacts } });
  if (!toolchain.node.available) diagnostics.push({ code: "NODE_NOT_AVAILABLE" });
  if (!toolchain.pnpm.available) diagnostics.push({ code: "PNPM_NOT_AVAILABLE" });
  if (!toolchain.xcodebuild.available) diagnostics.push({ code: "XCODEBUILD_NOT_AVAILABLE" });

  return {
    ok: diagnostics.length === 0,
    readyForInitialization: diagnostics.length === 0,
    workspaceRoot: resolvedRoot,
    reconcile: {
      ok: reconcile.ok,
      snapshotFreshness: reconcile.snapshot?.freshness ?? "UNKNOWN",
      counts: reconcile.counts,
    },
    owner,
    artifacts,
    toolchain,
    diagnostics,
  };
}

function parseArguments(argv) {
  if (argv.length === 0) return DEFAULT_WORKSPACE_ROOT;
  if (argv.length === 2 && argv[0] === "--workspace") return path.resolve(argv[1]);
  throw new Error("Usage: node tools/rn-init-preflight.mjs [--workspace <repo-root>]");
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && path.resolve(SCRIPT_PATH) === invokedPath) {
  try {
    const report = runPreflight(parseArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    process.exitCode = 2;
  }
}

