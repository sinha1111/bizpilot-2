import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, Appearance, Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { PinLockScreen } from "@/components/PinLockScreen";
import { AppProvider, useApp } from "@/context/AppContext";
import { PinProvider, usePin } from "@/context/PinContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutContent() {
  const colors = useColors();
  const { effectiveScheme, preference } = useTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);

    // Edge-to-edge: the OS draws transparent system bars. Making the app's
    // night mode follow the in-app theme lets Android pick light/dark
    // status & navigation bar icons without any deprecated Window API.
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
    }
  }, [colors.background, preference]);

  return (
    <KeyboardProvider>
      <StatusBar style={effectiveScheme === "dark" ? "light" : "dark"} />
      <ScreenFrame>
        <LoadingGate>
          <OnboardingGate>
            <PinGate>
              <RootLayoutNav />
            </PinGate>
          </OnboardingGate>
        </LoadingGate>
      </ScreenFrame>
    </KeyboardProvider>
  );
}

// Makes the app work in landscape / tablets / foldables / split-screen:
// keeps content clear of side cutouts and nav bar, and caps the content
// width on large screens so the phone layout doesn't stretch.
function ScreenFrame({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center" }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 840,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function LoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useApp();
  if (isLoading) {
    return (
      <View style={loadStyles.container}>
        <View style={loadStyles.card}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={loadStyles.title}>BizPilot</Text>
          <Text style={loadStyles.sub}>লোড হচ্ছে...</Text>
        </View>
      </View>
    );
  }
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  if (!settings.isOnboarded && Platform.OS !== "web") return <OnboardingScreen />;
  return <>{children}</>;
}

function PinGate({ children }: { children: React.ReactNode }) {
  const { isLocked } = usePin();
  if (isLocked) return <PinLockScreen />;
  return <>{children}</>;
}

const loadStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  card: { alignItems: "center", gap: 12, padding: 32 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#4f46e5", marginTop: 8 },
  sub: { fontSize: 14, color: "#64748b" },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AppProvider>
                <PinProvider>
                  <RootLayoutContent />
                </PinProvider>
              </AppProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
