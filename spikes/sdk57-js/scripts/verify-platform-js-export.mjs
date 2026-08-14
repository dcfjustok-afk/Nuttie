import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export class PlatformJavaScriptExportEvidenceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PlatformJavaScriptExportEvidenceError";
    this.code = code;
  }
}

function requireEvidence(condition, code, message) {
  if (!condition) {
    throw new PlatformJavaScriptExportEvidenceError(code, message);
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

async function listFiles(root, code, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    requireEvidence(!entry.isSymbolicLink(), code("SYMLINK_FORBIDDEN"), "export artifacts must not contain symlinks");
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, code, absolutePath));
    } else {
      requireEvidence(entry.isFile(), code("SPECIAL_FILE_FORBIDDEN"), "export artifacts must contain only regular files and directories");
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

export async function verifyPlatformJavaScriptExport(options) {
  const platform = options?.platform;
  requireEvidence(platform === "ios" || platform === "android", "PLATFORM_EXPORT_PLATFORM_INVALID", "platform must be ios or android");
  const platformCode = platform.toUpperCase();
  const code = (suffix) => `${platformCode}_EXPORT_${suffix}`;
  const allowedAssetExtensions = new Set(options.allowedAssetExtensions ?? []);
  requireEvidence(allowedAssetExtensions.size > 0, code("ASSET_POLICY_MISSING"), "allowed asset extensions must be explicit");

  const root = path.resolve(options.root);
  const exportRoot = path.resolve(options.exportRoot);
  const exportRelative = path.relative(root, exportRoot);
  requireEvidence(
    exportRelative.length > 0 && !exportRelative.startsWith("..") && !path.isAbsolute(exportRelative),
    code("ROOT_OUTSIDE_SPIKE"),
    "export root must stay inside the isolated spike root",
  );
  requireEvidence(await pathExists(exportRoot), code("MISSING"), `${platform} JavaScript export directory is missing`);

  for (const nativeDirectory of ["ios", "android"]) {
    requireEvidence(
      !await pathExists(path.join(root, nativeDirectory)),
      code("NATIVE_DIRECTORY_PRESENT"),
      `${nativeDirectory}/ must remain absent from the isolated JavaScript spike`,
    );
  }

  let metadata;
  try {
    metadata = JSON.parse(await readFile(path.join(exportRoot, "metadata.json"), "utf8"));
  } catch (error) {
    throw new PlatformJavaScriptExportEvidenceError(
      code("METADATA_INVALID"),
      `metadata.json must be present and valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  requireEvidence(exactKeys(metadata, ["version", "bundler", "fileMetadata"]), code("METADATA_SHAPE"), "metadata top-level shape changed");
  requireEvidence(metadata.version === 0, code("METADATA_VERSION"), "metadata version must remain 0");
  requireEvidence(metadata.bundler === "metro", code("BUNDLER"), "bundler must remain Metro");
  requireEvidence(exactKeys(metadata.fileMetadata, [platform]), code("PLATFORM_SCOPE"), `export must contain only ${platform} platform metadata`);

  const platformMetadata = metadata.fileMetadata[platform];
  requireEvidence(exactKeys(platformMetadata, ["bundle", "assets"]), code("PLATFORM_METADATA_SHAPE"), `${platform} metadata shape changed`);
  const bundlePath = normalizeMetadataPath(platformMetadata.bundle, code("BUNDLE_PATH"));
  const bundlePattern = new RegExp(`^_expo/static/js/${platform}/entry-[a-f0-9]{32}\\.hbc$`);
  requireEvidence(bundlePattern.test(bundlePath), code("BUNDLE_PATH"), `${platform} bundle must be one hashed Hermes bytecode entry`);
  requireEvidence(Array.isArray(platformMetadata.assets), code("ASSET_METADATA"), `${platform} asset metadata must be an array`);

  const assetPaths = platformMetadata.assets.map((asset) => {
    requireEvidence(exactKeys(asset, ["path", "ext"]), code("ASSET_METADATA"), "asset metadata shape changed");
    const assetPath = normalizeMetadataPath(asset.path, code("ASSET_PATH"));
    requireEvidence(/^assets\/[a-f0-9]{32}$/.test(assetPath), code("ASSET_PATH"), "asset path must use the hashed Expo export form");
    requireEvidence(allowedAssetExtensions.has(asset.ext), code("ASSET_EXTENSION"), `asset extension ${asset.ext} is outside the ${platform} export policy`);
    return assetPath;
  });
  requireEvidence(new Set(assetPaths).size === assetPaths.length, code("DUPLICATE_ASSET"), "asset metadata paths must be unique");

  const expectedFiles = ["metadata.json", bundlePath, ...assetPaths].sort();
  const actualFiles = await listFiles(exportRoot, code);
  requireEvidence(
    JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
    code("FILE_SET_MISMATCH"),
    "export files must exactly match the platform metadata declaration",
  );

  const bundleStats = await stat(resolveWithin(exportRoot, bundlePath, code("BUNDLE_PATH")));
  requireEvidence(bundleStats.isFile() && bundleStats.size > 0, code("BUNDLE_EMPTY"), "Hermes bytecode bundle must be a non-empty regular file");
  const fileStats = await Promise.all(actualFiles.map((file) => stat(resolveWithin(exportRoot, file, code("FILE_PATH")))));
  const totalBytes = fileStats.reduce((sum, file) => sum + file.size, 0);

  return Object.freeze({
    ok: true,
    scope: `SDK57_${platformCode}_JAVASCRIPT_EXPORT_STRUCTURE`,
    platform,
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
