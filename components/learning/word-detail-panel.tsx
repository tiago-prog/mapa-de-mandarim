import { Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AudioButton } from "@/components/ui/audio-button";
import type { WordStatus } from "@/server/domain/vocabulary";

type Entry = { id: string; hanzi: string; pinyin: string; meaningPtBr: string; exampleHanzi: string; examplePtBr: string; status: WordStatus; audio?: { url?: string | null; textHash?: string | null } };

const statusLabel: Record<WordStatus, string> = { new: "Nova", learning: "Em aprendizado", known: "Conhecida" };

export function WordDetailPanel({ entry, onClose, onStatus, pending }: { entry: Entry; onClose: () => void; onStatus: (status: WordStatus) => void; pending?: WordStatus }) {
  return (
    <AppCard className="gap-5" tone="paper" accessible accessibilityLabel={`Ficha da palavra ${entry.hanzi}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-xs font-bold uppercase tracking-[1.5px] text-primary">FICHA DA PALAVRA</Text>
          <Text className="text-5xl font-bold text-foreground">{entry.hanzi}</Text>
          <Text className="text-lg font-bold text-primary">{entry.pinyin} · {entry.meaningPtBr}</Text>
          <View className="self-start rounded-full bg-primary/10 px-3 py-1"><Text className="text-xs font-bold text-primary">{statusLabel[entry.status]}</Text></View>
        </View>
        <AppButton label="Fechar" variant="quiet" onPress={onClose} accessibilityLabel={`Fechar ficha de ${entry.hanzi}`} />
      </View>
      <View className="gap-3 border-t border-border pt-4">
        <View className="flex-row items-center justify-between gap-3"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-muted">EXEMPLO</Text><AudioButton text={entry.exampleHanzi} compact /></View>
        <Text className="text-2xl font-bold text-foreground">{entry.exampleHanzi}</Text>
        <Text className="text-base leading-6 text-muted">{entry.examplePtBr}</Text>
      </View>
      <View className="gap-3 border-t border-border pt-4">
        <Text className="text-xs font-bold uppercase tracking-[1.5px] text-muted">SEU ESTADO</Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(statusLabel) as WordStatus[]).map((status) => <AppButton key={status} label={pending === status ? "Salvando…" : statusLabel[status]} variant={entry.status === status ? "primary" : "secondary"} loading={pending === status} onPress={() => onStatus(status)} />)}
        </View>
      </View>
    </AppCard>
  );
}
