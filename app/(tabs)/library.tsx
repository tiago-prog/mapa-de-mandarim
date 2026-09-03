import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

type WordFilter = "all" | "known" | "learning";

const STATUS_LABELS = {
  new: "Nova",
  known: "Conhecida",
  learning: "Em aprendizado",
} as const;

export default function LibraryScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WordFilter>("all");
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

  const entries = useMemo(() => dictionaryQuery.data ?? [], [dictionaryQuery.data]);
  const visibleEntries = useMemo(
    () => (filter === "all" ? entries : entries.filter((entry) => entry.status === filter)),
    [entries, filter],
  );
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? null;

  const setStatus = (status: "new" | "known" | "learning") => {
    if (!selectedEntry || statusMutation.isPending) return;
    statusMutation.mutate({ entryId: selectedEntry.id, status });
  };

  return (
    <ScreenContainer className="px-5 pt-3" edges={["top", "left", "right"]}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5">
          <View>
            <Text className="text-sm font-medium text-primary">BIBLIOTECA</Text>
            <Text className="mt-2 text-3xl font-bold leading-9 text-foreground">Suas palavras</Text>
            <Text className="mt-2 text-base leading-6 text-muted">Consulte o vocabulário da trilha e registre o que já faz parte de você.</Text>
          </View>

          <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.searchGlyph, { color: colors.primary }]}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar hanzi, pinyin ou significado"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.searchInput, { color: colors.foreground }]}
              accessibilityLabel="Buscar palavra"
            />
            {query ? <AppButton label="Limpar" variant="quiet" onPress={() => setQuery("")} /> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {([
              ["all", "Todas"],
              ["known", "Conhecidas"],
              ["learning", "Em aprendizado"],
            ] as const).map(([value, label]) => (
              <AppButton
                key={value}
                label={label}
                variant={filter === value ? "primary" : "secondary"}
                onPress={() => setFilter(value)}
              />
            ))}
          </ScrollView>

          {selectedEntry ? (
            <AppCard className="gap-4" tone="sand">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-5xl font-bold text-foreground">{selectedEntry.hanzi}</Text>
                  <Text className="mt-2 text-lg text-primary">{selectedEntry.pinyin}</Text>
                  <Text className="mt-1 text-base text-muted">{selectedEntry.meaningPtBr}</Text>
                </View>
                <AppButton label="Fechar" variant="quiet" onPress={() => setSelectedEntryId(null)} />
              </View>
              <View className="gap-2 border-t border-border pt-3">
                <Text className="text-xs font-semibold uppercase tracking-widest text-primary">EM CONTEXTO</Text>
                <Text className="text-xl font-bold text-foreground">{selectedEntry.exampleHanzi}</Text>
                <Text className="text-sm leading-5 text-muted">{selectedEntry.examplePtBr}</Text>
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Seu estado</Text>
                <View className="gap-2">
                  <AppButton label="Marcar como conhecida" variant={selectedEntry.status === "known" ? "primary" : "secondary"} loading={statusMutation.isPending && statusMutation.variables?.status === "known"} onPress={() => setStatus("known")} />
                  <AppButton label="Estou aprendendo" variant={selectedEntry.status === "learning" ? "primary" : "secondary"} loading={statusMutation.isPending && statusMutation.variables?.status === "learning"} onPress={() => setStatus("learning")} />
                  <AppButton label="Voltar para nova" variant={selectedEntry.status === "new" ? "primary" : "quiet"} loading={statusMutation.isPending && statusMutation.variables?.status === "new"} onPress={() => setStatus("new")} />
                </View>
              </View>
            </AppCard>
          ) : null}

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Vocabulário da trilha</Text>
              <Text className="text-sm text-muted">{visibleEntries.length} palavras</Text>
            </View>

            {dictionaryQuery.isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : dictionaryQuery.error ? (
              <AppCard className="gap-3">
                <Text className="font-semibold text-foreground">Dicionário indisponível</Text>
                <Text className="text-sm leading-5 text-muted">{dictionaryQuery.error.message}</Text>
                <AppButton label="Tentar novamente" onPress={() => void dictionaryQuery.refetch()} />
              </AppCard>
            ) : visibleEntries.length === 0 ? (
              <AppCard className="gap-2" tone="sand">
                <Text className="font-semibold text-foreground">Nenhuma palavra encontrada</Text>
                <Text className="text-sm leading-5 text-muted">Tente buscar por outro hanzi, pinyin ou significado.</Text>
              </AppCard>
            ) : (
              visibleEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => setSelectedEntryId(entry.id)}
                  style={({ pressed }) => [styles.entryPressable, { opacity: pressed ? 0.72 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.hanzi}, ${entry.meaningPtBr}, ${STATUS_LABELS[entry.status]}`}
                >
                  <AppCard className="flex-row items-center gap-4">
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Text className="text-2xl font-bold text-primary">{entry.hanzi}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{entry.meaningPtBr}</Text>
                      <Text className="mt-1 text-sm text-primary">{entry.pinyin}</Text>
                      <Text className="mt-1 text-xs text-muted">{STATUS_LABELS[entry.status]}</Text>
                    </View>
                    <Text className="text-xl text-muted">›</Text>
                  </AppCard>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
  },
  searchGlyph: {
    fontSize: 28,
    lineHeight: 30,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 15,
  },
  filters: {
    gap: 8,
    paddingRight: 8,
  },
  entryPressable: {
    width: "100%",
  },
});
