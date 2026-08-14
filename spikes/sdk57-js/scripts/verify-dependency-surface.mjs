import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const appJson = JSON.parse(await readFile(path.join(root, 'app.json'), 'utf8'));
const surfaceSource = await readFile(path.join(root, 'app', 'dependency-surface.ts'), 'utf8');
const screenSource = await readFile(path.join(root, 'app', 'index.tsx'), 'utf8');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const requiredSurface = Object.freeze([
  Object.freeze({ packageName: 'expo-sqlite', symbolName: 'openDatabaseAsync', runtimeReference: 'SQLite.openDatabaseAsync' }),
  Object.freeze({ packageName: 'expo-secure-store', symbolName: 'getItemAsync', runtimeReference: 'SecureStore.getItemAsync' }),
  Object.freeze({ packageName: 'expo-camera', symbolName: 'CameraView', runtimeReference: 'CameraView' }),
  Object.freeze({ packageName: 'expo-notifications', symbolName: 'getPermissionsAsync', runtimeReference: 'Notifications.getPermissionsAsync' }),
  Object.freeze({ packageName: 'react-native-reanimated', symbolName: 'Animated.View', runtimeReference: 'Animated.View' }),
  Object.freeze({ packageName: 'react-native-worklets', symbolName: 'isWorkletFunction', runtimeReference: 'Worklets.isWorkletFunction' }),
]);

for (const { packageName, symbolName, runtimeReference } of requiredSurface) {
  assert.equal(typeof packageJson.dependencies[packageName], 'string');
  assert.match(surfaceSource, new RegExp(`from ['"]${escapeRegExp(packageName)}['"]`));
  assert.match(surfaceSource, new RegExp(`symbolName: ['"]${escapeRegExp(symbolName)}['"]`));
  assert.match(surfaceSource, new RegExp(`runtimeSymbol:\\s*${escapeRegExp(runtimeReference)},`));
}
assert.equal((surfaceSource.match(/runtimeSymbol:/g) ?? []).length, requiredSurface.length);

assert.match(screenSource, /from ['"]\.\/dependency-surface['"]/);
assert.match(screenSource, /sdk57DependencySurface\.map\(/);

const requiredPlugins = ['expo-sqlite', 'expo-secure-store', 'expo-camera', 'expo-notifications'];
const configuredPlugins = appJson.expo.plugins.map((plugin) => Array.isArray(plugin) ? plugin[0] : plugin);
for (const plugin of requiredPlugins) {
  assert.ok(configuredPlugins.includes(plugin));
}

const forbiddenNativeInvocations = [
  /SQLite\.openDatabaseAsync\s*\(/,
  /SecureStore\.(?:getItemAsync|setItemAsync|deleteItemAsync)\s*\(/,
  /Notifications\.[A-Za-z]+Async\s*\(/,
  /Worklets\.[A-Za-z]+\s*\(/,
  /<CameraView(?:\s|>)/,
  /<Animated\.View(?:\s|>)/,
  /useCameraPermissions\s*\(/,
  /fetch\s*\(/,
  /new\s+(?:XMLHttpRequest|WebSocket)\b/,
];

for (const pattern of forbiddenNativeInvocations) {
  assert.doesNotMatch(surfaceSource, pattern);
  assert.doesNotMatch(screenSource, pattern);
}

console.log(JSON.stringify({
  ok: true,
  scope: 'SDK57_JS_DEPENDENCY_SURFACE',
  requiredPackages: requiredSurface.map(({ packageName }) => packageName),
  requiredPlugins,
  typeAndMetroResolutionRequired: true,
  nativeApiCalls: 0,
  nativeRuntimeEvidence: false,
}, null, 2));
