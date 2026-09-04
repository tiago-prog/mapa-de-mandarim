import { describe, expect, it } from "vitest";
import { contentImportId, validateContentImport } from "./content-import";

const validDocument = {
  schemaVersion: 1,
  contentVersion: "2026.09.03",
  path: {
    id: "presentations",
    slug: "presentations",
    title: "Apresentações",
    description: "Trilha inicial",
    nodes: [{
      id: "intro",
      pathId: "presentations",
      title: "Dizer o nome",
      description: "Aprender a apresentar-se",
      objective: "Dizer o próprio nome",
      orderIndex: 0,
      lexicalEntries: [{ id: "ni-hao", hanzi: "你好", pinyin: "nǐ hǎo", meaningPtBr: "olá", exampleHanzi: "你好！", examplePtBr: "Olá!" }],
      steps: [
        { id: "intro-vocab", orderIndex: 0, kind: "vocabulary", title: "Vocabulário", description: "Palavras", content: { kind: "vocabulary", instruction: "Aprenda", entryIds: ["ni-hao"] } },
        { id: "intro-practice", orderIndex: 1, kind: "practice", title: "Prática", description: "Pratique", content: { kind: "practice", instruction: "Escolha", activityIds: ["intro-choice"] } },
      ],
      activities: [{ id: "intro-choice", type: "multiple_choice", orderIndex: 0, title: "Escolha", instruction: "Escolha", explanation: "Explicação", hint: "Dica", prompt: "你好", hanzi: "你好", pinyin: "nǐ hǎo", meaning: "olá", options: [{ id: "a", label: "olá" }], correctOptionId: "a", feedbackCorrect: "Certo", feedbackIncorrect: "Tente novamente" }],
      mission: null,
    }],
  },
};

describe("importação de conteúdo", () => {
  it("valida e aplica status draft por padrão", () => {
    const document = validateContentImport(validDocument);
    expect(document.path.status).toBe("draft");
    expect(document.path.nodes[0].steps).toHaveLength(2);
  });

  it("rejeita referências de palavras ou atividades inexistentes", () => {
    expect(() => validateContentImport({ ...validDocument, path: { ...validDocument.path, nodes: [{ ...validDocument.path.nodes[0], steps: [{ ...validDocument.path.nodes[0].steps[0], content: { kind: "vocabulary", instruction: "Aprenda", entryIds: ["missing"] } }] }] } })).toThrow(/palavra inexistente/);
    expect(() => validateContentImport({ ...validDocument, path: { ...validDocument.path, nodes: [{ ...validDocument.path.nodes[0], steps: [{ ...validDocument.path.nodes[0].steps[1], content: { kind: "practice", instruction: "Pratique", activityIds: ["missing"] } }] }] } })).toThrow(/atividade inexistente/);
  });

  it("gera um ID estável para a mesma trilha e versão", () => {
    expect(contentImportId("presentations", "2026.09.03")).toBe("import-presentations-2026-09-03");
  });

  it("rejeita atividade ligada a outro nó ou etapa", () => {
    const otherNode = {
      ...validDocument.path.nodes[0],
      id: "other",
      nodeId: undefined,
      pathId: "presentations",
      orderIndex: 1,
      steps: [{ ...validDocument.path.nodes[0].steps[0], id: "other-vocab" }],
      activities: [],
    };
    expect(() => validateContentImport({
      ...validDocument,
      path: {
        ...validDocument.path,
        nodes: [validDocument.path.nodes[0], { ...otherNode, steps: [{ ...otherNode.steps[0], content: { kind: "practice", instruction: "Pratique", activityIds: ["intro-choice"] } }] }],
      },
    })).toThrow(/outro nó ou etapa/);
  });

  it("rejeita resposta incompatível com o tipo da atividade", () => {
    expect(() => validateContentImport({
      ...validDocument,
      path: {
        ...validDocument.path,
        nodes: [{
          ...validDocument.path.nodes[0],
          activities: [{ ...validDocument.path.nodes[0].activities[0], correctOptionId: "missing" }],
        }],
      },
    })).toThrow(/opção correta existente/);
  });
});
