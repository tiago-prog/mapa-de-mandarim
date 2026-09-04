import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const STATUS_LABELS: Record<string, string> = { draft: "Rascunho", review: "Em revisão", published: "Publicado", archived: "Arquivado" };

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const importsQuery = trpc.adminContent.list.useQuery();
  const setStatus = trpc.adminContent.setStatus.useMutation({ onSuccess: () => void importsQuery.refetch() });

  if (importsQuery.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator /><Text className="mt-3 text-sm text-muted">A carregar área administrativa...</Text></ScreenContainer>;
  if (importsQuery.error) return <ScreenContainer className="items-center justify-center px-5"><AppCard className="w-full max-w-md gap-3"><Text className="text-lg font-bold text-foreground">Área administrativa indisponível</Text><Text className="text-sm text-muted">{importsQuery.error.message}</Text><AppButton label="Tentar novamente" onPress={() => void importsQuery.refetch()} /></AppCard></ScreenContainer>;

  const imports = importsQuery.data ?? [];
  const count = (status: string) => imports.filter((item) => item.status === status).length;
  const handleLogout = async () => { await logout(); router.replace("/login"); };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="gap-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1"><Text className="text-xs font-semibold uppercase tracking-widest text-primary">ADMINISTRAÇÃO</Text><Text className="mt-2 text-3xl font-bold text-foreground">Conteúdo editorial</Text><Text className="mt-1 text-sm leading-5 text-muted">Crie, valide e publique trilhas do Mapa de Mandarim.</Text></View>
            <AppButton label="Sair" variant="quiet" onPress={handleLogout} />
          </View>
          <View className="flex-row gap-2">
            {[["Rascunhos", count("draft")], ["Revisão", count("review")], ["Publicados", count("published")]].map(([label, value]) => <AppCard key={String(label)} className="flex-1 items-center gap-1 p-3"><Text className="text-2xl font-bold text-primary">{value}</Text><Text className="text-center text-xs text-muted">{label}</Text></AppCard>)}
          </View>
          <AppButton label="Importar trilha JSON" onPress={() => router.push("/admin/import")} />
          <View className="gap-3"><Text className="text-xl font-bold text-foreground">Conteúdos importados</Text>{imports.length === 0 ? <AppCard className="gap-2"><Text className="font-semibold text-foreground">Ainda não há rascunhos</Text><Text className="text-sm leading-5 text-muted">Importe o primeiro JSON para começar a construir o seu mapa.</Text></AppCard> : imports.map((item) => <AppCard key={item.id} className="gap-3"><View className="flex-row items-start justify-between gap-3"><View className="flex-1"><Text className="text-lg font-bold text-foreground">{item.pathId}</Text><Text className="mt-1 text-sm text-muted">Versão {item.contentVersion}</Text></View><Text className="text-xs font-semibold text-primary">{STATUS_LABELS[item.status] ?? item.status}</Text></View><View className="flex-row gap-2"><AppButton label="Abrir" variant="quiet" onPress={() => router.push({ pathname: "/admin/import/[id]", params: { id: item.id } })} /><AppButton label={item.status === "published" ? "Arquivar" : "Enviar para revisão"} variant="secondary" loading={setStatus.isPending} onPress={() => void setStatus.mutateAsync({ id: item.id, status: item.status === "published" ? "archived" : "review" })} /></View></AppCard>)}</View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
