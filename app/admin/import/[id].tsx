import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type DocumentShape = { path?: { title?: string; nodes?: unknown[] } };

export default function AdminImportDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const importId = Array.isArray(id) ? id[0] : id;
  const detail = trpc.adminContent.get.useQuery({ id: importId ?? "" }, { enabled: Boolean(importId) });
  const validate = trpc.adminContent.validate.useMutation({ onSuccess: () => void detail.refetch() });
  const updateDraft = trpc.adminContent.updateDraft.useMutation({ onSuccess: () => { setJson(null); void detail.refetch(); } });
  const generateAudio = trpc.adminAudio.generateForImport.useMutation({ onSuccess: () => { setJson(null); void detail.refetch(); } });
  const setStatus = trpc.adminContent.setStatus.useMutation({ onSuccess: () => void detail.refetch() });
  const [json, setJson] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  if (detail.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator /><Text className="mt-3 text-sm text-muted">A carregar rascunho...</Text></ScreenContainer>;
  if (detail.error || !detail.data) return <ScreenContainer className="items-center justify-center px-5"><AppCard className="w-full max-w-md gap-3"><Text className="font-bold text-error">Rascunho indisponível</Text><Text className="text-sm text-muted">{detail.error?.message}</Text><AppButton label="Voltar" onPress={() => router.back()} /></AppCard></ScreenContainer>;

  const item = detail.data;
  const validation = item.validationErrorsJson === "[]" ? null : item.validationErrorsJson;
  const document = item.document as DocumentShape | null;
  const audioCount = document && "path" in document && Array.isArray(document.path?.nodes) ? document.path.nodes.reduce<number>((total, node) => total + (node && typeof node === "object" && "audioAssets" in node && Array.isArray(node.audioAssets) ? node.audioAssets.length : 0), 0) : 0;
  const editorValue = json ?? JSON.stringify(item.document, null, 2);
  const save = async () => {
    setEditorError(null);
    try {
      const parsed: unknown = JSON.parse(editorValue);
      await updateDraft.mutateAsync({ id: item.id, document: parsed });
    } catch (error) {
      setEditorError(error instanceof SyntaxError ? "JSON inválido. Verifica vírgulas, aspas e chavetas." : error instanceof Error ? error.message : "Não foi possível guardar o rascunho.");
    }
  };

  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}><ScrollView contentContainerStyle={{ paddingBottom: 36 }}><View className="gap-5"><AppButton label="‹  Voltar ao painel" variant="quiet" onPress={() => router.replace("/admin")} /><View><Text className="text-xs font-semibold uppercase tracking-widest text-primary">EDITOR DE CONTEÚDO</Text><Text className="mt-2 text-3xl font-bold text-foreground">{item.pathId}</Text><Text className="mt-1 text-sm text-muted">Versão {item.contentVersion} · {item.status}</Text></View><AppCard className="gap-3"><Text className="text-lg font-bold text-foreground">Resumo</Text><Text className="text-sm text-muted">{document?.path?.title ?? "Sem título"}</Text><Text className="text-sm text-muted">{document?.path?.nodes?.length ?? 0} nós</Text></AppCard><AppCard className="gap-3"><Text className="text-lg font-bold text-foreground">Áudio neural</Text><Text className="text-sm leading-5 text-muted">{audioCount ? `${audioCount} assets de áudio prontos para geração. Frases com o mesmo texto e configuração são reutilizadas automaticamente.` : "Ainda não existem audioAssets neste rascunho. Adiciona-os no JSON para gerar áudio Azure."}</Text>{audioCount ? <AppButton label="Gerar áudio dos assets" variant="secondary" loading={generateAudio.isPending} onPress={() => void generateAudio.mutateAsync({ id: item.id })} /> : null}</AppCard><AppCard className="gap-3"><Text className="text-lg font-bold text-foreground">Conteúdo estruturado</Text><Text className="text-sm leading-5 text-muted">Edita o JSON abaixo para adicionar nós, palavras, atividades, missões e áudio. O formato é validado antes de guardar.</Text><TextInput value={editorValue} onChangeText={setJson} multiline textAlignVertical="top" autoCapitalize="none" autoCorrect={false} spellCheck={false} style={{ minHeight: 420, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, color: colors.foreground, backgroundColor: colors.surface, fontFamily: "monospace", fontSize: 12, lineHeight: 18 }} /><AppButton label="Guardar e validar rascunho" loading={updateDraft.isPending} onPress={() => void save()} />{editorError ? <Text className="text-sm leading-5 text-error">{editorError}</Text> : null}</AppCard>{validation ? <AppCard className="gap-2" tone="sand"><Text className="font-bold text-error">Validação anterior</Text><Text className="text-sm text-muted">{validation}</Text></AppCard> : null}<View className="gap-2"><AppButton label="Validar novamente" variant="secondary" loading={validate.isPending} onPress={() => void validate.mutateAsync({ id: item.id })} />{item.status === "review" ? <AppButton label="Publicar conteúdo" loading={setStatus.isPending} onPress={() => void setStatus.mutateAsync({ id: item.id, status: "published" })} /> : null}{item.status !== "archived" ? <AppButton label="Arquivar" variant="quiet" loading={setStatus.isPending} onPress={() => void setStatus.mutateAsync({ id: item.id, status: "archived" })} /> : null}</View></View></ScrollView></ScreenContainer>;
}
