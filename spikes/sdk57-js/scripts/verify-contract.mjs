import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const appJson = JSON.parse(await readFile(path.join(root, 'app.json'), 'utf8'));

assert.equal(packageJson.private, true);
assert.equal(packageJson.packageManager, 'pnpm@11.18.0');
assert.equal(packageJson.engines.node, '22.13.x');
assert.equal(packageJson.dependencies.expo, '~57.0.9');
assert.equal(packageJson.dependencies.react, '19.2.3');
assert.equal(packageJson.dependencies['react-native'], '0.86.2');
assert.equal(packageJson.main, 'expo-router/entry');
assert.equal(appJson.expo.orientation, 'portrait');
assert.equal(appJson.expo.ios.supportsTablet, false);
assert.equal(appJson.expo.ios.bundleIdentifier, undefined);

for (const forbiddenDirectory of ['ios', 'android']) {
  await assert.rejects(access(path.join(root, forbiddenDirectory)));
}

console.log(JSON.stringify({
  ok: true,
  scope: 'ISOLATED_JS_SPIKE',
  packageManager: packageJson.packageManager,
  node: packageJson.engines.node,
  expo: packageJson.dependencies.expo,
  reactNative: packageJson.dependencies['react-native'],
  react: packageJson.dependencies.react,
  nativeDirectories: false,
  bundleIdentifier: null,
}, null, 2));
