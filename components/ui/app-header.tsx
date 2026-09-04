import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { User } from "@/lib/_core/auth";
import { AvatarMenu } from "./avatar-menu";

const NAV_ITEMS = [
  { label: "Hoje", route: "/(tabs)" },
  { label: "Revisar", route: "/(tabs)/review" },
  { label: "Mapa", route: "/(tabs)/map" },
  { label: "Biblioteca", route: "/(tabs)/library" },
] as const;

export function AppHeader({ active, user, onLogout, compact = false }: { active?: (typeof NAV_ITEMS)[number]["label"]; user: User | null; onLogout: () => Promise<void> | void; compact?: boolean }) {
  const router = useRouter();
  return (
    <View className="mb-5 flex-row items-center justify-between border-b border-border pb-4 pt-1">
      <Pressable onPress={() => router.push("/(tabs)" as never)} accessibilityRole="link" accessibilityLabel="Mapa de Mandarim, ir para Hoje">
        <Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">Mapa <Text className="text-foreground">de Mandarim</Text></Text>
      </Pressable>
      {!compact ? (
        <View className="hidden flex-row items-center gap-1 md:flex" accessibilityRole="tablist">
          {NAV_ITEMS.map((item) => {
            const selected = item.label === active;
            return (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as never)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.label}${selected ? ", selecionado" : ""}`}
                className={`min-h-[44px] justify-center rounded-full px-4 ${selected ? "bg-foreground" : "bg-transparent"}`}
              >
                <Text className={`font-bold ${selected ? "text-background" : "text-muted"}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <AvatarMenu user={user} onLogout={onLogout} />
    </View>
  );
}
