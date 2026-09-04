import { Pressable, Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import type { LearningNodeStatus } from "@/server/domain/learning";

const STATUS: Record<LearningNodeStatus, { label: string; glyph: string }> = {
  completed: { label: "CONCLUÍDO", glyph: "✓" },
  in_progress: { label: "EM PROGRESSO", glyph: "•" },
  available: { label: "DISPONÍVEL · PRÓXIMO", glyph: "◎" },
  locked: { label: "BLOQUEADO", glyph: "—" },
};

export function NodeTimeline({ nodes, recommendedNodeId, onSelect }: { nodes: { id: string; title: string; description: string; status: LearningNodeStatus; progressPercent: number; stepCount: number; activityCount: number; prerequisiteNodeId?: string | null }[]; recommendedNodeId?: string | null; onSelect: (id: string) => void }) {
  return (
    <View className="gap-3">
      {nodes.map((node, index) => {
        const status = STATUS[node.status];
        const recommended = node.id === recommendedNodeId;
        const locked = node.status === "locked";
        return (
          <View key={node.id} className="flex-row gap-3">
            <View className="items-center">
              <View className={`h-10 w-10 items-center justify-center rounded-full border-2 ${node.status === "completed" ? "border-success bg-success" : recommended ? "border-primary bg-primary/10" : locked ? "border-border bg-surface" : "border-warning bg-warning/10"}`}>
                <Text className={`text-base font-bold ${node.status === "completed" ? "text-background" : locked ? "text-muted" : "text-primary"}`}>{status.glyph}</Text>
              </View>
              {index < nodes.length - 1 ? <View className="mt-2 h-12 w-px bg-border" /> : null}
            </View>
            <Pressable
              onPress={() => onSelect(node.id)}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel={`${node.title}, ${status.label.toLocaleLowerCase("pt-BR")}${locked ? ". Conclua o nó anterior para desbloquear." : ""}`}
              accessibilityState={{ disabled: locked }}
              className="flex-1"
            >
              <AppCard tone={recommended ? "sand" : "paper"} className={`gap-2 ${recommended ? "border-primary" : ""} ${locked ? "opacity-60" : ""}`}>
                <Text className="text-xs font-bold uppercase tracking-[1.4px] text-primary">{status.label}</Text>
                <Text className="text-lg font-bold text-foreground">{node.title}</Text>
                <Text className="text-sm leading-5 text-muted">{node.description}</Text>
                {locked ? <Text className="text-xs font-semibold text-muted">Conclua o nó anterior para desbloquear esta habilidade.</Text> : <Text className="text-xs font-semibold text-primary">{node.progressPercent}% concluído · {node.stepCount} etapas</Text>}
              </AppCard>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
