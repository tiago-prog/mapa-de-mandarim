import { createHash } from "node:crypto";
import { z } from "zod";

export const AUDIO_CONTENT_TYPES = ["lexical_entry", "example_sentence", "dialogue_line", "lesson_activity", "mission_step", "listening_prompt"] as const;
export type AudioContentType = (typeof AUDIO_CONTENT_TYPES)[number];

export const AUDIO_STATUSES = ["pending", "processing", "ready", "failed", "stale"] as const;
export type AudioAssetStatus = (typeof AUDIO_STATUSES)[number];

export const audioSpecSchema = z.object({
  required: z.boolean().default(false),
  source: z.enum(["azure", "uploaded", "tts", "none"]).default("none"),
  url: z.string().trim().url().nullable().default(null),
  language: z.string().trim().min(2).max(16).default("zh-CN"),
  voice: z.string().trim().min(1).max(128).default("zh-CN-XiaoxiaoNeural"),
  rate: z.number().min(0.5).max(2).default(0.85),
  format: z.string().trim().min(1).max(64).default("audio-24khz-48kbitrate-mono-mp3"),
  generatorVersion: z.string().trim().min(1).max(32).default("v1"),
});
export type AudioSpec = z.infer<typeof audioSpecSchema>;

export const audioAssetInputSchema = z.object({
  id: z.string().trim().min(1).max(64),
  contentType: z.enum(AUDIO_CONTENT_TYPES),
  contentId: z.string().trim().min(1).max(80),
  lexicalEntryId: z.string().trim().min(1).max(64).nullable().default(null),
  text: z.string().trim().min(1).max(6000),
  audio: audioSpecSchema,
});
export type AudioAssetInput = z.infer<typeof audioAssetInputSchema>;

export const lessonAudioImportSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().trim().min(1).max(64),
  path: z.object({
    id: z.string().trim().min(1).max(64),
    slug: z.string().trim().min(1).max(160),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1),
    status: z.enum(["draft", "review", "published", "archived"]).default("draft"),
    nodes: z.array(z.object({
      id: z.string().trim().min(1).max(64),
      title: z.string().trim().min(1).max(180),
      audio: audioSpecSchema.optional(),
      audioAssets: z.array(audioAssetInputSchema).default([]),
    })).min(1),
  }),
});
export type LessonAudioImport = z.infer<typeof lessonAudioImportSchema>;

export type AudioHashInput = Pick<AudioSpec, "language" | "voice" | "rate" | "format" | "generatorVersion"> & { text: string };

export function normalizeAudioText(text: string) {
  return text.trim().replace(/\s+/gu, " ");
}

export function audioTextHash(input: AudioHashInput) {
  const canonical = [
    normalizeAudioText(input.text),
    input.language,
    input.voice,
    input.rate.toFixed(2),
    input.format,
    input.generatorVersion,
  ].join("\u001f");
  return createHash("md5").update(canonical, "utf8").digest("hex");
}

export function validateLessonAudioImport(input: unknown) {
  return lessonAudioImportSchema.parse(input);
}
