import { audioTextHash, type AudioAssetInput } from "./domain/audio";

export type AudioServiceConfig = {
  azureSpeechKey: string;
  azureSpeechRegion: string;
  storageUploadUrlTemplate: string;
  storagePublicUrlTemplate: string;
};

export type GeneratedAudioAsset = {
  textHash: string;
  language: string;
  voice: string;
  rate: number;
  format: string;
  generatorVersion: string;
  storageKey: string;
  publicUrl: string | null;
  durationMs: number | null;
  fileSizeBytes: number;
  status: "ready";
};

export function getAudioServiceConfig(env: Record<string, string | undefined> = process.env): AudioServiceConfig {
  const config = {
    azureSpeechKey: env.AZURE_SPEECH_KEY ?? "",
    azureSpeechRegion: env.AZURE_SPEECH_REGION ?? "",
    storageUploadUrlTemplate: env.AUDIO_STORAGE_UPLOAD_URL_TEMPLATE ?? "",
    storagePublicUrlTemplate: env.AUDIO_STORAGE_PUBLIC_URL_TEMPLATE ?? "",
  };
  const missing = Object.entries(config).filter(([key, value]) => key !== "storagePublicUrlTemplate" && !value).map(([key]) => key);
  if (missing.length) throw new Error(`Configuração de áudio ausente: ${missing.join(", ")}`);
  return config;
}

export function buildSsml(text: string, language: string, voice: string, rate: number) {
  const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const relativeRate = `${Math.round((rate - 1) * 100)}%`;
  return `<speak version="1.0" xml:lang="${language}"><voice name="${voice}"><prosody rate="${relativeRate}">${escapedText}</prosody></voice></speak>`;
}

function resolveUploadUrl(template: string, textHash: string) {
  return template.replaceAll("{hash}", textHash);
}

export function getAudioAssetPlan(input: AudioAssetInput) {
  const { audio } = input;
  const textHash = audioTextHash({ text: input.text, ...audio });
  return {
    id: input.id,
    contentType: input.contentType,
    contentId: input.contentId,
    lexicalEntryId: input.lexicalEntryId,
    textHash,
    language: audio.language,
    voice: audio.voice,
    rate: audio.rate,
    format: audio.format,
    generatorVersion: audio.generatorVersion,
    status: "pending" as const,
  };
}

export async function generateAndUploadAudio(input: AudioAssetInput, config = getAudioServiceConfig()): Promise<GeneratedAudioAsset> {
  const plan = getAudioAssetPlan(input);
  const endpoint = `https://${config.azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": config.azureSpeechKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": input.audio.format,
      "User-Agent": "mapa-de-mandarim-audio-service/1.0",
    },
    body: buildSsml(input.text, input.audio.language, input.audio.voice, input.audio.rate),
  });
  if (!response.ok) throw new Error(`Azure Speech falhou (${response.status})`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  const uploadUrl = resolveUploadUrl(config.storageUploadUrlTemplate, plan.textHash);
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "audio/mpeg", "Content-Length": String(bytes.byteLength) },
    body: bytes,
  });
  if (!uploadResponse.ok) throw new Error(`Upload de áudio falhou (${uploadResponse.status})`);

  return {
    textHash: plan.textHash,
    language: plan.language,
    voice: plan.voice,
    rate: plan.rate,
    format: plan.format,
    generatorVersion: plan.generatorVersion,
    storageKey: `${plan.textHash}.mp3`,
    publicUrl: config.storagePublicUrlTemplate ? resolveUploadUrl(config.storagePublicUrlTemplate, plan.textHash) : uploadResponse.headers.get("x-public-url"),
    durationMs: null,
    fileSizeBytes: bytes.byteLength,
    status: "ready",
  };
}
