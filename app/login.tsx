import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";

export default function LoginScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await startOAuthLogin();
      // On web, the browser navigates to Google. On native, OAuth returns through the deep link callback.
      if (__DEV__) console.log("[Auth] Google login started");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível iniciar o login com Google.");
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
      <View className="w-full max-w-md gap-6">
        <View className="items-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Text className="text-4xl font-bold text-background">生</Text>
          </View>
          <Text className="text-center text-3xl font-bold text-foreground">Mapa de Mandarim</Text>
          <Text className="text-center text-base leading-6 text-muted">Aprenda mandarim passo a passo, com contexto, prática e revisão.</Text>
        </View>
        <AppCard className="gap-5 p-6">
          <View className="gap-2">
            <Text className="text-xl font-bold text-foreground">Entrar na sua conta</Text>
            <Text className="text-sm leading-5 text-muted">Use a sua conta Google para guardar o progresso, o vocabulário e as revisões.</Text>
          </View>
          <AppButton label="Continuar com Google" onPress={handleGoogleLogin} loading={loading} accessibilityLabel="Entrar com Google" />
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text className="text-center text-sm leading-5 text-error">{error}</Text> : null}
        </AppCard>
        <Text className="text-center text-xs leading-5 text-muted">A sua sessão é protegida e o Mapa de Mandarim não guarda a sua palavra-passe Google.</Text>
      </View>
    </ScreenContainer>
  );
}
