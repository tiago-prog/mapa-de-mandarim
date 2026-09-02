import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

function createClientEventId() {
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

type LessonSubmission = {
  isCorrect: boolean;
  xpAwarded: number;
  nodeId: string;
};

export default function LessonScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nodeId = Array.isArray(id) ? id[0] : id;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<LessonSubmission | null>(null);
  const utils = trpc.useUtils();
  const lessonQuery = trpc.lesson.get.useQuery(
    { nodeId: nodeId ?? "" },
    { enabled: Boolean(nodeId) },
  );
  const submitMutation = trpc.lesson.submitActivity.useMutation({
    onSuccess: (submission) => {
      setResult(submission);
      void utils.today.get.invalidate();
      void utils.learningMap.get.invalidate();
      void utils.learningMap.getNode.invalidate({ nodeId: submission.nodeId });
    },
  });

  if (lessonQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Preparando sua atividade...</Text>
      </ScreenContainer>
    );
  }

  if (lessonQuery.error || !lessonQuery.data) {
    return (
      <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
        <AppCard className="w-full max-w-md items-center gap-4 p-6">
          <Text className="text-center text-lg font-bold text-foreground">Lição indisponível</Text>
          <Text className="text-center text-sm leading-5 text-muted">{lessonQuery.error?.message ?? "Volte ao mapa e escolha outro nó."}</Text>
          <AppButton label="Voltar ao mapa" onPress={() => router.replace("/(tabs)/map")} />
        </AppCard>
      </ScreenContainer>
    );
  }

  const { node, activity } = lessonQuery.data;
  if (!activity) return null;

  const isSubmitted = Boolean(result);
  const isCorrect = result?.isCorrect ?? false;

  const submitActivity = async () => {
    if (!selectedOptionId || submitMutation.isPending) return;
    await submitMutation.mutateAsync({
      nodeId: node.id,
      activityId: activity.id,
      selectedOptionId,
      clientEventId: createClientEventId(),
    });
  };

  const resetActivity = () => {
    setSelectedOptionId(null);
    setResult(null);
    submitMutation.reset();
  };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}>
        <View className="flex-1 gap-6">
          <View className="flex-row items-center justify-between">
            <AppButton label="‹" variant="quiet" onPress={() => router.back()} accessibilityLabel="Voltar" />
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted">ETAPA 1 DE 1</Text>
            <View className="w-12" />
          </View>

          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">{activity.prompt.replace("?", "")}</Text>
            <Text className="text-base leading-6 text-muted">Escolha a alternativa que corresponde ao significado.</Text>
          </View>

          <AppCard className="items-center gap-3 py-10" tone="sand">
            <Text className="text-7xl font-bold text-foreground">{activity.hanzi}</Text>
            <Text className="text-lg text-primary">{activity.pinyin}</Text>
            <Text className="text-base text-muted">{activity.meaning}</Text>
            <Text className="text-center text-xs leading-5 text-muted">Leia em voz alta para praticar a associação entre som e significado.</Text>
          </AppCard>

          <View className="gap-3">
            {activity.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectOption = isSubmitted && option.id === activity.correctOptionId;
              const isWrongSelection = isSubmitted && isSelected && !isCorrect;
              const optionStateStyle = isCorrectOption
                ? { borderColor: colors.success, backgroundColor: `${colors.success}18` }
                : isWrongSelection
                  ? { borderColor: colors.error, backgroundColor: `${colors.error}18` }
                  : isSelected
                    ? { borderColor: colors.primary, backgroundColor: `${colors.primary}18` }
                    : { borderColor: colors.border, backgroundColor: colors.surface };

              return (
                <Pressable
                  key={option.id}
                  disabled={isSubmitted}
                  onPress={() => setSelectedOptionId(option.id)}
                  style={({ pressed }) => [styles.option, optionStateStyle, { opacity: pressed ? 0.72 : 1 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled: isSubmitted }}
                >
                  <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : "transparent" }]}>
                    <Text style={[styles.radioLabel, { color: isSelected ? colors.background : colors.muted }]}>{isSelected ? "✓" : ""}</Text>
                  </View>
                  <Text className="flex-1 text-base font-semibold text-foreground">{option.label}</Text>
                  {isCorrectOption ? <Text className="text-sm font-bold text-success">Correta</Text> : null}
                </Pressable>
              );
            })}
          </View>

          {result ? (
            <AppCard className="gap-2" tone={isCorrect ? "sand" : "paper"}>
              <Text className={`text-lg font-bold ${isCorrect ? "text-success" : "text-error"}`}>
                {isCorrect ? "Muito bem!" : "Quase lá."}
              </Text>
              <Text className="text-sm leading-5 text-muted">
                {isCorrect
                  ? `Você concluiu o nó e ganhou ${result.xpAwarded} XP.`
                  : `Resposta registrada. A resposta correta é “${activity.options.find((option) => option.id === activity.correctOptionId)?.label}”.`}
              </Text>
            </AppCard>
          ) : null}

          <View className="mt-auto gap-3">
            {result ? (
              isCorrect ? (
                <AppButton label="Ver meu progresso" onPress={() => router.replace("/(tabs)/map")} />
              ) : (
                <AppButton label="Tentar novamente" onPress={resetActivity} />
              )
            ) : (
              <AppButton
                label={selectedOptionId ? "Responder" : "Escolha uma resposta"}
                disabled={!selectedOptionId}
                loading={submitMutation.isPending}
                onPress={() => void submitActivity()}
              />
            )}
            <Text className="text-center text-xs text-muted">Seu progresso é salvo ao responder.</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  radio: {
    width: 28,
    height: 28,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});
