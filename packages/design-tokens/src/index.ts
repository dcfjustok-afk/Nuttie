export type ColorScheme = "light" | "dark";

export const colors = {
  light: {
    canvas: "#F4F0E8",
    surface: "#FFFDF8",
    surfaceMuted: "#F5EFE6",
    surfaceRaised: "#FFFFFF",
    border: "#E3DBCE",
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
  },
  dark: {
    canvas: "#181D1A",
    surface: "#222823",
    surfaceMuted: "#2B332D",
    surfaceRaised: "#303A32",
    border: "#3B443D",
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
  },
} as const;

export type SemanticColors = (typeof colors)[ColorScheme];

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
  compact: 10,
  card: 16,
  feature: 24,
  round: 999,
} as const;

export const typeScale = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
} as const;

export const dimensions = {
  minTouch: 44,
  control: 48,
  maxShell: 1200,
  desktopRail: 232,
  desktopAside: 280,
  content: 720,
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

export const growthStates = ["quiet", "growing", "complete", "syncing"] as const;
export type GrowthState = (typeof growthStates)[number];

export function getGrowthState(progress: number, pendingSync = false): GrowthState {
  if (pendingSync) return "syncing";
  if (progress >= 0.85) return "complete";
  if (progress >= 0.35) return "growing";
  return "quiet";
}

export function getSemanticColors(scheme: ColorScheme): SemanticColors {
  return colors[scheme];
}
