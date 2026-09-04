import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Text } from "react-native";
import { useEffect } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

export default function AdminLayout() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/(tabs)");
  }, [loading, router, user]);

  if (loading || !user || user.role !== "admin") {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /><Text className="mt-3 text-sm text-muted">A verificar acesso administrativo...</Text></ScreenContainer>;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
