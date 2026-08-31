import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

import { getSizeClass } from "@nuttie/design-tokens";

/**
 * Keep the first Web render identical to the static Expo HTML.  The static
 * renderer has no viewport, so responsive branches must wait until the
 * browser has mounted before reading its real dimensions.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const [ready, setReady] = useState(Platform.OS !== "web");

  useEffect(() => {
    setReady(true);
  }, []);

  return {
    width: ready ? width : 0,
    height: ready ? height : 0,
    sizeClass: getSizeClass(ready ? width : 0),
    ready,
  };
}
