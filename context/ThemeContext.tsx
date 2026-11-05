import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextType {
  preference: ThemePreference;
  effectiveScheme: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
}

const THEME_KEY = "@bizpilot_theme";

const ThemeContext = createContext<ThemeContextType>({
  preference: "system",
  effectiveScheme: "light",
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === "light" || val === "dark" || val === "system") {
        setPreferenceState(val);
      }
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(THEME_KEY, p);
  }, []);

  const effectiveScheme: "light" | "dark" =
    preference === "system" ? systemScheme : preference;

  return (
    <ThemeContext.Provider value={{ preference, effectiveScheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
