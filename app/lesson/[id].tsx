import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 gap-6">
        <View className="flex-row items-center justify-between">
          <AppButton label="‹" variant="quiet" onPress={() => router.back()} accessibilityLabel="Voltar" />
          <Text className="text-xs font-semibold uppercase tracking-widest text-muted">ETAPA 1 DE 3</Text>
          <View className="w-12" />
        </View>

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Conecte a palavra</Text>
          <Text className="text-base leading-6 text-muted">Observe o hanzi, ouça o som e relacione com o significado.</Text>
        </View>

        <AppCard className="items-center gap-3 py-10" tone="sand">
          <Text className="text-7xl font-bold text-foreground">我叫</Text>
          <Text className="text-lg text-primary">wǒ jiào</Text>
          <Text className="text-base text-muted">eu me chamo</Text>
          <AppButton label="Ouvir pronúncia" variant="secondary" onPress={() => undefined} />
        </AppCard>

        <View className="mt-auto gap-3">
          <AppButton label="Continuar" onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: id ?? "intro", step: "2" } })} />
          <Text className="text-center text-xs text-muted">Você poderá rever esta palavra depois nos flashcards.</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
