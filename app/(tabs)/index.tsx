import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { NextActionCard } from "@/components/learning/next-action-card";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

function LoadingHome() {
  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <View className="mx-auto w-full max-w-6xl gap-6">
        <View className="flex-row items-center justify-between"><Skeleton className="h-4 w-40 rounded-full" /><Skeleton className="h-11 w-11 rounded-full" /></View>
        <View className="gap-2"><Skeleton className="h-4 w-44 rounded-full" /><Skeleton className="h-10 w-72 rounded-xl" /><Skeleton className="h-5 w-80 rounded-full" /></View>
        <View className="gap-4 md:flex-row"><Skeleton className="h-64 flex-1 rounded-[28px]" /><View className="gap-3 md:w-64"><Skeleton className="h-20 rounded-[20px]" /><Skeleton className="h-20 rounded-[20px]" /><Skeleton className="h-20 rounded-[20px]" /></View></View>
      </View>
    </ScreenContainer>
  );
}

function DataState({ message, action }: { message: string; action: () => void }) {
  return (
    <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
      <AppCard className="w-full max-w-md items-center gap-4 p-6">
        <Text className="text-center text-lg font-bold text-foreground">Não foi possível carregar Hoje</Text>
        <Text className="text-center text-sm leading-5 text-muted">{message}</Text>
        <AppButton label="Tentar novamente" onPress={action} />
      </AppCard>
    </ScreenContainer>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const todayQuery = trpc.today.get.useQuery();
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "vamos continuar";

  if (todayQuery.isLoading) return <LoadingHome />;
  if (todayQuery.error || !todayQuery.data) return <DataState message={todayQuery.error?.message ?? "Tente novamente em alguns instantes."} action={() => void todayQuery.refetch()} />;

  const { data } = todayQuery;
  const recommendedNode = data.nodes.find((node) => node.id === data.recommendedNodeId) ?? data.nodes[0];
  const completedNodes = data.nodes.filter((node) => node.status === "completed").length;
  const pathProgress = data.nodes.length ? Math.round((completedNodes / data.nodes.length) * 100) : 0;
  const reviewDue = data.reviewDueCount;
  const hasReview = reviewDue > 0;
  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-auto w-full max-w-6xl gap-6">
          <AppHeader active="Hoje" user={user} onLogout={handleLogout} />
          <SectionHeading eyebrow="SUGESTÃO PARA HOJE" title={`${new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite"}, ${displayName}.`} description="Uma pequena sessão mantém seu mandarim em movimento." />

          <View className="gap-4 md:flex-row">
            <View className="flex-1">
              {hasReview ? (
                <NextActionCard title={`Revisar ${reviewDue} ${reviewDue === 1 ? "cartão" : "cartões"}`} description="Há palavras no intervalo certo para você relembrar agora. Comece com uma sessão curta." ctaLabel="Revisar agora" onPress={() => router.push("/(tabs)/review")} />
              ) : (
                <NextActionCard title={recommendedNode ? recommendedNode.title : "Explorar o mapa"} description={recommendedNode?.description ?? "Escolha uma habilidade e avance por pequenas conexões."} eyebrow="PRÓXIMA AÇÃO" progress={recommendedNode?.progressPercent ?? 0} progressLabel="Progresso do nó" ctaLabel={recommendedNode ? "Continuar aprendizado" : "Abrir mapa"} onPress={() => recommendedNode ? router.push({ pathname: "/node/[id]", params: { id: recommendedNode.id } }) : router.push("/(tabs)/map")} />
              )}
            </View>
            <View className="gap-3 md:w-64">
              <StatCard value={String(reviewDue)} label="cartões para revisar" />
              <StatCard value={`+${data.userProgress.xp} XP`} label="XP hoje" />
              <StatCard value={`${data.userProgress.streakDays} dias`} label="sequência atual" />
            </View>
          </View>

          <AppCard tone="sand" className="gap-4">
            <View className="flex-row items-start justify-between gap-4"><View className="flex-1 gap-1"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">TRILHA ATUAL</Text><Text className="text-xl font-bold text-foreground">{data.path.title}</Text><Text className="text-sm leading-5 text-muted">{data.path.description}</Text></View><Text className="text-2xl font-bold text-primary">{completedNodes}/{data.nodes.length}</Text></View>
            <View className="gap-2"><View className="flex-row justify-between"><Text className="text-xs font-semibold text-muted">Progresso da trilha</Text><Text className="text-xs font-bold text-primary">{pathProgress}%</Text></View><View className="h-2 overflow-hidden rounded-full bg-border"><View className="h-full rounded-full bg-warning" style={{ width: `${pathProgress}%` }} /></View></View>
            <AppButton label="Abrir mapa" variant="secondary" onPress={() => router.push("/(tabs)/map")} />
          </AppCard>

          <View className="gap-3"><Text className="text-xl font-bold text-foreground">Para manter o ritmo</Text><View className="gap-3 md:flex-row"><AppCard className="flex-1 flex-row items-center gap-4"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Text className="text-2xl font-bold text-primary">学</Text></View><View className="flex-1 gap-1"><Text className="font-bold text-foreground">Aprenda por contexto</Text><Text className="text-sm leading-5 text-muted">Veja a próxima habilidade e pratique uma coisa por vez.</Text></View><AppButton label="Mapa" variant="quiet" onPress={() => router.push("/(tabs)/map")} /></AppCard><AppCard className="flex-1 flex-row items-center gap-4"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-warning/20"><Text className="text-2xl font-bold text-primary">词</Text></View><View className="flex-1 gap-1"><Text className="font-bold text-foreground">Cuide do vocabulário</Text><Text className="text-sm leading-5 text-muted">Revise suas palavras e acompanhe o próprio estado.</Text></View><AppButton label="Abrir" variant="quiet" onPress={() => router.push("/(tabs)/library")} /></AppCard></View></View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return <AppCard className="min-h-[84px] justify-center gap-1 p-4"><Text className="text-2xl font-bold text-foreground">{value}</Text><Text className="text-sm text-muted">{label}</Text></AppCard>;
}
