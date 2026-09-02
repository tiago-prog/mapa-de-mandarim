import { Text, View } from "react-native";

export interface StatPillProps {
  label: string;
  value: string | number;
  tone?: "default" | "gold" | "sage";
}

export function StatPill({ label, value, tone = "default" }: StatPillProps) {
  const toneClass = {
    default: "bg-sand border-border",
    gold: "bg-gold/15 border-gold/30",
    sage: "bg-success/10 border-success/30",
  }[tone];

  return (
    <View className={`min-w-[96px] rounded-2xl border px-3 py-3 ${toneClass}`}>
      <Text className="text-lg font-bold text-foreground">{value}</Text>
      <Text className="mt-1 text-xs text-muted">{label}</Text>
    </View>
  );
}
