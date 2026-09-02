import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function NodeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 gap-6">
        <View className="flex-row items-center gap-3">
          <AppButton label="‹" variant="quiet" onPress={() => router.back()} accessibilityLabel="Voltar" />
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-widest text-primary">NÓ DE APRENDIZAGEM</Text>
            <Text className="mt-1 text-2xl font-bold text-foreground">Dizer quem você é</Text>
          </View>
        </View>

        <AppCard className="gap-5" tone="sand">
          <Text className="text-5xl font-bold text-foreground">我叫</Text>
          <Text className="text-base text-muted">wǒ jiào · eu me chamo</Text>
          <ProgressBar value={60} />
          <Text className="text-sm leading-5 text-muted">Você vai praticar como dizer seu nome e perguntar o nome de alguém.</Text>
        </AppCard>

        <View className="gap-3">
          <Text className="text-xl font-bold text-foreground">Nesta etapa</Text>
          <View className="gap-3">
            <AppCard className="flex-row items-center gap-3">
              <Text className="text-2xl text-primary">听</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Ouvir e reconhecer</Text>
                <Text className="mt-1 text-sm text-muted">Relacione som, hanzi e significado.</Text>
              </View>
            </AppCard>
            <AppCard className="flex-row items-center gap-3">
              <Text className="text-2xl text-primary">说</Text>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Usar em contexto</Text>
                <Text className="mt-1 text-sm text-muted">Monte uma frase curta de apresentação.</Text>
              </View>
            </AppCard>
          </View>
        </View>

        <View className="mt-auto gap-3">
          <AppButton label="Começar etapa" onPress={() => router.push(`/lesson/${id ?? "intro"}`)} />
          <Text className="text-center text-xs text-muted">A atividade leva cerca de 3 minutos.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
