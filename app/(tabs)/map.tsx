import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { NodeTimeline } from "@/components/learning/node-timeline";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function MapScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const mapQuery = trpc.learningMap.get.useQuery();

  if (mapQuery.isLoading) return <MapLoading />;
  if (mapQuery.error || !mapQuery.data) {
    return <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}><AppCard className="w-full max-w-md items-center gap-4 p-6"><Text className="text-center text-lg font-bold text-foreground">Mapa indisponível</Text><Text className="text-center text-sm leading-5 text-muted">{mapQuery.error?.message ?? "Tente novamente."}</Text><AppButton label="Tentar novamente" onPress={() => void mapQuery.refetch()} /></AppCard></ScreenContainer>;
  }

  const { data } = mapQuery;
  const completed = data.userProgress.completedNodeCount;
  const pathProgress = data.nodes.length ? Math.round((completed / data.nodes.length) * 100) : 0;
  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-auto w-full max-w-5xl gap-6">
          <AppHeader active="Mapa" user={user} onLogout={async () => { await logout(); router.replace("/login"); }} />
          <SectionHeading eyebrow="JORNADA DE COMPETÊNCIAS" title="Seu mapa" description="Avance por pequenas conexões até conseguir se apresentar." />
          <AppCard tone="sand" className="gap-4 p-6"><View className="flex-row items-start justify-between gap-4"><View className="flex-1 gap-1"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">TRILHA ATUAL</Text><Text className="text-xl font-bold text-foreground">{data.path.title}</Text><Text className="text-base leading-6 text-muted">{data.path.description}</Text></View><Text className="text-2xl font-bold text-primary">{completed}/{data.nodes.length}</Text></View><View className="gap-2"><View className="flex-row justify-between"><Text className="text-xs font-bold text-muted">Progresso da trilha</Text><Text className="text-xs font-bold text-primary">{pathProgress}%</Text></View><ProgressBar value={pathProgress} label="Progresso da trilha" fillClassName="bg-warning" /></View></AppCard>
          <View className="gap-3"><View className="flex-row items-end justify-between"><View><Text className="text-xl font-bold text-foreground">Nós de aprendizagem</Text><Text className="mt-1 text-sm text-muted">Cada nó desbloqueia uma habilidade prática.</Text></View><Text className="text-sm font-bold text-primary">{data.nodes.length} nós</Text></View><NodeTimeline nodes={data.nodes} recommendedNodeId={data.recommendedNodeId} onSelect={(id) => router.push({ pathname: "/node/[id]", params: { id } })} /></View>
          <AppCard className="gap-2" tone="ink"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-warning">COMO FUNCIONA</Text><Text className="text-base leading-6 text-background">Conclua um nó para desbloquear o próximo. O mapa mostra seu caminho e o plano de ensino explica cada etapa.</Text></AppCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MapLoading() {
  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}><View className="mx-auto w-full max-w-5xl gap-6"><View className="flex-row justify-between"><Skeleton className="h-4 w-40 rounded-full" /><Skeleton className="h-11 w-11 rounded-full" /></View><View className="gap-2"><Skeleton className="h-4 w-48 rounded-full" /><Skeleton className="h-10 w-48 rounded-xl" /><Skeleton className="h-5 w-80 rounded-full" /></View><Skeleton className="h-40 rounded-[20px]" /><Skeleton className="h-28 rounded-[20px]" /><Skeleton className="h-28 rounded-[20px]" /></View></ScreenContainer>;
}
