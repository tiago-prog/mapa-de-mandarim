import { describe, expect, it } from "vitest";
import { buildSsml, getAudioAssetPlan, getAudioServiceConfig } from "./audio-service";

const input = {
  id: "hello-line",
  contentType: "dialogue_line" as const,
  contentId: "hello-line",
  lexicalEntryId: null,
  text: "你好！",
  audio: { source: "azure" as const, required: true, url: null, language: "zh-CN", voice: "zh-CN-XiaoxiaoNeural", rate: 0.85, format: "audio-24khz-48kbitrate-mono-mp3", generatorVersion: "v1" },
};

describe("serviço de áudio", () => {
  it("cria SSML escapado com velocidade relativa", () => {
    const ssml = buildSsml("你好 & <朋友>", "zh-CN", "zh-CN-XiaoxiaoNeural", 0.85);
    expect(ssml).toContain('rate="-15%"');
    expect(ssml).toContain("你好 &amp; &lt;朋友&gt;");
  });

  it("gera plano com hash e estado pending", () => {
    const plan = getAudioAssetPlan(input);
    expect(plan.status).toBe("pending");
    expect(plan.textHash).toHaveLength(32);
    expect(plan.contentType).toBe("dialogue_line");
  });

  it("exige chaves de Azure e URL de upload", () => {
    expect(() => getAudioServiceConfig({})).toThrow(/azureSpeechKey/);
    expect(getAudioServiceConfig({ AZURE_SPEECH_KEY: "key", AZURE_SPEECH_REGION: "brazilsouth", AUDIO_STORAGE_UPLOAD_URL_TEMPLATE: "https://storage.test/{hash}.mp3" }).azureSpeechRegion).toBe("brazilsouth");
  });
});
