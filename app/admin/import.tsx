import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AdminImportScreen() {
  const router = useRouter();
  const colors = useColors();
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const importMutation = trpc.adminContent.importDraft.useMutation({ onSuccess: (data) => router.replace({ pathname: "/admin/import/[id]", params: { id: data.importId ?? "" } }) });

  const submit = async () => {
    setError(null);
    try {
      const document = JSON.parse(json) as unknown;
      await importMutation.mutateAsync({ document });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "JSON inválido");
    }
  };

  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}><ScrollView contentContainerStyle={{ paddingBottom: 36 }}><View className="gap-5"><AppButton label="‹  Voltar ao painel" variant="quiet" onPress={() => router.back()} /><View><Text className="text-xs font-semibold uppercase tracking-widest text-primary">IMPORTAÇÃO</Text><Text className="mt-2 text-3xl font-bold text-foreground">Importar trilha</Text><Text className="mt-1 text-sm leading-5 text-muted">Cole um documento JSON versionado. A validação acontece antes de guardar o rascunho.</Text></View><AppCard className="gap-3"><TextInput value={json} onChangeText={setJson} multiline autoCapitalize="none" autoCorrect={false} placeholder="Cole aqui o JSON da trilha..." placeholderTextColor={colors.muted} style={{ minHeight: 360, textAlignVertical: "top", fontFamily: "monospace", fontSize: 13, color: colors.foreground }} accessibilityLabel="Documento JSON da trilha" /><AppButton label="Guardar como rascunho" onPress={() => void submit()} loading={importMutation.isPending} disabled={!json.trim()} /></AppCard>{error ? <AppCard className="gap-2" tone="sand"><Text className="font-bold text-error">Não foi possível importar</Text><Text className="text-sm leading-5 text-muted">{error}</Text></AppCard> : null}{importMutation.isPending ? <ActivityIndicator color={colors.primary} /> : null}</View></ScrollView></ScreenContainer>;
}
