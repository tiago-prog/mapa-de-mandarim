import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

const STEP_GLYPHS = {
  objective: "◎",
  context: "对",
  vocabulary: "字",
  grammar: "文",
  practice: "练",
  application: "用",
  review: "✓",
} as const;

const STEP_LABELS = {
  objective: "Objetivo",
  context: "Contexto",
  vocabulary: "Vocabulário",
  grammar: "Gramática",
  practice: "Prática",
  application: "Aplicação",
  review: "Revisão",
} as const;

export default function NodeDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nodeId = Array.isArray(id) ? id[0] : id;
  const nodeQuery = trpc.learningMap.getNode.useQuery({ nodeId: nodeId ?? "" }, { enabled: Boolean(nodeId) });

  if (nodeQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Carregando plano da etapa...</Text>
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

  const { node, steps } = nodeQuery.data;
  const firstStep = steps[0];
  const isCompleted = node.status === "completed";

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="gap-6">
          <View className="flex-row items-center gap-3">
            <AppButton label="‹" variant="quiet" onPress={() => router.back()} accessibilityLabel="Voltar" />
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-widest text-primary">NÓ DE APRENDIZAGEM</Text>
              <Text className="mt-1 text-2xl font-bold text-foreground">{node.title}</Text>
            </View>
          </View>

          <AppCard className="gap-5" tone="sand">
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-widest text-primary">OBJETIVO COMUNICATIVO</Text>
                <Text className="mt-2 text-xl font-bold leading-7 text-foreground">{node.objective}</Text>
              </View>
              <Text className="text-3xl font-bold text-primary">{node.progressPercent}%</Text>
            </View>
            <Text className="text-sm leading-5 text-muted">{node.description}</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted">Domínio desta etapa</Text>
                <Text className="text-xs font-semibold text-primary">{node.completedActivityCount}/{node.activityCount} práticas</Text>
              </View>
              <ProgressBar value={node.progressPercent} />
            </View>
          </AppCard>

          <View className="gap-3">
            <View className="flex-row items-end justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-foreground">Plano de ensino</Text>
                <Text className="mt-1 text-sm leading-5 text-muted">Aprenda a ideia, observe o uso e só depois recupere a resposta.</Text>
              </View>
              <Text className="text-sm font-semibold text-primary">{steps.length} etapas</Text>
            </View>

            {steps.map((step, index) => {
              const isPractice = step.kind === "practice" || step.kind === "application";
              return (
                <Pressable
                  key={step.id}
                  onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: node.id, stepId: step.id } })}
                  style={({ pressed }) => [styles.stepPressable, { opacity: pressed ? 0.72 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Etapa ${index + 1}: ${step.title}`}
                >
                  <AppCard className="flex-row items-center gap-3" tone={index === 0 ? "ink" : "paper"}>
                    <View className={`h-11 w-11 items-center justify-center rounded-2xl ${index === 0 ? "bg-warning" : isPractice ? "bg-primary/10" : "bg-surface"}`}>
                      <Text className={`text-xl font-bold ${index === 0 ? "text-foreground" : "text-primary"}`}>{STEP_GLYPHS[step.kind]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-xs font-semibold uppercase tracking-widest ${index === 0 ? "text-warning" : "text-primary"}`}>{STEP_LABELS[step.kind]} · {index + 1}/{steps.length}</Text>
                      <Text className={`mt-1 text-base font-bold ${index === 0 ? "text-background" : "text-foreground"}`}>{step.title}</Text>
                      <Text className={`mt-1 text-sm leading-5 ${index === 0 ? "text-surface" : "text-muted"}`}>{step.description}</Text>
                    </View>
                    <Text className={`text-xl ${index === 0 ? "text-warning" : "text-muted"}`}>›</Text>
                  </AppCard>
                </Pressable>
              );
            })}
          </View>

          <AppCard className="gap-2" tone="ink">
            <Text className="text-xs font-semibold uppercase tracking-widest text-warning">COMO VOCÊ VAI SABER</Text>
            <Text className="text-base font-semibold leading-6 text-background">{isCompleted ? "Você já completou esta etapa. Revisar ajuda a manter o conhecimento disponível." : "Você termina quando consegue reconhecer, construir e aplicar a estrutura sem depender da tradução."}</Text>
          </AppCard>

          <AppButton label={isCompleted ? "Revisar desde o começo" : "Começar plano de ensino"} onPress={() => firstStep ? router.push({ pathname: "/lesson/[id]", params: { id: node.id, stepId: firstStep.id } }) : undefined} disabled={!firstStep} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepPressable: {
    width: "100%",
  },
});
