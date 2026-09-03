import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatPill } from "@/components/ui/stat-pill";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

function DataState({ message, action }: { message: string; action?: () => void }) {
  const colors = useColors();
  return (
    <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
      <AppCard className="w-full max-w-md items-center gap-4 p-6">
        <Text className="text-center text-lg font-bold text-foreground">Não foi possível carregar</Text>
        <Text className="text-center text-sm leading-5 text-muted">{message}</Text>
        {action ? <AppButton label="Tentar novamente" onPress={action} /> : null}
        <ActivityIndicator color={colors.primary} style={{ opacity: action ? 0 : 1 }} />
      </AppCard>
    </ScreenContainer>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const todayQuery = trpc.today.get.useQuery();

  if (todayQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Carregando seu próximo passo...</Text>
      </ScreenContainer>
    );
  }

  if (todayQuery.error || !todayQuery.data) {
    return <DataState message={todayQuery.error?.message ?? "Tente novamente em alguns instantes."} action={() => void todayQuery.refetch()} />;
  }

  const { data } = todayQuery;
  const recommendedNode = data.nodes.find((node) => node.id === data.recommendedNodeId) ?? data.nodes[0];
  const completedNodes = data.nodes.filter((node) => node.status === "completed").length;
  const pathProgress = data.nodes.length ? Math.round((completedNodes / data.nodes.length) * 100) : 0;

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="gap-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-medium text-primary">MAPA DE MANDARIM</Text>
              <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">Bom dia, estudante.</Text>
              <Text className="mt-2 text-base leading-6 text-muted">Seu próximo passo está pronto.</Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Text className="text-xl font-bold text-background">生</Text>
            </View>
          </View>

          <AppCard className="gap-5" tone="ink">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-widest text-background">CONTINUAR TRILHA</Text>
              <Text className="text-sm font-semibold text-warning">+40 XP</Text>
            </View>
            <View>
              <Text className="text-2xl font-bold leading-8 text-background">{recommendedNode.title}</Text>
              <Text className="mt-2 text-sm leading-5 text-background">{recommendedNode.description}</Text>
            </View>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-background">Progresso do nó</Text>
                <Text className="text-xs font-semibold text-background">{recommendedNode.progressPercent}%</Text>
              </View>
              <ProgressBar value={recommendedNode.progressPercent} className="bg-sand/30" fillClassName="bg-warning" />
            </View>
            <AppButton label="Continuar aprendizado" onPress={() => router.push({ pathname: "/node/[id]", params: { id: recommendedNode.id } })} />
          </AppCard>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Hoje</Text>
              <Text className="text-sm text-muted">Seu ritmo</Text>
            </View>
            <View className="flex-row gap-3">
              <StatPill label="nós concluídos" value={`${completedNodes}`} />
              <StatPill label="sequência" value={`${data.userProgress.streakDays} dias`} tone="sage" />
              <StatPill label="XP ganho" value={`${data.userProgress.xp}`} tone="gold" />
            </View>
          </View>

          <AppCard className="gap-4" tone="sand">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold uppercase tracking-widest text-primary">SEU MAPA</Text>
                <Text className="mt-1 text-lg font-bold text-foreground">{data.path.title}</Text>
              </View>
              <Text className="text-2xl font-bold text-primary">{completedNodes}/{data.nodes.length}</Text>
            </View>
            <ProgressBar value={pathProgress} />
            <Text className="text-sm leading-5 text-muted">{data.path.description}</Text>
          </AppCard>

          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">Para manter o ritmo</Text>
            <AppCard className="flex-row items-center gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Text className="text-xl text-primary">学</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Explore o mapa</Text>
                <Text className="mt-1 text-sm text-muted">Veja os próximos nós e seus pré-requisitos.</Text>
              </View>
              <AppButton label="Abrir" variant="quiet" onPress={() => router.push("/(tabs)/map")} accessibilityLabel="Abrir mapa" />
            </AppCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
