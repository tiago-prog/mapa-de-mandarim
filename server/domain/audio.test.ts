import { describe, expect, it } from "vitest";
import { audioTextHash, validateLessonAudioImport } from "./audio";

describe("domínio de áudio", () => {
  it("gera o mesmo hash para espaços acidentais equivalentes", () => {
    const base = { text: "你 好！", language: "zh-CN", voice: "zh-CN-XiaoxiaoNeural", rate: 0.85, format: "mp3", generatorVersion: "v1" };
    expect(audioTextHash(base)).toBe(audioTextHash({ ...base, text: " 你   好！ " }));
  });

  it("muda o hash quando muda a voz ou a versão do gerador", () => {
    const base = { text: "你好", language: "zh-CN", voice: "zh-CN-XiaoxiaoNeural", rate: 0.85, format: "mp3", generatorVersion: "v1" };
    expect(audioTextHash(base)).not.toBe(audioTextHash({ ...base, voice: "zh-CN-YunxiNeural" }));
    expect(audioTextHash(base)).not.toBe(audioTextHash({ ...base, generatorVersion: "v2" }));
  });

  it("aplica defaults e valida uma lição com assets de áudio", () => {
    const result = validateLessonAudioImport({
      schemaVersion: 1,
      contentVersion: "2026.09.03",
      path: {
        id: "presentations",
        slug: "apresentacoes",
        title: "Apresentações",
        description: "Primeira trilha",
        nodes: [{
          id: "intro",
          title: "Dizer quem você é",
          audioAssets: [{ id: "intro-line", contentType: "dialogue_line", contentId: "intro-line", text: "你好！", audio: { source: "azure" } }],
        }],
      },
    });
    expect(result.path.status).toBe("draft");
    expect(result.path.nodes[0].audioAssets[0].audio.voice).toBe("zh-CN-XiaoxiaoNeural");
    expect(result.path.nodes[0].audioAssets[0].audio.rate).toBe(0.85);
  });

  it("rejeita versão de contrato desconhecida", () => {
    expect(() => validateLessonAudioImport({ schemaVersion: 2 })).toThrow();
  });
});
