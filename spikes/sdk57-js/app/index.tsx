import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { sdk57DependencySurface } from './dependency-surface';

const matrix = [
  ['Expo', '57.0.x'],
  ['React Native', '0.86.2'],
  ['React', '19.2.3'],
  ['Node', '22.13.0'],
] as const;

export default function SpikeScreen() {
  const [checks, setChecks] = useState(0);

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.brandRow}>
        <View style={styles.mark}>
          <Text style={styles.markText}>N</Text>
        </View>
        <Text style={styles.brand}>Nuttie</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>JS SPIKE</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CANDIDATE MATRIX</Text>
        <Text style={styles.title}>SDK 57 运行链已接通</Text>
        <Text style={styles.subtitle}>
          这里只验证 JavaScript 依赖、配置与打包链，不代表正式 App 或原生 iOS 已获批准。
        </Text>
      </View>

      <View style={styles.matrix}>
        {matrix.map(([label, value]) => (
          <View key={label} style={styles.matrixRow}>
            <Text style={styles.matrixLabel}>{label}</Text>
            <Text style={styles.matrixValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.boundary}>
        <Text style={styles.boundaryTitle}>当前边界</Text>
        <Text style={styles.boundaryText}>纯 JS · iPhone 竖屏 · 无 Bundle ID</Text>
        <Text style={styles.boundaryText}>无 Prebuild · 无签名 · 无网络业务调用</Text>
      </View>

      <View style={styles.dependencies}>
        <Text style={styles.boundaryTitle}>依赖表面</Text>
        {sdk57DependencySurface.map(({ packageName, symbolName }) => (
          <View key={packageName} style={styles.dependencyRow}>
            <Text style={styles.dependencyPackage}>{packageName}</Text>
            <Text style={styles.dependencySymbol}>{symbolName} · NOT CALLED</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setChecks((value) => value + 1)}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>运行交互检查</Text>
        <Text style={styles.buttonCount}>{checks}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: '#F4F7F5',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  brandRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#163D32',
  },
  markText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  brand: {
    marginLeft: 10,
    color: '#17231F',
    fontSize: 20,
    fontWeight: '800',
  },
  badge: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: '#B8C9C2',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#49665B',
    fontSize: 11,
    fontWeight: '700',
  },
  hero: {
    marginTop: 48,
    marginBottom: 32,
  },
  eyebrow: {
    color: '#4D7B6B',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    maxWidth: 310,
    marginTop: 10,
    color: '#17231F',
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '800',
  },
  subtitle: {
    maxWidth: 360,
    marginTop: 16,
    color: '#5D6D67',
    fontSize: 15,
    lineHeight: 24,
  },
  matrix: {
    borderTopWidth: 1,
    borderTopColor: '#CAD5D1',
  },
  matrixRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CAD5D1',
  },
  matrixLabel: {
    color: '#61716B',
    fontSize: 14,
  },
  matrixValue: {
    marginLeft: 'auto',
    color: '#17231F',
    fontSize: 15,
    fontWeight: '700',
  },
  boundary: {
    marginTop: 28,
    borderLeftWidth: 3,
    borderLeftColor: '#E2B44A',
    paddingLeft: 16,
  },
  boundaryTitle: {
    marginBottom: 8,
    color: '#17231F',
    fontSize: 15,
    fontWeight: '800',
  },
  boundaryText: {
    color: '#61716B',
    fontSize: 13,
    lineHeight: 21,
  },
  dependencies: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: '#CAD5D1',
    paddingTop: 20,
  },
  dependencyRow: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7E4',
  },
  dependencyPackage: {
    color: '#17231F',
    fontSize: 13,
    fontWeight: '700',
  },
  dependencySymbol: {
    marginTop: 3,
    color: '#61716B',
    fontSize: 11,
  },
  button: {
    minHeight: 52,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#163D32',
    paddingHorizontal: 18,
  },
  buttonPressed: {
    backgroundColor: '#0F2E26',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonCount: {
    minWidth: 26,
    marginLeft: 'auto',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
});
