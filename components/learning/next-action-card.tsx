import { Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";

export function NextActionCard({ title, description, eyebrow = "PRÓXIMA AÇÃO", progress, progressLabel, ctaLabel, onPress, tone = "ink" }: { title: string; description: string; eyebrow?: string; progress?: number; progressLabel?: string; ctaLabel: string; onPress: () => void; tone?: "ink" | "sand" }) {
  const dark = tone === "ink";
  return (
    <AppCard tone={tone} className="gap-5 p-6">
      <Text className={`text-xs font-bold uppercase tracking-[1.5px] ${dark ? "text-warning" : "text-primary"}`}>{eyebrow}</Text>
      <View className="gap-2">
        <Text className={`text-2xl font-bold leading-8 ${dark ? "text-background" : "text-foreground"}`}>{title}</Text>
        <Text className={`text-base leading-6 ${dark ? "text-surface" : "text-muted"}`}>{description}</Text>
      </View>
      {typeof progress === "number" ? (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className={`text-xs font-semibold ${dark ? "text-surface" : "text-muted"}`}>{progressLabel ?? "Progresso"}</Text>
            <Text className={`text-xs font-bold ${dark ? "text-background" : "text-primary"}`}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar value={progress} label={progressLabel ?? "Progresso"} className={dark ? "bg-sand/30" : undefined} fillClassName={dark ? "bg-warning" : undefined} />
        </View>
      ) : null}
      <View className="self-start">
        <AppButton label={ctaLabel} onPress={onPress} />
      </View>
    </AppCard>
  );
}
