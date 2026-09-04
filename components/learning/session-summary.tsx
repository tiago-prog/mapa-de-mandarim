import { Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";

export function SessionSummary({ reviewed, forgot, hard, easy, onRetryHard, onHome }: { reviewed: number; forgot: number; hard: number; easy: number; onRetryHard: () => void; onHome: () => void }) {
  return (
    <View className="items-center gap-5">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-success"><Text className="text-4xl font-bold text-background">✓</Text></View>
      <View className="items-center gap-2">
        <Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">SESSÃO CONCLUÍDA</Text>
        <Text className="text-3xl font-bold text-foreground">Muito bem.</Text>
        <Text className="text-center text-base leading-6 text-muted">Você revisou {reviewed} {reviewed === 1 ? "cartão" : "cartões"} e ajustou seus próximos intervalos.</Text>
      </View>
      <AppCard className="w-full gap-1 p-5">
        <Text className="mb-3 text-center text-4xl font-bold text-warning">+{reviewed * 10} <Text className="text-base text-muted">XP</Text></Text>
        <SummaryRow label="Esqueci" value={forgot} />
        <SummaryRow label="Difícil" value={hard} />
        <SummaryRow label="Fácil" value={easy} />
      </AppCard>
      <View className="w-full gap-3">
        {hard + forgot > 0 ? <AppButton label={`Revisar difíceis (${hard + forgot})`} onPress={onRetryHard} /> : null}
        <AppButton label="Voltar ao Hoje" variant="secondary" onPress={onHome} />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return <View className="flex-row items-center justify-between border-t border-border py-3"><Text className="text-base text-muted">{label}</Text><Text className="text-base font-bold text-foreground">{value}</Text></View>;
}
