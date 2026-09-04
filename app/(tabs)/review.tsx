import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";

import { RatingRow, type ReviewRating } from "@/components/learning/rating-row";
import { SessionSummary } from "@/components/learning/session-summary";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { AudioButton } from "@/components/ui/audio-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type ReviewCard = { id: string; hanzi: string; pinyin: string; meaningPtBr: string; exampleHanzi: string; examplePtBr: string; dueAt: Date | string; box: number; audio?: { url?: string | null; textHash?: string | null } };

function createClientEventId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function ReviewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [sessionCards, setSessionCards] = useState<ReviewCard[]>([]);
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>({});

  const dueQuery = trpc.review.getDue.useQuery({ limit: 20 });
  const ratingMutation = trpc.review.submitRating.useMutation({
    onSuccess: (result) => {
      setReviewedIds((current) => current.includes(result.card.id) ? current : [...current, result.card.id]);
      setRatings((current) => ({ ...current, [result.card.id]: ratingMutation.variables?.rating ?? "hard" }));
      setRevealed(false);
      void utils.review.getDue.invalidate();
      void utils.today.get.invalidate();
    },
  });

  useFocusEffect(useCallback(() => {
    const parent = navigation.getParent();
    if (started) parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  }, [navigation, started]));

  const availableCards = useMemo(() => sessionCards.length ? sessionCards : (dueQuery.data as ReviewCard[] ?? []), [dueQuery.data, sessionCards]);
  const pendingCards = useMemo(() => availableCards.filter((card) => !reviewedIds.includes(card.id)), [availableCards, reviewedIds]);
  const currentCard = pendingCards[0] ?? null;
  const completedCount = reviewedIds.length;
  const isSessionComplete = started && availableCards.length > 0 && !currentCard;
  const forgot = Object.values(ratings).filter((rating) => rating === "forgot").length;
  const hard = Object.values(ratings).filter((rating) => rating === "hard").length;
  const easy = Object.values(ratings).filter((rating) => rating === "easy").length;

  const startSession = () => { setSessionCards(dueQuery.data as ReviewCard[]); setStarted(true); setRevealed(false); ratingMutation.reset(); };
  const submitRating = (rating: ReviewRating) => {
    if (!currentCard || !revealed || ratingMutation.isPending) return;
    ratingMutation.mutate({ cardId: currentCard.id, rating, clientEventId: createClientEventId() });
  };
  const retryDifficult = () => {
    setSessionCards(sessionCards.filter((card) => ratings[card.id] !== "easy"));
    setReviewedIds([]);
    setRatings({});
    setRevealed(false);
    ratingMutation.reset();
    setStarted(true);
  };
  const handleLogout = async () => { await logout(); router.replace("/login"); };

  if (dueQuery.isLoading) return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}><View className="mx-auto w-full max-w-3xl gap-6"><View className="flex-row justify-between"><Skeleton className="h-4 w-40 rounded-full" /><Skeleton className="h-11 w-11 rounded-full" /></View><Skeleton className="h-10 w-64 rounded-xl" /><Skeleton className="h-80 rounded-[28px]" /></View></ScreenContainer>;
  if (dueQuery.error) return <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}><AppCard className="w-full max-w-md items-center gap-4 p-6"><Text className="text-center text-lg font-bold text-foreground">Revisão indisponível</Text><Text className="text-center text-sm leading-5 text-muted">{dueQuery.error.message}</Text><AppButton label="Tentar novamente" onPress={() => void dueQuery.refetch()} /></AppCard></ScreenContainer>;
  if (!dueQuery.data?.length) return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}><View className="mx-auto w-full max-w-3xl gap-6"><AppHeader active="Revisar" user={user} onLogout={handleLogout} /><SectionHeading eyebrow="SESSÃO DE REVISÃO" title="Tudo em dia." description="Nenhuma palavra precisa de atenção agora. Continue aprendendo para formar sua próxima fila." /><AppCard tone="sand" className="items-center gap-4 p-6"><View className="h-16 w-16 items-center justify-center rounded-full bg-warning"><Text className="text-3xl font-bold text-foreground">复</Text></View><Text className="text-center text-xl font-bold text-foreground">Sua memória agradece</Text><Text className="text-center text-base leading-6 text-muted">As palavras praticadas nas lições entram automaticamente na agenda quando estiverem prontas para revisão.</Text><AppButton label="Voltar ao mapa" onPress={() => router.push("/(tabs)/map")} /></AppCard></View></ScreenContainer>;

  if (isSessionComplete) return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={{ paddingBottom: 40 }}><View className="mx-auto w-full max-w-xl gap-6"><AppHeader active="Revisar" user={user} onLogout={handleLogout} /><SessionSummary reviewed={completedCount} forgot={forgot} hard={hard} easy={easy} onRetryHard={retryDifficult} onHome={() => router.push("/(tabs)")} /></View></ScrollView></ScreenContainer>;

  if (!started) return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}><View className="mx-auto w-full max-w-3xl gap-6"><AppHeader active="Revisar" user={user} onLogout={handleLogout} /><View className="flex-row items-start justify-between"><SectionHeading eyebrow="SESSÃO DE REVISÃO" title="Revisar agora" description={`${sessionCards.length} ${sessionCards.length === 1 ? "cartão vencido" : "cartões vencidos"} · ~${Math.max(1, Math.ceil(sessionCards.length * 0.8))} min`} /><Text className="rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">Fila de hoje</Text></View><AppCard tone="ink" className="items-center gap-5 p-7"><View className="h-16 w-16 items-center justify-center rounded-2xl bg-warning"><Text className="text-3xl font-bold text-foreground">复</Text></View><Text className="text-center text-2xl font-bold text-background">Uma palavra por vez.</Text><Text className="max-w-lg text-center text-base leading-6 text-surface">Recupere o significado antes de revelar a resposta. Seus ratings ajustam o próximo intervalo.</Text><View className="flex-row flex-wrap justify-center gap-2"><MetaChip label={`${sessionCards.length} cartões`} /><MetaChip label={`~${Math.max(1, Math.ceil(sessionCards.length * 0.8))} minutos`} /><MetaChip label="áudio disponível" /></View><AppButton label="Começar revisão" onPress={startSession} /></AppCard><Text className="text-center text-sm text-muted">Quer estudar conteúdo novo? <Text className="font-bold text-primary" onPress={() => router.push("/(tabs)/map")}>Abrir plano do nó ›</Text></Text></View></ScreenContainer>;

  const sessionTotal = availableCards.length;
  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}><View className="mx-auto w-full max-w-3xl"><AppHeader compact user={user} onLogout={handleLogout} /><View className="gap-5"><View className="flex-row items-center justify-between"><AppButton label="‹ Sair" variant="quiet" onPress={() => setStarted(false)} accessibilityLabel="Sair da sessão de revisão" /><View className="items-end"><Text className="text-2xl font-bold text-primary">{completedCount + 1}/{sessionTotal}</Text><Text className="text-xs text-muted">revisão</Text></View></View><View className="gap-2"><View className="flex-row justify-between"><Text className="text-xs font-bold text-muted">Progresso</Text><Text className="text-xs font-bold text-muted">{Math.round((completedCount / sessionTotal) * 100)}%</Text></View><View className="h-2 overflow-hidden rounded-full bg-border"><View className="h-full rounded-full bg-warning" style={{ width: `${Math.max(4, (completedCount / sessionTotal) * 100)}%` }} /></View></View><AppCard className="gap-5 p-6"><View className="flex-row items-center justify-between"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-muted">CARTÃO DE HOJE</Text><Text className="text-xs font-bold uppercase tracking-[1.5px] text-muted">CAIXA {currentCard?.box}/5</Text></View><View className="items-center gap-4 py-6"><Text className="text-7xl font-bold text-foreground">{currentCard?.hanzi}</Text><AudioButton text={currentCard?.hanzi ?? ""} audioUrl={currentCard?.audio?.url} textHash={currentCard?.audio?.textHash} label="Ouvir pronúncia" /><Text className="text-center text-sm leading-5 text-muted">Tente lembrar o significado antes de revelar.</Text></View>{revealed ? <View className="gap-4 border-t border-border pt-5"><View className="gap-1"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">RESPOSTA</Text><Text className="text-2xl font-bold text-foreground">{currentCard?.pinyin}</Text><Text className="text-base leading-6 text-muted">{currentCard?.meaningPtBr}</Text></View><View className="gap-2 rounded-2xl bg-sand p-4"><View className="flex-row items-center justify-between gap-3"><Text className="flex-1 text-xl font-bold text-foreground">{currentCard?.exampleHanzi}</Text><AudioButton text={currentCard?.exampleHanzi ?? ""} compact label="Ouvir exemplo" /></View><Text className="text-sm leading-5 text-muted">{currentCard?.examplePtBr}</Text></View><Text className="text-center text-base font-bold text-foreground">Como foi?</Text><RatingRow disabled={ratingMutation.isPending} loading={ratingMutation.isPending ? ratingMutation.variables?.rating : undefined} onSelect={submitRating} />{ratingMutation.error ? <View className="gap-2"><Text accessibilityRole="alert" className="text-center text-sm leading-5 text-error">Não foi possível registrar esta avaliação.</Text><AppButton label="Tentar novamente" variant="secondary" onPress={() => ratingMutation.variables?.rating && submitRating(ratingMutation.variables.rating)} /></View> : null}</View> : <AppButton label="Revelar resposta" onPress={() => setRevealed(true)} />}</AppCard></View></View></ScrollView></ScreenContainer>;
}

function MetaChip({ label }: { label: string }) { return <View className="rounded-full border border-surface px-3 py-2"><Text className="text-xs font-bold text-warning">{label}</Text></View>; }
