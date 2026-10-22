import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";

function Guard() {
  const { ready, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const enLogin = segments[0] === "login";
    if (!user && !enLogin) {
      router.replace("/login");
    } else if (user && enLogin) {
      router.replace("/");
    }
  }, [ready, user, segments, router]);

  return <Stack screenOptions={{ headerTitleAlign: "center" }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Guard />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
