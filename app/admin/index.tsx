import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ScreenContainer } from "@/components/screen-container";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type ImportItem = { id: string; pathId: string; contentVersion: string; status: string };

export default function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, logout } = useAuth();
  const importsQuery = trpc.adminContent.list.useQuery();
  const setStatus = trpc.adminContent.setStatus.useMutation({ onSuccess: () => void importsQuery.refetch() });

  if (importsQuery.isLoading) return <ScreenContainer className="items-center justify-center" edges={["top", "left", "right", "bottom"]}><ActivityIndicator color={colors.primary} /><Text className="mt-3 text-sm text-muted">Carregando área administrativa…</Text></ScreenContainer>;
  if (importsQuery.error) return <ScreenContainer className="items-center justify-center px-5" edges={["top", "left", "right", "bottom"]}><AppCard className="w-full max-w-md items-center gap-4 p-6"><Text className="text-center text-lg font-bold text-foreground">Área administrativa indisponível</Text><Text className="text-center text-sm text-muted">{importsQuery.error.message}</Text><AppButton label="Tentar novamente" onPress={() => void importsQuery.refetch()} /></AppCard></ScreenContainer>;

  const imports = (importsQuery.data ?? []) as ImportItem[];
  const handleLogout = async () => { await logout(); router.replace("/login"); };
  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}><View className="mx-auto w-full max-w-6xl"><AppHeader user={user} onLogout={handleLogout} compact /><AdminDashboard imports={imports} pending={setStatus.isPending} onCreate={() => router.push("/admin/create")} onImport={() => router.push("/admin/import")} onOpen={(id) => router.push({ pathname: "/admin/import/[id]", params: { id } })} onTransition={(item) => void setStatus.mutateAsync({ id: item.id, status: item.status === "published" ? "archived" : "review" })} /></View></ScrollView></ScreenContainer>;
}
