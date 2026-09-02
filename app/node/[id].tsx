import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function NodeDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nodeId = Array.isArray(id) ? id[0] : id;
  const nodeQuery = trpc.learningMap.getNode.useQuery(
    { nodeId: nodeId ?? "" },
    { enabled: Boolean(nodeId) },
  );

  if (nodeQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Carregando nó...</Text>
      </ScreenContainer>
    );
  }

  if (nodeQuery.error || !nodeQuery.data) {
    return (
      <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
        <AppCard className="w-full max-w-md items-center gap-4 p-6">
          <Text className="text-center text-lg font-bold text-foreground">Nó não encontrado</Text>
          <Text className="text-center text-sm leading-5 text-muted">{nodeQuery.error?.message ?? "Volte ao mapa e escolha outro caminho."}</Text>
          <AppButton label="Voltar ao mapa" onPress={() => router.replace("/(tabs)/map")} />
        </AppCard>
      </ScreenContainer>
    );
  }

  const { node, activities } = nodeQuery.data;
  const activity = activities[0];
  const isCompleted = node.status === "completed";

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}>
        <View className="flex-1 gap-6">
          <View className="flex-row items-center gap-3">
            <AppButton label="‹" variant="quiet" onPress={() => router.back()} accessibilityLabel="Voltar" />
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-widest text-primary">NÓ DE APRENDIZAGEM</Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">{node.title}</Text>
            </View>
          </View>

          <AppCard className="gap-5" tone="sand">
            <Text className="text-5xl font-bold text-foreground">{activity?.hanzi ?? "学"}</Text>
            <Text className="text-base text-muted">{activity?.pinyin ?? "xué"} · {activity?.meaning ?? node.objective}</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted">Progresso do nó</Text>
                <Text className="text-xs font-semibold text-primary">{node.progressPercent}%</Text>
              </View>
              <ProgressBar value={node.progressPercent} />
            </View>
            <Text className="text-sm leading-5 text-muted">{node.objective} {node.description}</Text>
          </AppCard>

          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">Nesta etapa</Text>
            <View className="gap-3">
              <AppCard className="flex-row items-center gap-3">
                <Text className="text-2xl text-primary">听</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Ouvir e reconhecer</Text>
                  <Text className="mt-1 text-sm text-muted">Relacione hanzi, pinyin e significado.</Text>
                </View>
              </AppCard>
              <AppCard className="flex-row items-center gap-3">
                <Text className="text-2xl text-primary">说</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Usar em contexto</Text>
                  <Text className="mt-1 text-sm text-muted">Pratique uma frase curta de apresentação.</Text>
                </View>
              </AppCard>
            </View>
          </View>

          <View className="mt-auto gap-3">
            <AppButton
              label={isCompleted ? "Revisar etapa" : "Começar etapa"}
              disabled={!activity}
              onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: node.id } })}
            />
            <Text className="text-center text-xs text-muted">A atividade atual leva cerca de 1 minuto.</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
