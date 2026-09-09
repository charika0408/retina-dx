import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox, StatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { ScreeningProvider } from "@/src/context/ScreeningContext";

// Disable logbox errors in preview
LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E17" />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ScreeningProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#0A0E17" },
                animation: Platform.OS === "ios" ? "default" : "fade",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="upload" />
              <Stack.Screen name="analysis" />
              <Stack.Screen name="results" />
            </Stack>
          </ScreeningProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
