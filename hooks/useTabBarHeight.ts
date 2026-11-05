import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === "web") return 84 + 34;
  if (Platform.OS === "ios") return Math.max(insets.bottom, 34) + 90;
  return insets.bottom + 60;
}
