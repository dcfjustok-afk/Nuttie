import { useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";

import { getSemanticColors, shadows, type ColorScheme } from "@nuttie/design-tokens";

export function useAppTheme() {
  const system = useColorScheme();
  // Match the light static export until Web hydration completes. Native
  // clients can use the platform color scheme on their first render.
  const [ready, setReady] = useState(Platform.OS !== "web");
  useEffect(() => {
    setReady(true);
  }, []);
  const scheme: ColorScheme = ready && system === "dark" ? "dark" : "light";
  return { scheme, colors: getSemanticColors(scheme), shadows: shadows[scheme] };
}
