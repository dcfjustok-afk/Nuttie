export type ColorScheme = "light" | "dark";

/**
 * Brand and semantic vocabulary are shared by native clients and React Native
 * Web. Product copy can be localized at the app layer without changing the
 * visual roles or state names used by the system.
 */
export const brand = {
  name: "Nuttie",
  localName: "\u6817\u5b50\u81ea\u5f8b",
  northStar: "Living Growth Mark",
  tagline: {
    zh: "\u79ef\u201c\u6817\u201d\u524d\u884c，\u201c\u7acb\u201d\u89c1\u66f4\u597d\u7684\u81ea\u5df1。",
    en: "Small steps, solid growth.",
  },
  roles: ["home", "meal", "growth", "streak"] as const,
} as const;

export type BrandRole = (typeof brand.roles)[number];

export const colors = {
  light: {
    canvas: "#F4F0E8",
    surface: "#FFFDF8",
    surfaceMuted: "#F5EFE6",
    surfaceRaised: "#FFFFFF",
    border: "#E3DBCE",
    track: "#E9E4DA",
    ink: "#252A26",
    inkMuted: "#5F6860",
    inkSubtle: "#7B837B",
    inverse: "#FFFFFF",
    chestnut: "#A85D3F",
    chestnutDark: "#783F30",
    sprout: "#3F7C59",
    sproutSoft: "#E5F0E7",
    amber: "#E2A34A",
    amberSoft: "#FFF2D8",
    sky: "#4E88A5",
    skyDark: "#28546B",
    skySoft: "#E6F1F5",
    danger: "#B9574C",
    dangerSoft: "#F8E6E2",
    scrim: "#14181575",
  },
  dark: {
    canvas: "#181D1A",
    surface: "#222823",
    surfaceMuted: "#2B332D",
    surfaceRaised: "#303A32",
    border: "#3B443D",
    track: "#3B443D",
    ink: "#F3F5F1",
    inkMuted: "#B5C0B8",
    inkSubtle: "#94A198",
    inverse: "#181D1A",
    chestnut: "#D58A68",
    chestnutDark: "#F0B49A",
    sprout: "#80B58B",
    sproutSoft: "#294532",
    amber: "#F0C16B",
    amberSoft: "#4A3920",
    sky: "#7CB2C8",
    skyDark: "#B4D9E7",
    skySoft: "#203B45",
    danger: "#E17B72",
    dangerSoft: "#4B2927",
    scrim: "#00000099",
  },
} as const;

export type SemanticColors = (typeof colors)[ColorScheme];

export type SemanticColorRole = keyof SemanticColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  page: 40,
} as const;

export const radii = {
  segment: 8,
  compact: 10,
  card: 16,
  feature: 24,
  round: 999,
} as const;

export const typeScale = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0,
  },
} as const;

export const fontFamilies = {
  native: {
    ios: "System",
    android: "sans-serif",
  },
  web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const dimensions = {
  minTouch: 44,
  control: 48,
  bottomNavigation: 64,
  maxShell: 1200,
  desktopRail: 232,
  desktopAside: 280,
  content: 720,
  sheet: 600,
} as const;

export const breakpoints = {
  compact: 0,
  regular: 600,
  expanded: 768,
  wide: 1024,
} as const;

export type SizeClass = "compact" | "regular" | "expanded" | "wide";

export function getSizeClass(width: number): SizeClass {
  if (!Number.isFinite(width) || width < breakpoints.regular) return "compact";
  if (width < breakpoints.expanded) return "regular";
  if (width < breakpoints.wide) return "expanded";
  return "wide";
}

export const componentTokens = {
  control: {
    minHeight: dimensions.control,
    radius: radii.compact,
    horizontalPadding: spacing.md,
  },
  touchTarget: {
    minSize: dimensions.minTouch,
  },
  card: {
    radius: radii.card,
    padding: spacing.lg,
  },
  featureSurface: {
    radius: radii.feature,
    padding: spacing.xxl,
  },
  navigation: {
    bottomHeight: dimensions.bottomNavigation,
    railWidth: dimensions.desktopRail,
    itemMaxWidth: 120,
    itemInset: spacing.xs,
    footerMaxWidth: 150,
  },
  brandMark: {
    size: 40,
    radius: radii.compact,
  },
  sessionHint: {
    minHeight: 36,
  },
  metricBand: {
    minHeight: 116,
    markerWidth: spacing.xxl,
    markerHeight: spacing.xs,
    markerRadius: spacing.xs / 2,
  },
  recordRow: {
    minHeight: 72,
    iconSize: 40,
    iconRadius: radii.compact,
    copyGap: spacing.xs,
  },
  account: {
    minHeight: 80,
    avatarSize: dimensions.minTouch,
    avatarRadius: radii.compact,
    statusSize: spacing.sm,
  },
  feedback: {
    minHeight: 52,
  },
  notice: {
    minHeight: 76,
  },
  modal: {
    maxWidth: 520,
    iconSize: 40,
    actionMinWidth: 112,
  },
  addRecordSheet: {
    maxWidth: dimensions.sheet,
    keyboardMaxHeight: "92%",
  },
  growthMark: {
    defaultSize: 188,
    compactSize: 178,
    wideSize: 206,
    strokeRatio: 0.065,
    percentFontSize: 28,
    percentLineHeight: 34,
    stateFontSize: 12,
    stateLineHeight: 16,
    minimumStroke: 10,
  },
  signIn: {
    maxWidth: 520,
    logoSize: 46,
    logoRadius: 15,
    growthMarkSize: 148,
  },
  diary: {
    heroWideMinHeight: 260,
    heroCopyMaxWidth: 520,
    metaDotSize: spacing.sm,
    metricCellBasis: 180,
    metricCellMinWidth: 160,
    macroMinWidth: 90,
    macroMarkerWidth: 20,
    emptyMinHeight: 190,
    emptyBodyMaxWidth: 340,
  },
  trends: {
    chartMinHeight: 340,
    insightMinHeight: 220,
    plotMinHeight: 220,
    barColumnMinWidth: 28,
    barTrackMaxWidth: 34,
    barTrackHeight: 160,
    barMinHeight: spacing.xs,
    legendDotSize: spacing.sm,
  },
  food: {
    rowMinHeight: 88,
    iconSize: 42,
    iconRadius: radii.compact,
    emptyMinHeight: 190,
    packMinHeight: 72,
    packIconSize: 38,
  },
} as const;

export const motion = {
  duration: {
    instant: 0,
    fast: 120,
    standard: 200,
    emphasis: 280,
  },
  easing: {
    standard: "ease-out",
    emphasized: "ease-in-out",
  },
  reducedMotion: "never-hide-state" as const,
} as const;

export const layers = {
  base: 0,
  navigation: 10,
  scrim: 20,
  sheet: 30,
  toast: 40,
} as const;

export const shadows = {
  light: {
    small: {
      shadowColor: "#403021",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    feature: {
      shadowColor: "#403021",
      shadowOpacity: 0.12,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5,
    },
  },
  dark: {
    small: {
      shadowColor: "#000000",
      shadowOpacity: 0.28,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    feature: {
      shadowColor: "#000000",
      shadowOpacity: 0.42,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5,
    },
  },
} as const;

export const growthStates = [
  "quiet",
  "growing",
  "complete",
  "syncing",
] as const;
export type GrowthState = (typeof growthStates)[number];

export const stateColorRoles = {
  quiet: "inkMuted",
  growing: "chestnut",
  complete: "sprout",
  syncing: "sky",
  pending: "amber",
  conflict: "danger",
} as const satisfies Record<
  GrowthState | "pending" | "conflict",
  SemanticColorRole
>;

export function getGrowthState(
  progress: number,
  pendingSync = false,
): GrowthState {
  if (pendingSync) return "syncing";
  if (progress >= 0.85) return "complete";
  if (progress >= 0.35) return "growing";
  return "quiet";
}

export function getGrowthMarkSize(sizeClass: SizeClass): number {
  if (sizeClass === "compact") return componentTokens.growthMark.compactSize;
  if (sizeClass === "expanded" || sizeClass === "wide") {
    return componentTokens.growthMark.wideSize;
  }
  return componentTokens.growthMark.defaultSize;
}

export function getSemanticColors(scheme: ColorScheme): SemanticColors {
  return colors[scheme];
}
