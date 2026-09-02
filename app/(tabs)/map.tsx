import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

const STATUS_LABELS = {
  locked: "Bloqueado",
  available: "Disponível",
  in_progress: "Em progresso",
  completed: "Concluído",
} as const;

const STATUS_GLYPHS = {
  locked: "锁",
  available: "○",
  in_progress: "◐",
  completed: "✓",
} as const;

export default function MapScreen() {
  const router = useRouter();
  const colors = useColors();
  const mapQuery = trpc.learningMap.get.useQuery();

  if (mapQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-sm text-muted">Abrindo seu mapa...</Text>
      </ScreenContainer>
    );
  }

  if (mapQuery.error || !mapQuery.data) {
    return (
      <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}>
        <AppCard className="w-full max-w-md items-center gap-4 p-6">
          <Text className="text-center text-lg font-bold text-foreground">Mapa indisponível</Text>
          <Text className="text-center text-sm leading-5 text-muted">{mapQuery.error?.message ?? "Tente novamente."}</Text>
          <AppButton label="Tentar novamente" onPress={() => void mapQuery.refetch()} />
        </AppCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-6">
          <View>
            <Text className="text-sm font-medium text-primary">JORNADA DE COMPETÊNCIAS</Text>
            <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">Seu mapa</Text>
            <Text className="mt-2 text-base leading-6 text-muted">Avance por pequenas conexões até conseguir se apresentar.</Text>
          </View>

          <AppCard className="gap-3" tone="sand">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-widest text-primary">TRILHA ATUAL</Text>
              <Text className="text-lg font-bold text-primary">{mapQuery.data.userProgress.completedNodeCount}/{mapQuery.data.nodes.length}</Text>
            </View>
            <Text className="text-xl font-bold text-foreground">{mapQuery.data.path.title}</Text>
            <Text className="text-sm leading-5 text-muted">{mapQuery.data.path.description}</Text>
          </AppCard>

          <View className="gap-3">
            {mapQuery.data.nodes.map((node, index) => {
              const isLocked = node.status === "locked";
              const isRecommended = node.id === mapQuery.data.recommendedNodeId;
              return (
                <View key={node.id} className="flex-row gap-3">
                  <View className="items-center">
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-full border-2 ${
                        node.status === "completed"
                          ? "border-success bg-success"
                          : isRecommended
                            ? "border-primary bg-primary/10"
                            : isLocked
                              ? "border-border bg-surface"
                              : "border-warning bg-warning/10"
                      }`}
                    >
                      <Text className={`text-lg font-bold ${node.status === "completed" ? "text-background" : isLocked ? "text-muted" : "text-primary"}`}>
                        {STATUS_GLYPHS[node.status]}
                      </Text>
                    </View>
                    {index < mapQuery.data.nodes.length - 1 ? <View className="mt-2 h-12 w-px bg-border" /> : null}
                  </View>
                  <Pressable
                    disabled={isLocked}
                    onPress={() => router.push({ pathname: "/node/[id]", params: { id: node.id } })}
                    style={({ pressed }) => [styles.nodePressable, { opacity: pressed ? 0.72 : isLocked ? 0.68 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${node.title}, ${STATUS_LABELS[node.status]}`}
                  >
                    <AppCard className="gap-2" tone={isRecommended ? "ink" : "paper"}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <Text className={`text-xs font-semibold uppercase tracking-widest ${isRecommended ? "text-surface" : "text-primary"}`}>
                            {STATUS_LABELS[node.status]}
                          </Text>
                          <Text className={`mt-1 text-lg font-bold ${isRecommended ? "text-background" : "text-foreground"}`}>{node.title}</Text>
                        </View>
                        {isRecommended ? <Text className="text-xs font-semibold text-warning">PRÓXIMO</Text> : null}
                      </View>
                      <Text className={`text-sm leading-5 ${isRecommended ? "text-surface" : "text-muted"}`}>{node.description}</Text>
                      {node.status !== "locked" ? (
                        <Text className={`text-xs font-semibold ${isRecommended ? "text-warning" : "text-primary"}`}>{node.progressPercent}% concluído</Text>
                      ) : (
                        <Text className="text-xs text-muted">Conclua o nó anterior para desbloquear.</Text>
                      )}
                    </AppCard>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Text className="text-center text-xs leading-5 text-muted">Cada nó apresenta uma habilidade pequena e prática. O próximo caminho aparece conforme você avança.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nodePressable: {
    flex: 1,
  },
});
