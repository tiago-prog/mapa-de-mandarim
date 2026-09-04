import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const STEP_LABELS: Record<string, string> = { objective: "Objetivo comunicativo", context: "Contexto", vocabulary: "Vocabulário essencial", grammar: "Gramática", practice: "Prática guiada", application: "Aplicação", review: "Revisão" };
const STEP_GLYPHS: Record<string, string> = { objective: "◎", context: "◌", vocabulary: "字", grammar: "文", practice: "•", application: "用", review: "✓" };

export default function NodeDetailScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nodeId = Array.isArray(id) ? id[0] : id;
  const nodeQuery = trpc.learningMap.getNode.useQuery({ nodeId: nodeId ?? "" }, { enabled: Boolean(nodeId) });

  if (nodeQuery.isLoading) return <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}><ActivityIndicator size="large" color={colors.primary} /><Text className="mt-3 text-sm text-muted">Carregando plano do nó…</Text></ScreenContainer>;
  if (nodeQuery.error || !nodeQuery.data) return <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}><AppCard className="w-full max-w-md items-center gap-4 p-6"><Text className="text-center text-lg font-bold text-foreground">Nó não encontrado</Text><Text className="text-center text-sm leading-5 text-muted">{nodeQuery.error?.message ?? "Volte ao mapa e escolha outro caminho."}</Text><AppButton label="Voltar ao mapa" onPress={() => router.replace("/(tabs)/map")} /></AppCard></ScreenContainer>;

  const { node, steps } = nodeQuery.data;
  const firstStep = steps[0];
  const handleLogout = async () => { await logout(); router.replace("/login"); };
  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-auto w-full max-w-5xl gap-6">
          <AppHeader active="Mapa" user={user} onLogout={handleLogout} />
          <SectionHeading eyebrow="NÓ DE APRENDIZAGEM" title={node.title} description={node.description} />
          <AppCard tone="sand" className="gap-5 p-6"><View className="flex-row items-start justify-between gap-4"><View className="flex-1 gap-2"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">OBJETIVO COMUNICATIVO</Text><Text className="text-2xl font-bold leading-8 text-foreground">{node.objective}</Text></View><Text className="text-3xl font-bold text-primary">{node.progressPercent}%</Text></View><View className="gap-2"><View className="flex-row justify-between"><Text className="text-xs font-bold text-muted">Domínio desta etapa</Text><Text className="text-xs font-bold text-primary">{node.completedActivityCount}/{node.activityCount} práticas</Text></View><ProgressBar value={node.progressPercent} label="Domínio desta etapa" /></View></AppCard>
          <View className="gap-3 md:flex-row"><View className="flex-1 gap-3"><View className="flex-row items-end justify-between"><View><Text className="text-xl font-bold text-foreground">Uma etapa por vez</Text><Text className="mt-1 text-sm text-muted">Plano de ensino</Text></View><Text className="text-sm font-bold text-muted">{steps.length} etapas</Text></View>{steps.map((step, index) => <StepCard key={step.id} step={step} index={index} total={steps.length} onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: node.id, stepId: step.id } })} />)}</View><View className="md:w-[320px]"><AppCard tone="ink" className="gap-4"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-warning">COMO VOCÊ VAI SABER?</Text><Text className="text-base leading-6 text-background">Você termina quando consegue reconhecer, construir e aplicar a estrutura sem depender da tradução.</Text><AppButton label={node.status === "completed" ? "Revisar o plano" : "Começar etapa"} onPress={() => firstStep ? router.push({ pathname: "/lesson/[id]", params: { id: node.id, stepId: firstStep.id } }) : undefined} disabled={!firstStep} /></AppCard></View></View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StepCard({ step, index, total, onPress }: { step: { id: string; kind: string; title: string; description: string }; index: number; total: number; onPress: () => void }) {
  const state = index === 0 ? "Agora" : index === 1 ? "A seguir" : "Disponível";
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Etapa ${index + 1} de ${total}: ${step.title}, ${state}`} className="w-full"><AppCard className={`flex-row items-center gap-3 ${index === 0 ? "border-primary bg-primary/5" : ""}`}><View className={`h-11 w-11 items-center justify-center rounded-2xl ${index === 0 ? "bg-primary" : "bg-sand"}`}><Text className={`text-lg font-bold ${index === 0 ? "text-background" : "text-primary"}`}>{STEP_GLYPHS[step.kind] ?? "•"}</Text></View><View className="flex-1 gap-1"><Text className="text-xs font-bold uppercase tracking-[1.2px] text-primary">{STEP_LABELS[step.kind] ?? step.kind} · {state}</Text><Text className="text-base font-bold text-foreground">{step.title}</Text><Text className="text-sm leading-5 text-muted">{step.description}</Text></View><Text className="text-xl text-muted">›</Text></AppCard></Pressable>;
}
