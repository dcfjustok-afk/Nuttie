import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import {
  colors as tokenColors,
  componentTokens,
  type GrowthState,
  type SemanticColors,
} from "@nuttie/design-tokens";

type GrowthMarkProps = {
  progress: number;
  state: GrowthState;
  size?: number;
  label?: string;
  colors?: SemanticColors;
};

const stateCopy: Record<GrowthState, string> = {
  quiet: "刚刚开始",
  growing: "正在生长",
  complete: "今天已完成",
  syncing: "正在同步",
};

export function GrowthMark({
  progress,
  state,
  size = componentTokens.growthMark.defaultSize,
  label = "今日成长标记",
  colors = tokenColors.light,
}: GrowthMarkProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = Math.max(
    componentTokens.growthMark.minimumStroke,
    size * componentTokens.growthMark.strokeRatio,
  );
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const palette = colors;
  const active =
    state === "complete"
      ? palette.sprout
      : state === "syncing"
        ? palette.sky
        : palette.chestnut;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}，${stateCopy[state]}，完成度 ${Math.round(clamped * 100)}%`}
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={active}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <Path
          d={`M ${size * 0.5} ${size * 0.28} C ${size * 0.43} ${size * 0.36}, ${size * 0.42} ${size * 0.48}, ${size * 0.5} ${size * 0.62}`}
          stroke={palette.sprout}
          strokeWidth={stroke * 0.42}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${size * 0.5} ${size * 0.49} C ${size * 0.63} ${size * 0.4}, ${size * 0.7} ${size * 0.45}, ${size * 0.69} ${size * 0.55}`}
          stroke={palette.sprout}
          strokeWidth={stroke * 0.42}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={[styles.center, styles.centerPointerEvents]}>
        <Text style={[styles.percent, { color: palette.ink }]}>
          {Math.round(clamped * 100)}%
        </Text>
        <Text style={[styles.state, { color: palette.inkMuted }]}>
          {stateCopy[state]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerPointerEvents: {
    pointerEvents: "none",
  },
  percent: {
    fontSize: componentTokens.growthMark.percentFontSize,
    lineHeight: componentTokens.growthMark.percentLineHeight,
    fontWeight: "700",
  },
  state: {
    fontSize: componentTokens.growthMark.stateFontSize,
    lineHeight: componentTokens.growthMark.stateLineHeight,
    fontWeight: "600",
  },
});
