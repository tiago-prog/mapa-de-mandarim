import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { cacheAudioFile, getCachedAudioUri } from "@/lib/audio-cache";

type AudioButtonProps = {
  text: string;
  audioUrl?: string | null;
  textHash?: string | null;
  label?: string;
  rate?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AudioButton({ text, audioUrl, textHash, label = "Ouvir", rate = 0.85, compact = false, style }: AudioButtonProps) {
  const colors = useColors();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const remoteSource = useMemo(() => audioUrl?.trim() || null, [audioUrl]);
  const [cachedSource, setCachedSource] = useState<{ key: string; uri: string } | null>(null);
  const sourceKey = remoteSource && textHash ? `${remoteSource}:${textHash}` : null;
  const source = sourceKey && cachedSource?.key === sourceKey ? cachedSource.uri : remoteSource;
  const player = useAudioPlayer(source, { downloadFirst: true });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
    return () => { void Speech.stop(); };
  }, []);

  useEffect(() => {
    let active = true;
    if (!remoteSource || !textHash || !sourceKey) {
      return () => { active = false; };
    }
    void Promise.resolve(getCachedAudioUri(textHash)).then((cachedUri) => cachedUri ?? cacheAudioFile(remoteSource, textHash)).then((localUri) => {
      if (active) setCachedSource({ key: sourceKey, uri: localUri });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [remoteSource, sourceKey, textHash]);

  const play = () => {
    void Speech.stop();
    if (source) {
      player.play();
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined" && !window.speechSynthesis) return;
    setIsSpeaking(true);
    Speech.speak(text, { language: "zh-CN", rate, onDone: () => setIsSpeaking(false), onStopped: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) });
  };

  const stop = () => {
    if (source) player.pause();
    void Speech.stop();
    setIsSpeaking(false);
  };

  const active = source ? status.playing : isSpeaking;
  const loading = Boolean(source && !status.isLoaded && !status.error);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? `Parar áudio de ${text}` : `${label}: ${text}`}
      accessibilityState={{ busy: loading }}
      onPress={active ? stop : play}
      style={({ pressed }) => [styles.button, compact && styles.compact, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.72 : 1 }, style]}
    >
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name={active ? "stop" : "volume-high"} size={17} color={colors.primary} />}
      {!compact ? <Text style={[styles.label, { color: colors.primary }]}>{active ? "Parar" : label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12 },
  compact: { width: 42, minHeight: 42, paddingHorizontal: 0 },
  label: { fontSize: 13, fontWeight: "700" },
});
