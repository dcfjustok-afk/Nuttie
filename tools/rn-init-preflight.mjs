import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { reconcileWorkspace } from "../project-ops/reconcile.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

const REQUIRED_NEXT_OWNER_GATE = Object.freeze({
  questionId: "d040_onboarding_goals",
  channel: "CODEX_REQUEST_USER_INPUT",
  tool: "request_user_input",
});

const TOOL_NAMES = Object.freeze(["node", "pnpm", "expo", "xcodebuild", "pod"]);
const FORBIDDEN_ARTIFACTS = Object.freeze([
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "app.json",
  "app.config.js",
  "app.config.mjs",
  "app.config.cjs",
  "app.config.ts",
  "ios",
  "android",
  "Podfile.lock",
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
  const deviceAvailability = gate.deviceAvailability ?? {};
  const jsSpikeAuthorization = gate.jsSpikeAuthorization ?? {};
  const selectionMechanismConfigured = gate.channel === REQUIRED_NEXT_OWNER_GATE.channel
    && nextQuestion.id === REQUIRED_NEXT_OWNER_GATE.questionId
    && nextQuestion.tool === REQUIRED_NEXT_OWNER_GATE.tool
    && nativeGate.passed === true;
  const batchConfirmed = gate.status === "CONFIRMED";
  const deviceFactRecorded = deviceAvailability.normalizedValue === "IPHONE_ONLY"
    && deviceAvailability.iphoneAvailability === "AVAILABLE";
  const macAvailable = deviceAvailability.macAvailability === "AVAILABLE";
  return {
    passed: batchConfirmed,
    selectionMechanismConfigured,
    batchConfirmed,
    deviceFactRecorded,
    macAvailable,
    deviceAvailability,
    jsSpikeAuthorization,
    acceptanceStateChanged: gate.acceptanceStateChanged,
    status: gate.status,
    nextQuestionId: nextQuestion.id ?? null,
    expected: REQUIRED_NEXT_OWNER_GATE,
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
  if (!owner.batchConfirmed && !owner.selectionMechanismConfigured) diagnostics.push({ code: "OWNER_NATIVE_SELECTION_GATE_NOT_READY", details: owner });
  if (!owner.deviceFactRecorded) diagnostics.push({ code: "OWNER_DEVICE_FACT_NOT_RECORDED", details: owner });
  if (!owner.batchConfirmed) diagnostics.push({ code: "OWNER_BATCH_NOT_CONFIRMED", details: owner });
  if (owner.acceptanceStateChanged !== true) diagnostics.push({ code: "OWNER_BATCH_STATE_NOT_APPLIED", details: owner });
  if (!owner.jsSpikeAuthorization.authorized) diagnostics.push({ code: "JS_SPIKE_NOT_AUTHORIZED", details: owner.jsSpikeAuthorization });
  if (presentArtifacts.length > 0) diagnostics.push({ code: "FORMAL_RN_ARTIFACT_PRESENT", details: { presentArtifacts } });
  if (!toolchain.node.available) diagnostics.push({ code: "NODE_NOT_AVAILABLE" });
  if (!toolchain.pnpm.available) diagnostics.push({ code: "PNPM_NOT_AVAILABLE" });
  if (!owner.macAvailable) diagnostics.push({ code: "MAC_NOT_AVAILABLE", details: owner.deviceAvailability });
  if (!toolchain.xcodebuild.available) diagnostics.push({ code: "XCODEBUILD_NOT_AVAILABLE" });
  if (!toolchain.pod.available) diagnostics.push({ code: "COCOAPODS_NOT_AVAILABLE" });

  const readyForJsSpike = reconcile.ok
    && owner.batchConfirmed
    && owner.deviceFactRecorded
    && owner.acceptanceStateChanged === true
    && owner.jsSpikeAuthorization.authorized
    && presentArtifacts.length === 0
    && toolchain.node.available
    && toolchain.pnpm.available;
  const readyForNativeIosSpike = readyForJsSpike
    && owner.macAvailable
    && toolchain.xcodebuild.available
    && toolchain.pod.available;

  return {
    ok: readyForNativeIosSpike,
    readyForInitialization: readyForNativeIosSpike,
    readyForJsSpike,
    readyForNativeIosSpike,
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
