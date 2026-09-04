import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { trpc } from "@/lib/trpc";

export default function AdminImportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const importId = Array.isArray(id) ? id[0] : id;
  const detail = trpc.adminContent.get.useQuery({ id: importId ?? "" }, { enabled: Boolean(importId) });
  const validate = trpc.adminContent.validate.useMutation({ onSuccess: () => void detail.refetch() });
  const setStatus = trpc.adminContent.setStatus.useMutation({ onSuccess: () => void detail.refetch() });

  if (detail.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator /><Text className="mt-3 text-sm text-muted">A carregar rascunho...</Text></ScreenContainer>;
  if (detail.error || !detail.data) return <ScreenContainer className="items-center justify-center px-5"><AppCard className="w-full max-w-md gap-3"><Text className="font-bold text-error">Rascunho indisponível</Text><Text className="text-sm text-muted">{detail.error?.message}</Text><AppButton label="Voltar" onPress={() => router.back()} /></AppCard></ScreenContainer>;
  const item = detail.data;
  const validation = item.validationErrorsJson === "[]" ? null : item.validationErrorsJson;
  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}><ScrollView contentContainerStyle={{ paddingBottom: 36 }}><View className="gap-5"><AppButton label="‹  Voltar ao painel" variant="quiet" onPress={() => router.replace("/admin")} /><View><Text className="text-xs font-semibold uppercase tracking-widest text-primary">REVISÃO DE CONTEÚDO</Text><Text className="mt-2 text-3xl font-bold text-foreground">{item.pathId}</Text><Text className="mt-1 text-sm text-muted">Versão {item.contentVersion} · {item.status}</Text></View><AppCard className="gap-3"><Text className="text-lg font-bold text-foreground">Resumo</Text><Text className="text-sm text-muted">{item.document && typeof item.document === "object" && "path" in item.document ? String((item.document as { path?: { title?: string; nodes?: unknown[] } }).path?.title ?? "Sem título") : "Documento JSON"}</Text><Text className="text-sm text-muted">{item.document && typeof item.document === "object" && "path" in item.document ? `${((item.document as { path?: { nodes?: unknown[] } }).path?.nodes ?? []).length} nós` : "Estrutura não disponível"}</Text></AppCard>{validation ? <AppCard className="gap-2" tone="sand"><Text className="font-bold text-error">Validação anterior</Text><Text className="text-sm text-muted">{validation}</Text></AppCard> : null}<View className="gap-2"><AppButton label="Validar novamente" variant="secondary" loading={validate.isPending} onPress={() => void validate.mutateAsync({ id: item.id })} />{item.status === "review" ? <AppButton label="Publicar conteúdo" loading={setStatus.isPending} onPress={() => void setStatus.mutateAsync({ id: item.id, status: "published" })} /> : null}{item.status !== "archived" ? <AppButton label="Arquivar" variant="quiet" loading={setStatus.isPending} onPress={() => void setStatus.mutateAsync({ id: item.id, status: "archived" })} /> : null}</View></View></ScrollView></ScreenContainer>;
}
