import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AudioButton } from "@/components/ui/audio-button";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

function createClientEventId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function formatDueAt(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export default function ReviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const utils = trpc.useUtils();
  const [reviewedCardIds, setReviewedCardIds] = useState<string[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  const dueQuery = trpc.review.getDue.useQuery({ limit: 20 });
  const ratingMutation = trpc.review.submitRating.useMutation({
    onSuccess: (result) => {
      setReviewedCardIds((current) => [...current, result.card.id]);
      setIsRevealed(false);
      void utils.review.getDue.invalidate();
      void utils.today.get.invalidate();
    },
  });

  const pendingCards = useMemo(
    () => (dueQuery.data ?? []).filter((card) => !reviewedCardIds.includes(card.id)),
    [dueQuery.data, reviewedCardIds],
  );
  const currentCard = pendingCards[0] ?? null;
  const completedCount = reviewedCardIds.length;
  const queueCount = dueQuery.data?.length ?? 0;
  const sessionTotal = Math.max(queueCount + completedCount, 1);
  const isSessionComplete = completedCount > 0 && !currentCard && pendingCards.length === 0;

  const submitRating = (rating: "forgot" | "hard" | "easy") => {
    if (!currentCard || !isRevealed || ratingMutation.isPending) return;
    ratingMutation.mutate({ cardId: currentCard.id, rating, clientEventId: createClientEventId() });
  };

  const restartSession = () => {
    setReviewedCardIds([]);
    setIsRevealed(false);
    ratingMutation.reset();
    void dueQuery.refetch();
  };

  if (dueQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Preparando suas revisões...</Text>
      </ScreenContainer>
    );
  }

  if (dueQuery.error) {
    return (
      <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
        <AppCard className="w-full max-w-md items-center gap-4 p-6">
          <Text className="text-center text-lg font-bold text-foreground">Revisão indisponível</Text>
          <Text className="text-center text-sm leading-5 text-muted">{dueQuery.error.message}</Text>
          <AppButton label="Tentar novamente" onPress={() => void dueQuery.refetch()} />
        </AppCard>
      </ScreenContainer>
    );
  }

  if (!currentCard && !isSessionComplete) {
    return (
      <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View className="gap-5">
            <View>
              <Text className="text-sm font-medium text-primary">REVISÃO ESPAÇADA</Text>
              <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">Tudo em dia.</Text>
              <Text className="mt-2 text-base leading-6 text-muted">Nenhuma palavra precisa de atenção agora. Continue aprendendo para formar sua próxima fila.</Text>
            </View>
            <AppCard className="items-center gap-4 p-6" tone="sand">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Text className="text-3xl font-bold text-background">复</Text>
              </View>
              <Text className="text-center text-xl font-bold text-foreground">Sua memória agradece</Text>
              <Text className="text-center text-sm leading-5 text-muted">As palavras praticadas nas lições entram automaticamente na agenda quando estiverem prontas para revisão.</Text>
              <AppButton label="Voltar ao mapa" onPress={() => router.push("/(tabs)/map")} />
            </AppCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (isSessionComplete) {
    return (
      <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View className="gap-5">
            <View>
              <Text className="text-sm font-medium text-primary">SESSÃO CONCLUÍDA</Text>
              <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">Boa revisão.</Text>
              <Text className="mt-2 text-base leading-6 text-muted">Você passou por todas as palavras que estavam esperando hoje.</Text>
            </View>
            <AppCard className="items-center gap-4 p-6" tone="ink">
              <Text className="text-5xl font-bold text-warning">{completedCount}</Text>
              <Text className="text-center text-lg font-bold text-background">palavras revisitadas</Text>
              <Text className="text-center text-sm leading-5 text-surface">Cada resposta atualizou o intervalo da palavra e registrou um novo evento no seu histórico.</Text>
              <AppButton label="Atualizar fila" variant="secondary" onPress={restartSession} />
            </AppCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View className="gap-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-medium text-primary">REVISÃO ESPAÇADA</Text>
              <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">Reforce o que aprendeu.</Text>
              <Text className="mt-2 text-base leading-6 text-muted">Uma palavra por vez, no intervalo certo.</Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-primary">{completedCount + 1}/{sessionTotal}</Text>
              <Text className="mt-1 text-xs text-muted">na fila</Text>
            </View>
          </View>

          <AppCard className="gap-5" tone="sand">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-widest text-primary">CARTÃO DE HOJE</Text>
              <Text className="text-xs font-medium text-muted">Caixa {currentCard.box}/5</Text>
            </View>

            <View className="items-center gap-3 py-3">
              <Text className="text-6xl font-bold text-foreground">{currentCard.hanzi}</Text>
              <AudioButton text={currentCard.hanzi} audioUrl={currentCard.audio?.url} textHash={currentCard.audio?.textHash} label="Ouvir pronúncia" />
              <Text className="text-center text-sm leading-5 text-muted">Leia o hanzi e tente lembrar o significado antes de revelar.</Text>
            </View>

            {!isRevealed ? (
              <AppButton label="Revelar resposta" variant="secondary" onPress={() => setIsRevealed(true)} />
            ) : (
              <View className="gap-4 border-t border-border pt-4">
                <View className="gap-1">
                  <Text className="text-xs font-semibold uppercase tracking-widest text-primary">RESPOSTA</Text>
                  <Text className="text-2xl font-bold text-foreground">{currentCard.pinyin}</Text>
                  <Text className="text-base leading-6 text-muted">{currentCard.meaningPtBr}</Text>
                </View>
                <View className="gap-2 rounded-2xl bg-background/60 p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-xl font-bold text-foreground">{currentCard.exampleHanzi}</Text>
                    <AudioButton text={currentCard.exampleHanzi} compact label="Ouvir exemplo" />
                  </View>
                  <Text className="text-sm leading-5 text-muted">{currentCard.examplePtBr}</Text>
                </View>
                <Text className="text-center text-sm font-medium text-foreground">Como foi?</Text>
                <View className="flex-row gap-2">
                  <AppButton label="Esqueci" variant="secondary" style={styles.ratingButton} loading={ratingMutation.isPending && ratingMutation.variables?.rating === "forgot"} onPress={() => submitRating("forgot")} accessibilityLabel="Avaliar como esqueci" />
                  <AppButton label="Difícil" variant="secondary" style={styles.ratingButton} loading={ratingMutation.isPending && ratingMutation.variables?.rating === "hard"} onPress={() => submitRating("hard")} accessibilityLabel="Avaliar como difícil" />
                  <AppButton label="Fácil" style={styles.ratingButton} loading={ratingMutation.isPending && ratingMutation.variables?.rating === "easy"} onPress={() => submitRating("easy")} accessibilityLabel="Avaliar como fácil" />
                </View>
                {ratingMutation.error ? <Text className="text-center text-sm text-danger">{ratingMutation.error.message}</Text> : null}
              </View>
            )}
          </AppCard>

          <AppCard className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-foreground">Ritmo de hoje</Text>
              <Text className="text-sm text-muted">Próximo vencimento: {formatDueAt(currentCard.dueAt)}</Text>
            </View>
                          <View className="h-2 overflow-hidden rounded-full bg-border">
              <View className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, ((completedCount + 1) / sessionTotal) * 100)}%` }} />

            </View>
            <Text className="text-sm leading-5 text-muted">A resposta não altera o conteúdo da lição: ela apenas ajusta a próxima revisão desta palavra.</Text>
          </AppCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  ratingButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
