import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const IOS_BUNDLE_PATTERN = /^_expo\/static\/js\/ios\/entry-[a-f0-9]{32}\.hbc$/;
const ASSET_PATH_PATTERN = /^assets\/[a-f0-9]{32}$/;

export class IosJavaScriptExportEvidenceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IosJavaScriptExportEvidenceError";
    this.code = code;
  }
}

function requireEvidence(condition, code, message) {
  if (!condition) {
    throw new IosJavaScriptExportEvidenceError(code, message);
  }
}

function exactKeys(value, expected) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort())
  );
}

function normalizeMetadataPath(value, code) {
  requireEvidence(typeof value === "string" && value.length > 0, code, "metadata path must be a non-empty string");
  const portablePath = value.replaceAll("\\", "/");
  requireEvidence(!portablePath.startsWith("/") && !/^[A-Za-z]:/.test(portablePath), code, "metadata path must be relative");
  const segments = portablePath.split("/");
  requireEvidence(
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== ".."),
    code,
    "metadata path must not contain empty, current, or parent segments",
  );
  return segments.join("/");
}

function resolveWithin(root, portablePath, code) {
  const resolved = path.resolve(root, ...portablePath.split("/"));
  const relative = path.relative(root, resolved);
  requireEvidence(relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative), code, "artifact path escaped export root");
  return resolved;
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    requireEvidence(!entry.isSymbolicLink(), "IOS_EXPORT_SYMLINK_FORBIDDEN", "export artifacts must not contain symlinks");
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, absolutePath));
    } else {
      requireEvidence(entry.isFile(), "IOS_EXPORT_SPECIAL_FILE_FORBIDDEN", "export artifacts must contain only regular files and directories");
      files.push(path.relative(root, absolutePath).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function verifyIosJavaScriptExport(options = {}) {
  const root = path.resolve(options.root ?? DEFAULT_ROOT);
  const exportRoot = path.resolve(options.exportRoot ?? path.join(root, "dist-ios"));
  const exportRelative = path.relative(root, exportRoot);
  requireEvidence(
    exportRelative.length > 0 && !exportRelative.startsWith("..") && !path.isAbsolute(exportRelative),
    "IOS_EXPORT_ROOT_OUTSIDE_SPIKE",
    "export root must stay inside the isolated spike root",
  );
  requireEvidence(await pathExists(exportRoot), "IOS_EXPORT_MISSING", "iOS JavaScript export directory is missing");

  for (const nativeDirectory of ["ios", "android"]) {
    requireEvidence(
      !await pathExists(path.join(root, nativeDirectory)),
      "IOS_EXPORT_NATIVE_DIRECTORY_PRESENT",
      `${nativeDirectory}/ must remain absent from the isolated JavaScript spike`,
    );
  }

  let metadata;
  try {
    metadata = JSON.parse(await readFile(path.join(exportRoot, "metadata.json"), "utf8"));
  } catch (error) {
    throw new IosJavaScriptExportEvidenceError(
      "IOS_EXPORT_METADATA_INVALID",
      `metadata.json must be present and valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  requireEvidence(exactKeys(metadata, ["version", "bundler", "fileMetadata"]), "IOS_EXPORT_METADATA_SHAPE", "metadata top-level shape changed");
  requireEvidence(metadata.version === 0, "IOS_EXPORT_METADATA_VERSION", "metadata version must remain 0");
  requireEvidence(metadata.bundler === "metro", "IOS_EXPORT_BUNDLER", "bundler must remain Metro");
  requireEvidence(exactKeys(metadata.fileMetadata, ["ios"]), "IOS_EXPORT_PLATFORM_SCOPE", "export must contain only iOS platform metadata");

  const iosMetadata = metadata.fileMetadata.ios;
  requireEvidence(exactKeys(iosMetadata, ["bundle", "assets"]), "IOS_EXPORT_IOS_METADATA_SHAPE", "iOS metadata shape changed");
  const bundlePath = normalizeMetadataPath(iosMetadata.bundle, "IOS_EXPORT_BUNDLE_PATH");
  requireEvidence(IOS_BUNDLE_PATTERN.test(bundlePath), "IOS_EXPORT_BUNDLE_PATH", "iOS bundle must be one hashed Hermes bytecode entry");
  requireEvidence(Array.isArray(iosMetadata.assets), "IOS_EXPORT_ASSET_METADATA", "iOS asset metadata must be an array");

  const assetPaths = iosMetadata.assets.map((asset) => {
    requireEvidence(exactKeys(asset, ["path", "ext"]), "IOS_EXPORT_ASSET_METADATA", "asset metadata shape changed");
    const assetPath = normalizeMetadataPath(asset.path, "IOS_EXPORT_ASSET_PATH");
    requireEvidence(ASSET_PATH_PATTERN.test(assetPath), "IOS_EXPORT_ASSET_PATH", "asset path must use the hashed Expo export form");
    requireEvidence(asset.ext === "png", "IOS_EXPORT_ASSET_EXTENSION", "current isolated spike must export only PNG assets");
    return assetPath;
  });
  requireEvidence(new Set(assetPaths).size === assetPaths.length, "IOS_EXPORT_DUPLICATE_ASSET", "asset metadata paths must be unique");

  const expectedFiles = ["metadata.json", bundlePath, ...assetPaths].sort();
  const actualFiles = await listFiles(exportRoot);
  requireEvidence(
    JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
    "IOS_EXPORT_FILE_SET_MISMATCH",
    "export files must exactly match the iOS metadata declaration",
  );

  const bundleStats = await stat(resolveWithin(exportRoot, bundlePath, "IOS_EXPORT_BUNDLE_PATH"));
  requireEvidence(bundleStats.isFile() && bundleStats.size > 0, "IOS_EXPORT_BUNDLE_EMPTY", "Hermes bytecode bundle must be a non-empty regular file");
  const fileStats = await Promise.all(actualFiles.map((file) => stat(resolveWithin(exportRoot, file, "IOS_EXPORT_FILE_PATH"))));
  const totalBytes = fileStats.reduce((sum, file) => sum + file.size, 0);

  return Object.freeze({
    ok: true,
    scope: "SDK57_IOS_JAVASCRIPT_EXPORT_STRUCTURE",
    platform: "ios",
    bundler: "metro",
    metadataVersion: 0,
    bundleFormat: "HERMES_BYTECODE",
    bundleFiles: 1,
    assetFiles: assetPaths.length,
    totalFiles: actualFiles.length,
    bundleBytes: bundleStats.size,
    totalBytes,
    bundleSha256UsedAsGate: false,
    fingerprintPolicy: "RUN_SPECIFIC_NOT_REPRODUCIBILITY_GATE",
    nativeDirectories: false,
    nativeRuntimeEvidence: false,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)) {
  try {
    const report = await verifyIosJavaScriptExport();
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      code: error?.code ?? "IOS_EXPORT_VERIFICATION_FAILED",
      message: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exitCode = 1;
  }
}
