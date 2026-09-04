import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { AudioButton } from "@/components/ui/audio-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { collectAudioUrls, preloadAudioFiles } from "@/lib/audio-cache";

function createClientEventId() {
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

type LessonSubmission = {
  isCorrect: boolean;
  xpAwarded: number;
  nodeId: string;
  selectedOptionId: string;
  feedback: string;
  correctOptionId: string | null;
  correctOrder: string[];
  correctAnswer: string | null;
};

const KIND_LABELS = {
  objective: "Objetivo",
  context: "Contexto",
  vocabulary: "Vocabulário",
  grammar: "Gramática",
  practice: "Prática guiada",
  application: "Aplicação",
  review: "Revisão",
} as const;

export default function LessonScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useColors();
  const { user, logout } = useAuth();
  const { id, stepId } = useLocalSearchParams<{ id: string; stepId?: string }>();
  const nodeId = Array.isArray(id) ? id[0] : id;
  const activeStepId = Array.isArray(stepId) ? stepId[0] : stepId;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [result, setResult] = useState<LessonSubmission | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const utils = trpc.useUtils();
  const lessonQuery = trpc.lesson.get.useQuery(
    { nodeId: nodeId ?? "", stepId: activeStepId },
    { enabled: Boolean(nodeId) },
  );
  const submitMutation = trpc.lesson.submitActivity.useMutation({
    onSuccess: (submission) => {
      setResult(submission);
      void utils.today.get.invalidate();
      void utils.learningMap.get.invalidate();
      void utils.learningMap.getNode.invalidate({ nodeId: submission.nodeId });
      void utils.lesson.get.invalidate({ nodeId: submission.nodeId, stepId: activeStepId });
    },
  });

  useFocusEffect(useCallback(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  }, [navigation]));

  useEffect(() => {
    const lessonPayload = lessonQuery.data;
    if (!lessonPayload) return;
    const audioItems = collectAudioUrls(lessonPayload);
    if (!audioItems.length) return;
    void preloadAudioFiles(audioItems).then(() => undefined);
  }, [lessonQuery.data]);

  if (lessonQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Preparando a etapa...</Text>
      </ScreenContainer>
    );
  }

  if (lessonQuery.error || !lessonQuery.data) {
    return (
      <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
        <AppCard className="w-full max-w-md items-center gap-4 p-6">
          <Text className="text-center text-lg font-bold text-foreground">Etapa indisponível</Text>
          <Text className="text-center text-sm leading-5 text-muted">{lessonQuery.error?.message ?? "Volte ao plano do nó e tente novamente."}</Text>
          <AppButton label="Voltar ao plano" onPress={() => router.replace({ pathname: "/node/[id]", params: { id: nodeId } })} />
        </AppCard>
      </ScreenContainer>
    );
  }

  const lesson = lessonQuery.data;
  const activity = lesson.activity;
  const content = lesson.step.content;
  const isResultVisible = Boolean(result);
  const isCorrect = result?.isCorrect ?? false;
  const handleLogout = async () => { await logout(); router.replace("/login"); };

  if (result?.isCorrect && !lesson.nextStepId) {
    return (
      <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="mx-auto w-full max-w-xl flex-1">
          <AppHeader compact user={user} onLogout={handleLogout} />
          <View className="flex-1 items-center justify-center gap-5">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-success"><Text className="text-4xl font-bold text-background">✓</Text></View>
          <Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">ETAPA CONCLUÍDA</Text>
          <Text className="text-center text-3xl font-bold text-foreground">Muito bem.</Text>
          <Text className="text-center text-base leading-6 text-muted">Você reconheceu a estrutura e está pronto para aplicá-la.</Text>
          <AppCard className="w-full gap-1 p-5"><Text className="mb-3 text-center text-4xl font-bold text-warning">+{result.xpAwarded} <Text className="text-base text-muted">XP</Text></Text><View className="flex-row justify-between border-t border-border py-3"><Text className="text-base text-muted">Prática concluída</Text><Text className="font-bold text-foreground">1 de 1</Text></View><View className="flex-row justify-between border-t border-border py-3"><Text className="text-base text-muted">Próximo destino</Text><Text className="font-bold text-foreground">Plano do nó</Text></View></AppCard>
          <View className="w-full gap-3"><AppButton label="Voltar ao plano do nó" onPress={() => router.replace({ pathname: "/node/[id]", params: { id: lesson.node.id } })} /><AppButton label="Ir para Revisar" variant="quiet" onPress={() => router.replace("/(tabs)/review")} /></View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const resetAttempt = () => {
    setSelectedOptionId(null);
    setSelectedOrder([]);
    setTextAnswer("");
    setResult(null);
    setShowHint(false);
    submitMutation.reset();
  };

  const goToStep = (nextStepId: string | null) => {
    resetAttempt();
    if (!nextStepId) {
      router.replace({ pathname: "/node/[id]", params: { id: lesson.node.id } });
      return;
    }
    router.replace({ pathname: "/lesson/[id]", params: { id: lesson.node.id, stepId: nextStepId } });
  };

  const continueAfterResult = async () => {
    resetAttempt();
    if (!lesson.nextStepId) {
      router.replace("/(tabs)/map");
      return;
    }
    await lessonQuery.refetch();
  };

  const submitActivity = async () => {
    if (!activity || submitMutation.isPending) return;
    if (activity.type === "word_order" && selectedOrder.length === 0) return;
    if (activity.type === "fill_blank" && !textAnswer.trim()) return;
    if (activity.type !== "word_order" && activity.type !== "fill_blank" && !selectedOptionId) return;
    await submitMutation.mutateAsync({
      nodeId: lesson.node.id,
      stepId: lesson.step.id,
      activityId: activity.id,
      selectedOptionId: activity.type === "word_order" ? undefined : activity.type === "fill_blank" ? textAnswer : selectedOptionId ?? undefined,
      selectedOrder: activity.type === "word_order" ? selectedOrder : undefined,
      clientEventId: createClientEventId(),
    });
  };

  const addToken = (token: string) => {
    if (isResultVisible || selectedOrder.includes(token)) return;
    setSelectedOrder((current) => [...current, token]);
  };

  const removeToken = (token: string) => {
    if (isResultVisible) return;
    setSelectedOrder((current) => current.filter((item) => item !== token));
  };

  const renderStepContent = () => {
    if (content.kind === "objective") {
      return (
        <AppCard className="gap-4" tone="sand">
          <Text className="text-xs font-semibold uppercase tracking-widest text-primary">OBJETIVO COMUNICATIVO</Text>
          <Text className="text-2xl font-bold leading-8 text-foreground">{content.objective}</Text>
          <View className="gap-3 border-t border-border pt-4">
            <Text className="text-sm font-semibold text-foreground">Você vai praticar:</Text>
            {content.successCriteria.map((criterion) => (
              <View key={criterion} className="flex-row items-center gap-3">
                <Text className="text-lg font-bold text-primary">✓</Text>
                <Text className="flex-1 text-sm leading-5 text-muted">{criterion}</Text>
              </View>
            ))}
          </View>
          <Text className="text-xs text-muted">Tempo estimado: {content.estimatedMinutes} minutos</Text>
        </AppCard>
      );
    }

    if (content.kind === "context") {
      return (
        <View className="gap-3">
          <AppCard className="gap-2" tone="ink">
            <Text className="text-xs font-semibold uppercase tracking-widest text-warning">SITUAÇÃO</Text>
            <Text className="text-sm leading-5 text-surface">{content.instruction}</Text>
          </AppCard>
          <AppCard className="gap-4">
            {content.lines.map((line, index) => (
              <View key={`${line.speaker}-${index}`} className="gap-1">
                <Text className="text-xs font-semibold uppercase tracking-widest text-primary">{line.speaker}</Text>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-2xl font-bold text-foreground">{line.hanzi}</Text>
                  <AudioButton text={line.hanzi} audioUrl={line.audio?.url} textHash={line.audio?.textHash} compact />
                </View>
                <Text className="text-sm text-primary">{line.pinyin}</Text>
                {showTranslations ? <Text className="text-sm leading-5 text-muted">{line.translation}</Text> : null}
              </View>
            ))}
            <AppButton label={showTranslations ? "Ocultar traduções" : "Revelar traduções"} variant="secondary" onPress={() => setShowTranslations((current) => !current)} />
          </AppCard>
        </View>
      );
    }

    if (content.kind === "vocabulary") {
      return (
        <View className="gap-3">
          <AppCard className="gap-2" tone="sand">
            <Text className="text-sm leading-5 text-muted">{content.instruction}</Text>
          </AppCard>
          {lesson.vocabulary.map((entry) => (
            <AppCard key={entry.id} className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-3xl font-bold text-foreground">{entry.hanzi}</Text>
                  <Text className="mt-1 text-base text-primary">{entry.pinyin}</Text>
                </View>
                <View className="items-end gap-2">
                  <AudioButton text={entry.hanzi} audioUrl={entry.audio?.url} textHash={entry.audio?.textHash} compact />
                  <Text className="text-right text-sm font-semibold text-muted">{entry.meaningPtBr}</Text>
                </View>
              </View>
              <View className="border-t border-border pt-2">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-foreground">{entry.exampleHanzi}</Text>
                  <AudioButton text={entry.exampleHanzi} compact />
                </View>
                <Text className="mt-1 text-sm leading-5 text-muted">{entry.examplePtBr}</Text>
              </View>
            </AppCard>
          ))}
        </View>
      );
    }

    if (content.kind === "grammar") {
      return (
        <View className="gap-3">
          <AppCard className="gap-2" tone="sand">
            <Text className="text-sm leading-5 text-muted">{content.instruction}</Text>
          </AppCard>
          {content.patterns.map((pattern) => (
            <AppCard key={pattern.pattern} className="gap-3">
              <Text className="text-xl font-bold text-primary">{pattern.pattern}</Text>
              <Text className="text-sm leading-5 text-muted">{pattern.explanation}</Text>
              <View className="border-t border-border pt-3">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-lg font-semibold text-foreground">{pattern.exampleHanzi}</Text>
                  <AudioButton text={pattern.exampleHanzi} audioUrl={pattern.audio?.url} textHash={pattern.audio?.textHash} compact />
                </View>
                <Text className="mt-1 text-sm text-muted">{pattern.examplePtBr}</Text>
              </View>
            </AppCard>
          ))}
        </View>
      );
    }

    if (content.kind === "review") {
      return (
        <AppCard className="gap-4" tone="sand">
          <Text className="text-xs font-semibold uppercase tracking-widest text-primary">LEVE COM VOCÊ</Text>
          {content.takeaways.map((takeaway) => (
            <View key={takeaway} className="flex-row items-start gap-3">
              <Text className="text-lg font-bold text-primary">✓</Text>
              <Text className="flex-1 text-base leading-6 text-foreground">{takeaway}</Text>
            </View>
          ))}
          <View className="border-t border-border pt-3">
            <Text className="text-xs font-semibold uppercase tracking-widest text-primary">PRÓXIMO PASSO</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">{content.nextStep}</Text>
          </View>
        </AppCard>
      );
    }

    return null;
  };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 22 }}>
        <View className="mx-auto w-full max-w-3xl flex-1 gap-5">
          <AppHeader compact user={user} onLogout={handleLogout} />
          <View className="flex-row items-center justify-between">
            <AppButton label="‹" variant="quiet" onPress={() => router.back()} accessibilityLabel="Voltar" />
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted">{KIND_LABELS[lesson.step.kind]} · {lesson.step.orderIndex}/{lesson.stepCount}</Text>
            <View className="w-12" />
          </View>

          <ProgressBar value={(lesson.step.orderIndex / lesson.stepCount) * 100} />

          <View className="gap-2">
            <Text className="text-3xl font-bold leading-9 text-foreground">{lesson.step.title}</Text>
            <Text className="text-base leading-6 text-muted">{lesson.step.description}</Text>
          </View>

          {renderStepContent()}

          {activity ? (
            <View className="gap-4">
              <AppCard className="gap-4" tone="ink">
                <Text className="text-xs font-semibold uppercase tracking-widest text-warning">PRÁTICA</Text>
                <Text className="text-xl font-bold text-background">{activity.title}</Text>
                <Text className="text-sm leading-5 text-surface">{activity.instruction}</Text>
                {activity.hanzi ? (
                  <View className="items-center gap-2">
                    <Text className="text-center text-5xl font-bold text-background">{activity.hanzi}</Text>
                    <AudioButton text={activity.hanzi} audioUrl={activity.audio?.url} textHash={activity.audio?.textHash} label="Ouvir pronúncia" />
                  </View>
                ) : null}
                {activity.pinyin ? <Text className="text-center text-base text-warning">{activity.pinyin}</Text> : null}
                {isResultVisible && activity.meaning ? <Text className="text-center text-sm text-warning">Significado: {activity.meaning}</Text> : null}
              </AppCard>

              {activity.type === "word_order" ? (
                <View className="gap-3">
                  <AppCard className="min-h-[62px] flex-row flex-wrap items-center gap-2">
                    {selectedOrder.length ? selectedOrder.map((token) => (
                      <Pressable key={token} onPress={() => removeToken(token)} style={({ pressed }) => [styles.token, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]} accessibilityRole="button" accessibilityLabel={`Remover ${token}`}>
                        <Text style={{ color: colors.background, fontWeight: "700" }}>{token}</Text>
                      </Pressable>
                    )) : <Text className="text-sm text-muted">Toque nas palavras abaixo para montar a frase.</Text>}
                  </AppCard>
                  <View className="flex-row flex-wrap gap-2">
                    {activity.tokens.map((token) => {
                      const used = selectedOrder.includes(token);
                      return (
                        <Pressable key={token} disabled={used || isResultVisible} onPress={() => addToken(token)} style={({ pressed }) => [styles.token, { borderColor: colors.border, backgroundColor: used ? colors.border : colors.surface, opacity: pressed ? 0.72 : used ? 0.45 : 1 }]}>
                          <Text style={{ color: colors.foreground, fontWeight: "600" }}>{token}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : activity.type === "fill_blank" ? (
                <View className="gap-3">
                  <TextInput
                    value={textAnswer}
                    onChangeText={setTextAnswer}
                    editable={!isResultVisible}
                    autoCorrect={false}
                    autoCapitalize="none"
                    placeholder="Digite a palavra que falta"
                    placeholderTextColor={colors.muted}
                    accessibilityLabel="Resposta da lacuna"
                    style={[styles.textAnswer, { color: colors.foreground, borderColor: isResultVisible ? colors.border : colors.primary, backgroundColor: colors.surface }]}
                  />
                  <Text className="text-sm leading-5 text-muted">Você pode incluir ou omitir a pontuação final.</Text>
                  {isResultVisible && !isCorrect && result?.correctAnswer ? <Text className="text-sm font-semibold text-primary">Resposta esperada: {result.correctAnswer}</Text> : null}
                </View>
              ) : (
                <View className="gap-3">
                  {activity.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrectOption = isResultVisible && option.id === result?.correctOptionId;
                    const isWrongSelection = isResultVisible && isSelected && !isCorrect;
                    const optionStateStyle = isCorrectOption
                      ? { borderColor: colors.success, backgroundColor: `${colors.success}18` }
                      : isWrongSelection
                        ? { borderColor: colors.error, backgroundColor: `${colors.error}18` }
                        : isSelected
                          ? { borderColor: colors.primary, backgroundColor: `${colors.primary}18` }
                          : { borderColor: colors.border, backgroundColor: colors.surface };
                    return (
                      <Pressable key={option.id} disabled={isResultVisible} onPress={() => setSelectedOptionId(option.id)} style={({ pressed }) => [styles.option, optionStateStyle, { opacity: pressed ? 0.72 : 1 }]} accessibilityRole="radio" accessibilityState={{ checked: isSelected, disabled: isResultVisible }}>
                        <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : "transparent" }]}>
                          <Text style={[styles.radioLabel, { color: isSelected ? colors.background : colors.muted }]}>{isSelected ? "✓" : ""}</Text>
                        </View>
                        <Text className="flex-1 text-base font-semibold text-foreground">{option.label}</Text>
                        {isCorrectOption ? <Text className="text-sm font-bold text-success">Correta</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View className="gap-2">
                <AppButton label={showHint ? "Ocultar dica" : "Precisa de uma dica?"} variant="quiet" onPress={() => setShowHint((current) => !current)} />
                {showHint ? <Text className="px-2 text-sm leading-5 text-muted">{activity.hint}</Text> : null}
              </View>

              {submitMutation.error ? <Text className="text-sm leading-5 text-error">{submitMutation.error.message}</Text> : null}
              {result ? (
                <AppCard className="gap-2" tone={isCorrect ? "sand" : "paper"}>
                  <Text className={`text-lg font-bold ${isCorrect ? "text-success" : "text-error"}`}>{isCorrect ? "Muito bem!" : "Vamos ajustar."}</Text>
                  <Text className="text-sm leading-5 text-muted">{result.feedback}</Text>
                  <Text className="text-xs font-semibold text-primary">{isCorrect ? `+${result.xpAwarded} XP nesta prática` : "A tentativa foi registrada; tente novamente."}</Text>
                </AppCard>
              ) : null}
            </View>
          ) : null}

          <View className="mt-auto gap-3">
            {activity ? (
              result ? (
                isCorrect ? (
                  <AppButton label="Continuar a lição" onPress={() => void continueAfterResult()} />
                ) : (
                  <AppButton label="Tentar novamente" onPress={resetAttempt} />
                )
              ) : (
                <AppButton label="Responder" disabled={activity.type === "word_order" ? selectedOrder.length === 0 : activity.type === "fill_blank" ? !textAnswer.trim() : !selectedOptionId} loading={submitMutation.isPending} onPress={() => void submitActivity()} />
              )
            ) : (
              <AppButton label={lesson.nextStepId ? "Próxima etapa" : "Voltar ao nó"} onPress={() => goToStep(lesson.nextStepId)} />
            )}
            <Text className="text-center text-xs text-muted">A tradução é um apoio. Tente primeiro recuperar a intenção da frase.</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  textAnswer: {
    minHeight: 58,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
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
  token: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
});
