import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 * Reads the user's theme preference from ThemeContext (system / light / dark).
 */
export function useColors() {
  const { effectiveScheme } = useTheme();
  const palette = effectiveScheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
