import { useColorScheme } from "react-native";

import { getSemanticColors, shadows, type ColorScheme } from "@nuttie/design-tokens";

export function useAppTheme() {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" ? "dark" : "light";
  return { scheme, colors: getSemanticColors(scheme), shadows: shadows[scheme] };
}
