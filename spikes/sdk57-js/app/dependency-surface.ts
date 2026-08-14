import { CameraView } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import Animated from 'react-native-reanimated';
import * as Worklets from 'react-native-worklets';

export const sdk57DependencySurface = Object.freeze([
  Object.freeze({
    packageName: 'expo-sqlite',
    symbolName: 'openDatabaseAsync',
    runtimeSymbol: SQLite.openDatabaseAsync,
  }),
  Object.freeze({
    packageName: 'expo-secure-store',
    symbolName: 'getItemAsync',
    runtimeSymbol: SecureStore.getItemAsync,
  }),
  Object.freeze({
    packageName: 'expo-camera',
    symbolName: 'CameraView',
    runtimeSymbol: CameraView,
  }),
  Object.freeze({
    packageName: 'expo-notifications',
    symbolName: 'getPermissionsAsync',
    runtimeSymbol: Notifications.getPermissionsAsync,
  }),
  Object.freeze({
    packageName: 'react-native-reanimated',
    symbolName: 'Animated.View',
    runtimeSymbol: Animated.View,
  }),
  Object.freeze({
    packageName: 'react-native-worklets',
    symbolName: 'isWorkletFunction',
    runtimeSymbol: Worklets.isWorkletFunction,
  }),
]);
