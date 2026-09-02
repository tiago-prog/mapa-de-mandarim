export type LearningNodeStatus = "locked" | "available" | "in_progress" | "completed";

export type LearningPathSeed = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

export type LearningNodeSeed = {
  id: string;
  pathId: string;
  title: string;
  description: string;
  objective: string;
  orderIndex: number;
  prerequisiteNodeId: string | null;
};

export type LexicalEntrySeed = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaningPtBr: string;
  exampleHanzi: string;
  examplePtBr: string;
};

export type LessonActivitySeed = {
  id: string;
  nodeId: string;
  type: "multiple_choice";
  orderIndex: number;
  prompt: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
};

export type NodeProgressSnapshot = {
  nodeId: string;
  status: "in_progress" | "completed";
  progressPercent: number;
  completedAt: Date | null;
};

export type UserProgressSnapshot = {
  xp: number;
  streakDays: number;
  completedNodeCount: number;
};

export const MVP_PATH: LearningPathSeed = {
  id: "presentations",
  slug: "apresentacoes-e-informacoes-pessoais",
  title: "Apresentações e informações pessoais",
  description: "Construa as primeiras frases para dizer quem você é e conhecer outras pessoas.",
};

export const MVP_NODES: LearningNodeSeed[] = [
  {
    id: "intro",
    pathId: MVP_PATH.id,
    title: "Dizer quem você é",
    description: "Aprenda a se apresentar com uma frase curta e clara.",
    objective: "Dizer seu nome em mandarim.",
    orderIndex: 1,
    prerequisiteNodeId: null,
  },
  {
    id: "identity",
    pathId: MVP_PATH.id,
    title: "Pessoas e identidade",
    description: "Relacione pronomes e pessoas em frases simples.",
    objective: "Reconhecer quem está falando em uma apresentação.",
    orderIndex: 2,
    prerequisiteNodeId: "intro",
  },
  {
    id: "ask-name",
    pathId: MVP_PATH.id,
    title: "Perguntar o nome",
    description: "Aprenda a iniciar uma conversa perguntando o nome de alguém.",
    objective: "Perguntar o nome de outra pessoa.",
    orderIndex: 3,
    prerequisiteNodeId: "identity",
  },
  {
    id: "countries",
    pathId: MVP_PATH.id,
    title: "Países e nacionalidades",
    description: "Fale de onde você é e reconheça nacionalidades.",
    objective: "Informar sua origem em uma frase curta.",
    orderIndex: 4,
    prerequisiteNodeId: "ask-name",
  },
  {
    id: "dialogue",
    pathId: MVP_PATH.id,
    title: "Diálogo de apresentação",
    description: "Conecte as estruturas em uma conversa curta.",
    objective: "Completar um diálogo básico de apresentação.",
    orderIndex: 5,
    prerequisiteNodeId: "countries",
  },
];

export const MVP_LEXICAL_ENTRIES: LexicalEntrySeed[] = [
  {
    id: "wo-jiao",
    hanzi: "我叫",
    pinyin: "wǒ jiào",
    meaningPtBr: "eu me chamo",
    exampleHanzi: "我叫安娜。",
    examplePtBr: "Eu me chamo Ana.",
  },
  {
    id: "wo",
    hanzi: "我",
    pinyin: "wǒ",
    meaningPtBr: "eu; me; mim",
    exampleHanzi: "我是学生。",
    examplePtBr: "Eu sou estudante.",
  },
  {
    id: "ni",
    hanzi: "你",
    pinyin: "nǐ",
    meaningPtBr: "você",
    exampleHanzi: "你叫什么名字？",
    examplePtBr: "Como você se chama?",
  },
  {
    id: "jiao",
    hanzi: "叫",
    pinyin: "jiào",
    meaningPtBr: "chamar-se; chamar",
    exampleHanzi: "你叫什么名字？",
    examplePtBr: "Como você se chama?",
  },
  {
    id: "mingzi",
    hanzi: "名字",
    pinyin: "míngzi",
    meaningPtBr: "nome",
    exampleHanzi: "我的名字是李明。",
    examplePtBr: "Meu nome é Li Ming.",
  },
];

export const MVP_ACTIVITIES: LessonActivitySeed[] = [
  {
    id: "intro-recognize-meaning",
    nodeId: "intro",
    type: "multiple_choice",
    orderIndex: 1,
    prompt: "Qual é o significado de 我叫?",
    hanzi: "我叫",
    pinyin: "wǒ jiào",
    meaning: "eu me chamo",
    options: [
      { id: "eu-me-chamo", label: "Eu me chamo" },
      { id: "ate-logo", label: "Até logo" },
      { id: "obrigado", label: "Obrigado" },
    ],
    correctOptionId: "eu-me-chamo",
  },
  {
    id: "identity-recognize-pronoun",
    nodeId: "identity",
    type: "multiple_choice",
    orderIndex: 1,
    prompt: "Qual palavra significa “você”?",
    hanzi: "你",
    pinyin: "nǐ",
    meaning: "você",
    options: [
      { id: "voce", label: "Você" },
      { id: "eu", label: "Eu" },
      { id: "nome", label: "Nome" },
    ],
    correctOptionId: "voce",
  },
  {
    id: "ask-name-recognize-meaning",
    nodeId: "ask-name",
    type: "multiple_choice",
    orderIndex: 1,
    prompt: "O que significa 名字?",
    hanzi: "名字",
    pinyin: "míngzi",
    meaning: "nome",
    options: [
      { id: "nome", label: "Nome" },
      { id: "pais", label: "País" },
      { id: "pessoa", label: "Pessoa" },
    ],
    correctOptionId: "nome",
  },
  {
    id: "countries-recognize-pronoun",
    nodeId: "countries",
    type: "multiple_choice",
    orderIndex: 1,
    prompt: "Qual palavra significa “eu”?",
    hanzi: "我",
    pinyin: "wǒ",
    meaning: "eu",
    options: [
      { id: "eu", label: "Eu" },
      { id: "voce", label: "Você" },
      { id: "nome", label: "Nome" },
    ],
    correctOptionId: "eu",
  },
  {
    id: "dialogue-recognize-verb",
    nodeId: "dialogue",
    type: "multiple_choice",
    orderIndex: 1,
    prompt: "Qual é o significado de 叫?",
    hanzi: "叫",
    pinyin: "jiào",
    meaning: "chamar-se; chamar",
    options: [
      { id: "chamar", label: "Chamar-se / chamar" },
      { id: "estudar", label: "Estudar" },
      { id: "ouvir", label: "Ouvir" },
    ],
    correctOptionId: "chamar",
  },
];

export function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function isNodeUnlocked(
  node: LearningNodeSeed,
  progressByNodeId: ReadonlyMap<string, NodeProgressSnapshot>,
): boolean {
  if (!node.prerequisiteNodeId) return true;
  return progressByNodeId.get(node.prerequisiteNodeId)?.status === "completed";
}

export function getNodeStatus(
  node: LearningNodeSeed,
  progressByNodeId: ReadonlyMap<string, NodeProgressSnapshot>,
): LearningNodeStatus {
  const progress = progressByNodeId.get(node.id);
  if (progress?.status === "completed") return "completed";
  if (progress?.status === "in_progress") return "in_progress";
  return isNodeUnlocked(node, progressByNodeId) ? "available" : "locked";
}

export function getRecommendedNode(
  nodes: readonly LearningNodeSeed[],
  progressByNodeId: ReadonlyMap<string, NodeProgressSnapshot>,
): LearningNodeSeed {
  return (
    nodes.find((node) => {
      const status = getNodeStatus(node, progressByNodeId);
      return status === "in_progress" || status === "available";
    }) ?? nodes[nodes.length - 1]!
  );
}

export function applyActivityCompletion(
  nodeProgress: NodeProgressSnapshot | undefined,
  userProgress: UserProgressSnapshot,
  isCorrect: boolean,
  completedAt: Date,
): {
  nodeProgress: NodeProgressSnapshot;
  userProgress: UserProgressSnapshot;
  xpAwarded: number;
} {
  const wasCompleted = nodeProgress?.status === "completed";
  const nextNodeProgress: NodeProgressSnapshot = {
    nodeId: nodeProgress?.nodeId ?? "",
    status: wasCompleted || isCorrect ? "completed" : "in_progress",
    progressPercent: wasCompleted || isCorrect ? 100 : Math.max(nodeProgress?.progressPercent ?? 0, 35),
    completedAt: wasCompleted || isCorrect ? nodeProgress?.completedAt ?? completedAt : null,
  };
  const xpAwarded = isCorrect && !wasCompleted ? 40 : isCorrect ? 0 : wasCompleted ? 0 : 5;

  return {
    nodeProgress: nextNodeProgress,
    userProgress: {
      xp: userProgress.xp + xpAwarded,
      streakDays: userProgress.streakDays,
      completedNodeCount:
        userProgress.completedNodeCount + (isCorrect && !wasCompleted ? 1 : 0),
    },
    xpAwarded,
  };
}
