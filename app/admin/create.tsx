import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const colors = useColors();
  return <View className="gap-2"><Text className="text-sm font-semibold text-foreground">{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} autoCapitalize="sentences" style={{ minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, color: colors.foreground, backgroundColor: colors.surface }} /></View>;
}

export default function AdminCreateScreen() {
  const router = useRouter();
  const [pathId, setPathId] = useState("minha-trilha");
  const [slug, setSlug] = useState("minha-trilha");
  const [version, setVersion] = useState("v1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nodeId, setNodeId] = useState("primeiro-no");
  const [nodeTitle, setNodeTitle] = useState("");
  const [nodeDescription, setNodeDescription] = useState("");
  const [nodeObjective, setNodeObjective] = useState("");
  const [error, setError] = useState<string | null>(null);
  const importMutation = trpc.adminContent.importDraft.useMutation({ onSuccess: (data) => router.replace({ pathname: "/admin/import/[id]", params: { id: data.importId ?? "" } }) });

  const createDraft = async () => {
    setError(null);
    if (!title.trim() || !description.trim() || !nodeTitle.trim() || !nodeDescription.trim() || !nodeObjective.trim()) {
      setError("Preenche o título, descrição e os dados do primeiro nó.");
      return;
    }
    const document = {
      schemaVersion: 1 as const,
      contentVersion: version.trim() || "v1",
      path: {
        id: pathId.trim() || "minha-trilha",
        slug: slug.trim() || pathId.trim() || "minha-trilha",
        title: title.trim(),
        description: description.trim(),
        status: "draft" as const,
        nodes: [{
          id: nodeId.trim() || "primeiro-no",
          pathId: pathId.trim() || "minha-trilha",
          title: nodeTitle.trim(),
          description: nodeDescription.trim(),
          objective: nodeObjective.trim(),
          orderIndex: 0,
          prerequisiteNodeId: null,
          lexicalEntries: [],
          steps: [{ id: `${nodeId.trim() || "primeiro-no"}-objective`, orderIndex: 0, kind: "objective" as const, title: "Objetivo", description: nodeObjective.trim(), content: { kind: "objective" as const, objective: nodeObjective.trim(), successCriteria: ["Concluir o primeiro conteúdo"], estimatedMinutes: 5 } }],
          activities: [],
          mission: null,
          audioAssets: [],
        }],
      },
    };
    try { await importMutation.mutateAsync({ document }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível criar o rascunho."); }
  };

  return <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right", "bottom"]}><ScrollView contentContainerStyle={{ paddingBottom: 40 }}><View className="gap-5"><AppButton label="‹  Voltar ao painel" variant="quiet" onPress={() => router.back()} /><View><Text className="text-xs font-semibold uppercase tracking-widest text-primary">EDITOR INICIAL</Text><Text className="mt-2 text-3xl font-bold text-foreground">Criar trilha</Text><Text className="mt-1 text-sm leading-5 text-muted">Cria um rascunho com uma trilha e o primeiro nó. Depois podes completar o conteúdo no JSON ou no editor avançado.</Text></View><AppCard className="gap-4"><Text className="text-xl font-bold text-foreground">Trilha</Text><Field label="ID da trilha" value={pathId} onChangeText={setPathId} placeholder="ex.: apresentacoes" /><Field label="Slug" value={slug} onChangeText={setSlug} placeholder="ex.: apresentacoes" /><Field label="Versão" value={version} onChangeText={setVersion} placeholder="ex.: v1" /><Field label="Título" value={title} onChangeText={setTitle} placeholder="ex.: Apresentações" /><Field label="Descrição" value={description} onChangeText={setDescription} placeholder="O que o utilizador vai aprender" /></AppCard><AppCard className="gap-4"><Text className="text-xl font-bold text-foreground">Primeiro nó</Text><Field label="ID do nó" value={nodeId} onChangeText={setNodeId} placeholder="ex.: saudacoes" /><Field label="Título" value={nodeTitle} onChangeText={setNodeTitle} placeholder="ex.: Primeiras saudações" /><Field label="Descrição" value={nodeDescription} onChangeText={setNodeDescription} placeholder="Descrição do nó" /><Field label="Objetivo comunicativo" value={nodeObjective} onChangeText={setNodeObjective} placeholder="ex.: Cumprimentar alguém" /></AppCard>{error ? <Text className="text-sm leading-5 text-error">{error}</Text> : null}<AppButton label="Criar rascunho" onPress={() => void createDraft()} loading={importMutation.isPending} /></View></ScrollView></ScreenContainer>;
}
