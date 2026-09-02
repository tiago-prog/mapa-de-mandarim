import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatPill } from "@/components/ui/stat-pill";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

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
              <Text style={{ color: colors.surface }} className="text-xs font-semibold uppercase tracking-widest">CONTINUAR TRILHA</Text>
              <Text style={{ color: colors.warning }} className="text-sm font-semibold">+40 XP</Text>
            </View>
            <View>
              <Text style={{ color: colors.background }} className="text-2xl font-bold leading-8">Dizer quem você é</Text>
              <Text style={{ color: colors.surface }} className="mt-2 text-sm leading-5">Aprenda a dizer seu nome e perguntar o nome de alguém.</Text>
            </View>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text style={{ color: colors.surface }} className="text-xs">Progresso do nó</Text>
                <Text style={{ color: colors.background }} className="text-xs font-semibold">60%</Text>
              </View>
              <ProgressBar value={60} className="bg-sand/30" fillClassName="bg-warning" />
            </View>
            <AppButton label="Continuar aprendizado" onPress={() => router.push({ pathname: "/node/[id]", params: { id: "intro" } })} />
          </AppCard>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Hoje</Text>
              <Text className="text-sm text-muted">Seu ritmo</Text>
            </View>
            <View className="flex-row gap-3">
              <StatPill label="revisões" value="5" />
              <StatPill label="sequência" value="3 dias" tone="sage" />
              <StatPill label="XP ganho" value="80" tone="gold" />
            </View>
          </View>

          <AppCard className="gap-4" tone="sand">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-widest text-primary">SEU MAPA</Text>
                <Text className="mt-1 text-lg font-bold text-foreground">Apresentações</Text>
              </View>
              <Text className="text-2xl font-bold text-primary">2/8</Text>
            </View>
            <ProgressBar value={25} />
            <Text className="text-sm leading-5 text-muted">Você já fortaleceu os fundamentos. A próxima conexão está disponível.</Text>
          </AppCard>

          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">Para manter o ritmo</Text>
            <AppCard className="flex-row items-center gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Text className="text-xl text-primary">复</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-foreground">Revisar palavras</Text>
                <Text className="mt-1 text-sm text-muted">5 cartões aguardam sua atenção.</Text>
              </View>
              <Text className="text-lg font-bold text-primary">›</Text>
            </AppCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
