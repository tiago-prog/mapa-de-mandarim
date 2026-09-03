import { Directory, File, Paths } from "expo-file-system";

const AUDIO_DIRECTORY_NAME = "audio";

function getAudioDirectory() {
  return new Directory(Paths.document, AUDIO_DIRECTORY_NAME);
}

function ensureAudioDirectory() {
  const directory = getAudioDirectory();
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  return directory;
}

export function getCachedAudioFile(textHash: string) {
  return new File(ensureAudioDirectory(), `${textHash}.mp3`);
}

export function getCachedAudioUri(textHash: string) {
  const file = getCachedAudioFile(textHash);
  return file.exists ? file.uri : null;
}

export async function cacheAudioFile(url: string, textHash: string) {
  const destination = getCachedAudioFile(textHash);
  if (destination.exists) return destination.uri;
  const downloaded = await File.downloadFileAsync(url, destination, { idempotent: true });
  return downloaded.uri;
}

export type PreloadAudioItem = { url: string; textHash: string };

export async function preloadAudioFiles(items: PreloadAudioItem[]) {
  const uniqueItems = Array.from(new Map(items.filter((item) => item.url && item.textHash).map((item) => [item.textHash, item])).values());
  const results = await Promise.all(uniqueItems.map(async (item) => {
    try {
      return { ...item, localUri: await cacheAudioFile(item.url, item.textHash), ok: true as const };
    } catch {
      return { ...item, localUri: null, ok: false as const };
    }
  }));
  return results;
}

export function collectAudioUrls(payload: unknown) {
  const items: PreloadAudioItem[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as Record<string, unknown>;
    const audioUrl = typeof record.audioUrl === "string" ? record.audioUrl : null;
    const audio = record.audio && typeof record.audio === "object" ? record.audio as Record<string, unknown> : null;
    const url = audioUrl ?? (audio && typeof audio.url === "string" ? audio.url : null);
    const textHash = typeof record.textHash === "string" ? record.textHash : audio && typeof audio.textHash === "string" ? audio.textHash : null;
    if (url && textHash) items.push({ url, textHash });
    Object.values(record).forEach(visit);
  };
  visit(payload);
  return items;
}
