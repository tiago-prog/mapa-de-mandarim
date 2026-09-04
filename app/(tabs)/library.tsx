import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";

import { WordDetailPanel } from "@/components/learning/word-detail-panel";
import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppHeader } from "@/components/ui/app-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { WordStatus } from "@/server/domain/vocabulary";

type WordFilter = "all" | WordStatus;
type Scope = "mine" | "dictionary";
const STATUS_LABELS: Record<WordStatus, string> = { new: "Nova", known: "Conhecida", learning: "Em aprendizado" };

export default function LibraryScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WordFilter>("all");
  const [scope, setScope] = useState<Scope>("mine");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const dictionaryQuery = trpc.dictionary.search.useQuery({ query, limit: 50 });
  const statusMutation = trpc.dictionary.setStatus.useMutation({
    onSuccess: (entry) => {
      setSelectedEntryId(entry.id);
      void utils.dictionary.search.invalidate();
      void utils.dictionary.get.invalidate({ entryId: entry.id });
      void utils.dictionary.myWords.invalidate();
    },
  });

  const entries = useMemo(() => {
    const all = dictionaryQuery.data ?? [];
    const scoped = scope === "mine" ? all.filter((entry) => entry.status !== "new") : all;
    return filter === "all" ? scoped : scoped.filter((entry) => entry.status === filter);
  }, [dictionaryQuery.data, filter, scope]);
  const selectedEntry = (dictionaryQuery.data ?? []).find((entry) => entry.id === selectedEntryId) ?? null;

  const setStatus = (status: WordStatus) => {
    if (!selectedEntry || statusMutation.isPending) return;
    statusMutation.mutate({ entryId: selectedEntry.id, status });
  };
  const handleLogout = async () => { await logout(); };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mx-auto w-full max-w-5xl gap-6">
          <AppHeader active="Biblioteca" user={user} onLogout={handleLogout} />
          <SectionHeading eyebrow="BIBLIOTECA" title="Suas palavras" description="Consulte o que você encontrou e acompanhe seu estado pessoal." />
          <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.searchGlyph, { color: colors.primary }]}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar hanzi, pinyin ou significado" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={[styles.searchInput, { color: colors.foreground }]} accessibilityLabel="Buscar hanzi, pinyin ou significado" />{query ? <AppButton label="Limpar" variant="quiet" onPress={() => setQuery("")} /> : null}</View>
          <View className="gap-2" accessibilityRole="tablist">
            <View className="flex-row gap-2"><TabButton label="Minhas palavras" selected={scope === "mine"} onPress={() => { setScope("mine"); setFilter("all"); }} /><TabButton label="Dicionário" selected={scope === "dictionary"} onPress={() => setScope("dictionary")} /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><TabButton label="Todas" selected={filter === "all"} onPress={() => setFilter("all")} /><TabButton label="Aprendendo" selected={filter === "learning"} onPress={() => setFilter("learning")} /><TabButton label="Conhecidas" selected={filter === "known"} onPress={() => setFilter("known")} /><TabButton label="Novas" selected={filter === "new"} onPress={() => setFilter("new")} /></ScrollView>
          </View>

          <View className="gap-3 md:flex-row">
            <View className="flex-1 gap-3"><View className="flex-row items-center justify-between"><Text className="text-xl font-bold text-foreground">{scope === "mine" ? "Meu vocabulário" : "Dicionário global"}</Text><Text className="text-sm text-muted">{entries.length} palavras</Text></View>{dictionaryQuery.isLoading ? <LibraryLoading /> : dictionaryQuery.error ? <AppCard className="gap-3"><Text className="font-semibold text-foreground">Dicionário indisponível</Text><Text className="text-sm leading-5 text-muted">{dictionaryQuery.error.message}</Text><AppButton label="Tentar novamente" onPress={() => void dictionaryQuery.refetch()} /></AppCard> : entries.length === 0 ? <AppCard tone="sand" className="gap-2"><Text className="font-semibold text-foreground">Nenhuma palavra encontrada</Text><Text className="text-sm leading-5 text-muted">Tente outro filtro ou conclua uma etapa para novas palavras entrarem no seu vocabulário.</Text></AppCard> : entries.map((entry) => <Pressable key={entry.id} onPress={() => setSelectedEntryId(entry.id)} accessibilityRole="button" accessibilityLabel={`${entry.hanzi}, ${entry.meaningPtBr}, ${STATUS_LABELS[entry.status]}`} className="w-full"><AppCard className={`flex-row items-center gap-4 ${selectedEntryId === entry.id ? "border-primary bg-primary/5" : ""}`}><View className="h-14 w-14 items-center justify-center rounded-2xl bg-sand"><Text className="text-2xl font-bold text-primary">{entry.hanzi}</Text></View><View className="flex-1 gap-1"><Text className="text-base font-bold text-foreground">{entry.meaningPtBr}</Text><Text className="text-sm text-primary">{entry.pinyin}</Text><Text className="text-xs text-muted">{STATUS_LABELS[entry.status]}</Text></View><Text className="text-xl text-muted">›</Text></AppCard></Pressable>)}</View>
            {selectedEntry ? <View className="md:w-[380px]"><WordDetailPanel entry={selectedEntry} onClose={() => setSelectedEntryId(null)} onStatus={setStatus} pending={statusMutation.isPending ? statusMutation.variables?.status : undefined} /></View> : null}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={`${label}${selected ? ", selecionado" : ""}`} className={`min-h-[44px] justify-center rounded-full border px-4 ${selected ? "border-foreground bg-foreground" : "border-border bg-surface"}`}><Text className={`font-bold ${selected ? "text-background" : "text-muted"}`}>{label}</Text></Pressable>;
}

function LibraryLoading() {
  return <View className="items-center gap-3 py-8"><ActivityIndicator /><Text className="text-sm text-muted">Carregando palavras…</Text></View>;
}

const styles = StyleSheet.create({ searchBox: { minHeight: 56, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, paddingLeft: 14, paddingRight: 6 }, searchGlyph: { fontSize: 26, lineHeight: 30, marginRight: 8 }, searchInput: { flex: 1, minHeight: 52, fontSize: 15 }, filters: { gap: 8, paddingRight: 8 } });
