import type { AudioSpec } from "./audio";

export type LearningNodeStatus = "locked" | "available" | "in_progress" | "completed";

export type LessonStepKind =
  | "objective"
  | "context"
  | "vocabulary"
  | "grammar"
  | "practice"
  | "application"
  | "review";

export type LessonActivityType = "multiple_choice" | "word_order" | "context_choice" | "fill_blank";

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
  audio?: AudioSpec;
};

type LessonContent =
  | {
      kind: "objective";
      objective: string;
      successCriteria: string[];
      estimatedMinutes: number;
    }
  | {
      kind: "context";
      instruction: string;
      lines: Array<{ speaker: string; hanzi: string; pinyin: string; translation: string; audio?: AudioSpec }>;
    }
  | {
      kind: "vocabulary";
      instruction: string;
      entryIds: string[];
    }
  | {
      kind: "grammar";
      instruction: string;
      patterns: Array<{ pattern: string; explanation: string; exampleHanzi: string; examplePtBr: string; audio?: AudioSpec }>;
    }
  | {
      kind: "practice" | "application";
      instruction: string;
      activityIds: string[];
    }
  | {
      kind: "review";
      takeaways: string[];
      nextStep: string;
    };

export type LearningNodeStepSeed = {
  id: string;
  nodeId: string;
  orderIndex: number;
  kind: LessonStepKind;
  title: string;
  description: string;
  content: LessonContent;
};

export type LessonActivitySeed = {
  id: string;
  nodeId: string;
  stepId: string;
  type: LessonActivityType;
  orderIndex: number;
  title: string;
  instruction: string;
  explanation: string;
  hint: string;
  prompt: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string | null;
  tokens: string[];
  correctOrder: string[];
  expectedAnswer: string | null;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  audio?: AudioSpec;
};

export type PublicLessonActivity = Omit<LessonActivitySeed, "correctOptionId" | "correctOrder" | "expectedAnswer">;

export type NodeProgressSnapshot = {
  nodeId: string;
  status: "in_progress" | "completed";
  progressPercent: number;
  completedActivityIds: string[];
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
    objective: "Dizer seu nome e responder a uma apresentação em mandarim.",
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
    objective: "Perguntar o nome de outra pessoa com naturalidade.",
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
    id: "nihao",
    hanzi: "你好",
    pinyin: "nǐ hǎo",
    meaningPtBr: "olá",
    exampleHanzi: "你好！很高兴认识你。",
    examplePtBr: "Olá! Prazer em conhecer você.",
  },
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
    id: "shenme",
    hanzi: "什么",
    pinyin: "shénme",
    meaningPtBr: "o que; qual",
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
  {
    id: "shi",
    hanzi: "是",
    pinyin: "shì",
    meaningPtBr: "ser; estar",
    exampleHanzi: "我是学生。",
    examplePtBr: "Eu sou estudante.",
  },
  {
    id: "xuesheng",
    hanzi: "学生",
    pinyin: "xuéshēng",
    meaningPtBr: "estudante",
    exampleHanzi: "我是学生。",
    examplePtBr: "Eu sou estudante.",
  },
  {
    id: "laizi",
    hanzi: "来自",
    pinyin: "láizì",
    meaningPtBr: "vir de; ser de",
    exampleHanzi: "我来自巴西。",
    examplePtBr: "Eu sou do Brasil.",
  },
  {
    id: "baxi",
    hanzi: "巴西",
    pinyin: "Bāxī",
    meaningPtBr: "Brasil",
    exampleHanzi: "我来自巴西。",
    examplePtBr: "Eu sou do Brasil.",
  },
];

const COMMON_CONTEXT = {
  intro: [
    { speaker: "Ana", hanzi: "你好！我叫安娜。", pinyin: "Nǐ hǎo! Wǒ jiào Ānnà.", translation: "Olá! Eu me chamo Ana." },
    { speaker: "Li Ming", hanzi: "你好！你叫什么名字？", pinyin: "Nǐ hǎo! Nǐ jiào shénme míngzi?", translation: "Olá! Como você se chama?" },
    { speaker: "Ana", hanzi: "我叫安娜。", pinyin: "Wǒ jiào Ānnà.", translation: "Eu me chamo Ana." },
  ],
  identity: [
    { speaker: "Ana", hanzi: "我是安娜。", pinyin: "Wǒ shì Ānnà.", translation: "Eu sou Ana." },
    { speaker: "Li Ming", hanzi: "你是学生吗？", pinyin: "Nǐ shì xuéshēng ma?", translation: "Você é estudante?" },
  ],
  "ask-name": [
    { speaker: "Ana", hanzi: "你好！", pinyin: "Nǐ hǎo!", translation: "Olá!" },
    { speaker: "Li Ming", hanzi: "你叫什么名字？", pinyin: "Nǐ jiào shénme míngzi?", translation: "Como você se chama?" },
  ],
  countries: [
    { speaker: "Ana", hanzi: "我来自巴西。", pinyin: "Wǒ láizì Bāxī.", translation: "Eu sou do Brasil." },
    { speaker: "Li Ming", hanzi: "你是哪国人？", pinyin: "Nǐ shì nǎ guó rén?", translation: "De que país você é?" },
  ],
  dialogue: [
    { speaker: "Ana", hanzi: "你好！我叫安娜。", pinyin: "Nǐ hǎo! Wǒ jiào Ānnà.", translation: "Olá! Eu me chamo Ana." },
    { speaker: "Li Ming", hanzi: "你好！你叫什么名字？", pinyin: "Nǐ hǎo! Nǐ jiào shénme míngzi?", translation: "Olá! Como você se chama?" },
    { speaker: "Ana", hanzi: "我来自巴西。", pinyin: "Wǒ láizì Bāxī.", translation: "Eu sou do Brasil." },
  ],
} as const;

const VOCABULARY_BY_NODE: Record<string, string[]> = {
  intro: ["nihao", "wo-jiao", "wo", "ni", "shenme", "jiao", "mingzi"],
  identity: ["wo", "ni", "shi", "xuesheng"],
  "ask-name": ["ni", "shenme", "jiao", "mingzi"],
  countries: ["wo", "laizi", "baxi"],
  dialogue: ["nihao", "wo-jiao", "ni", "shenme", "mingzi", "laizi", "baxi"],
};

const GRAMMAR_BY_NODE: Record<string, Array<{ pattern: string; explanation: string; exampleHanzi: string; examplePtBr: string }>> = {
  intro: [{ pattern: "我叫 + nome", explanation: "Use 我叫 antes do seu nome para dizer “eu me chamo...”.", exampleHanzi: "我叫安娜。", examplePtBr: "Eu me chamo Ana." }],
  identity: [{ pattern: "我 / 你", explanation: "我 indica a pessoa que fala; 你 indica a pessoa com quem falamos.", exampleHanzi: "我是学生。", examplePtBr: "Eu sou estudante." }],
  "ask-name": [{ pattern: "你叫什么名字？", explanation: "A estrutura pergunta literalmente por qual nome você é chamado.", exampleHanzi: "你叫什么名字？", examplePtBr: "Como você se chama?" }],
  countries: [{ pattern: "我来自 + lugar", explanation: "来自 introduz o lugar de onde a pessoa vem.", exampleHanzi: "我来自巴西。", examplePtBr: "Eu sou do Brasil." }],
  dialogue: [{ pattern: "你好 → 我叫... → 你叫什么名字？", explanation: "Uma conversa começa com saudação, apresentação e uma pergunta de retorno.", exampleHanzi: "你好！我叫安娜。", examplePtBr: "Olá! Eu me chamo Ana." }],
};

export const MVP_STEPS: LearningNodeStepSeed[] = MVP_NODES.flatMap((node) => {
  const context = COMMON_CONTEXT[node.id as keyof typeof COMMON_CONTEXT] ?? [];
  const vocabulary = VOCABULARY_BY_NODE[node.id] ?? [];
  const grammar = GRAMMAR_BY_NODE[node.id] ?? [];
  return [
    {
      id: `${node.id}-objective`,
      nodeId: node.id,
      orderIndex: 1,
      kind: "objective" as const,
      title: "O que você vai conseguir fazer",
      description: "Entenda o objetivo antes de começar a praticar.",
      content: {
        kind: "objective" as const,
        objective: node.objective,
        successCriteria: ["Reconhecer as estruturas principais", "Usar uma frase em contexto", "Concluir uma aplicação guiada"],
        estimatedMinutes: node.id === "intro" ? 8 : 5,
      },
    },
    {
      id: `${node.id}-context`,
      nodeId: node.id,
      orderIndex: 2,
      kind: "context" as const,
      title: "Veja isso em uma conversa",
      description: "Observe como a estrutura aparece antes de estudá-la isoladamente.",
      content: { kind: "context" as const, instruction: "Leia a situação e tente entender a intenção antes de revelar a tradução.", lines: [...context] },
    },
    {
      id: `${node.id}-vocabulary`,
      nodeId: node.id,
      orderIndex: 3,
      kind: "vocabulary" as const,
      title: "Palavras essenciais",
      description: "Conheça as palavras que sustentam este objetivo comunicativo.",
      content: { kind: "vocabulary" as const, instruction: "Use as palavras como blocos para construir a frase.", entryIds: vocabulary },
    },
    {
      id: `${node.id}-grammar`,
      nodeId: node.id,
      orderIndex: 4,
      kind: "grammar" as const,
      title: "Como a frase funciona",
      description: "Uma explicação curta para você montar frases, não apenas memorizar traduções.",
      content: { kind: "grammar" as const, instruction: "Observe a ordem das palavras e a intenção da estrutura.", patterns: grammar },
    },
    {
      id: `${node.id}-practice`,
      nodeId: node.id,
      orderIndex: 5,
      kind: "practice" as const,
      title: "Prática guiada",
      description: "Recupere o conteúdo com ajuda e feedback imediato.",
      content: { kind: "practice" as const, instruction: "Responda sem consultar a tradução. Você poderá tentar novamente.", activityIds: [] },
    },
    {
      id: `${node.id}-application`,
      nodeId: node.id,
      orderIndex: 6,
      kind: "application" as const,
      title: node.id === "dialogue" ? "Missão final · diálogo completo" : "Use em contexto",
      description: node.id === "dialogue" ? "Conduza uma apresentação curta do início ao fim." : "Aplique o que aprendeu em uma situação próxima da vida real.",
      content: { kind: "application" as const, instruction: node.id === "dialogue" ? "Escolha cada fala para completar o diálogo sem perder a intenção da conversa." : "Escolha ou monte a resposta que mantém a intenção da conversa.", activityIds: [] },
    },
    {
      id: `${node.id}-review`,
      nodeId: node.id,
      orderIndex: 7,
      kind: "review" as const,
      title: "Fechamento da etapa",
      description: "Revise o que foi construído e saiba qual será o próximo passo.",
      content: { kind: "review" as const, takeaways: [node.objective, "A compreensão vem antes da velocidade.", "As palavras voltarão em revisões futuras."], nextStep: "Continue para a próxima etapa quando conseguir reconhecer a estrutura sem consultar a resposta." },
    },
  ];
});

export const MVP_ACTIVITIES: LessonActivitySeed[] = [
  {
    id: "intro-practice-meaning",
    nodeId: "intro",
    stepId: "intro-practice",
    type: "multiple_choice",
    orderIndex: 1,
    title: "Reconheça a expressão",
    instruction: "Agora recupere o significado sem olhar para a tradução.",
    explanation: "我叫 combina 我 (eu) e 叫 (chamar-se). Juntas, as palavras formam uma apresentação.",
    hint: "Pense na frase que Ana usou para dizer o próprio nome.",
    prompt: "Qual é o significado de 我叫?",
    hanzi: "我叫",
    pinyin: "wǒ jiào",
    meaning: "eu me chamo",
    options: [{ id: "eu-me-chamo", label: "Eu me chamo" }, { id: "ate-logo", label: "Até logo" }, { id: "obrigado", label: "Obrigado" }],
    correctOptionId: "eu-me-chamo",
    tokens: [],
    correctOrder: [],
    expectedAnswer: null,
    feedbackCorrect: "Você identificou a intenção comunicativa da expressão.",
    feedbackIncorrect: "Observe a conversa novamente: a pessoa usa 我叫 para dizer o próprio nome.",
  },
  {
    id: "intro-practice-order",
    nodeId: "intro",
    stepId: "intro-practice",
    type: "word_order",
    orderIndex: 2,
    title: "Monte sua apresentação",
    instruction: "Organize as palavras para dizer “Eu me chamo Ana”.",
    explanation: "Em mandarim, a estrutura começa com 我叫 e termina com o nome da pessoa.",
    hint: "Comece por 我, depois use 叫.",
    prompt: "Monte a frase",
    hanzi: "",
    pinyin: "",
    meaning: "Eu me chamo Ana.",
    options: [],
    correctOptionId: null,
    tokens: ["安娜", "叫", "我"],
    correctOrder: ["我", "叫", "安娜"],
    expectedAnswer: "我叫安娜。",
    feedbackCorrect: "A ordem está certa: sujeito + 叫 + nome.",
    feedbackIncorrect: "A estrutura começa com 我叫 e termina com o nome.",
  },
  {
    id: "intro-application-context",
    nodeId: "intro",
    stepId: "intro-application",
    type: "context_choice",
    orderIndex: 1,
    title: "Escolha sua resposta",
    instruction: "Alguém acabou de perguntar seu nome. Qual resposta faz sentido?",
    explanation: "Uma boa resposta retoma a intenção da pergunta e apresenta o seu nome.",
    hint: "Use a estrutura que você acabou de montar.",
    prompt: "你叫什么名字？",
    hanzi: "你叫什么名字？",
    pinyin: "nǐ jiào shénme míngzi?",
    meaning: "Como você se chama?",
    options: [{ id: "answer-name", label: "我叫安娜。" }, { id: "answer-greeting", label: "你好！" }, { id: "answer-thanks", label: "谢谢。" }],
    correctOptionId: "answer-name",
    tokens: [],
    correctOrder: [],
    expectedAnswer: "我叫安娜。",
    feedbackCorrect: "Você respondeu à pergunta com uma apresentação completa.",
    feedbackIncorrect: "A pergunta pede seu nome. Responda usando 我叫 + nome.",
  },
  {
    id: "identity-practice-meaning",
    nodeId: "identity",
    stepId: "identity-practice",
    type: "multiple_choice",
    orderIndex: 1,
    title: "Identifique quem fala",
    instruction: "Qual palavra indica “você”?",
    explanation: "你 aponta para a pessoa com quem estamos falando.",
    hint: "É a palavra usada para chamar a outra pessoa.",
    prompt: "Qual palavra significa “você”?",
    hanzi: "你",
    pinyin: "nǐ",
    meaning: "você",
    options: [{ id: "voce", label: "Você" }, { id: "eu", label: "Eu" }, { id: "nome", label: "Nome" }],
    correctOptionId: "voce",
    tokens: [], correctOrder: [], expectedAnswer: null,
    feedbackCorrect: "Você distinguiu a pessoa que fala da pessoa ouvida.",
    feedbackIncorrect: "我 significa “eu”; 你 significa “você”.",
  },
  {
    id: "ask-name-practice-meaning",
    nodeId: "ask-name",
    stepId: "ask-name-practice",
    type: "multiple_choice",
    orderIndex: 1,
    title: "Encontre a palavra-chave",
    instruction: "Qual palavra completa a ideia de nome?",
    explanation: "名字 é a palavra que nomeia o nome de uma pessoa.",
    hint: "A expressão aparece no final de 你叫什么名字？",
    prompt: "O que significa 名字?",
    hanzi: "名字",
    pinyin: "míngzi",
    meaning: "nome",
    options: [{ id: "nome", label: "Nome" }, { id: "pais", label: "País" }, { id: "pessoa", label: "Pessoa" }],
    correctOptionId: "nome",
    tokens: [], correctOrder: [], expectedAnswer: null,
    feedbackCorrect: "Você encontrou a palavra central da pergunta.",
    feedbackIncorrect: "名字 significa “nome”; a expressão inteira pergunta como alguém se chama.",
  },
  {
    id: "ask-name-practice-fill",
    nodeId: "ask-name",
    stepId: "ask-name-practice",
    type: "fill_blank",
    orderIndex: 2,
    title: "Complete a pergunta",
    instruction: "Digite os caracteres que faltam para perguntar o nome de alguém.",
    explanation: "你叫什么名字？ usa 什么 para perguntar “o que/qual” e 名字 para nome.",
    hint: "A frase começa com 你叫 e termina com 名字？",
    prompt: "你叫____名字？",
    hanzi: "你叫____名字？",
    pinyin: "nǐ jiào ____ míngzi?",
    meaning: "Como você se chama?",
    options: [],
    correctOptionId: null,
    tokens: [],
    correctOrder: [],
    expectedAnswer: "什么",
    feedbackCorrect: "Perfeito: 什么 completa a pergunta 你叫什么名字？.",
    feedbackIncorrect: "A palavra que falta é 什么 (shénme), usada para perguntar “o que/qual”.",
  },
  {
    id: "countries-practice-meaning",
    nodeId: "countries",
    stepId: "countries-practice",
    type: "multiple_choice",
    orderIndex: 1,
    title: "Reconheça o sujeito",
    instruction: "Qual palavra significa “eu”?",
    explanation: "我 é o pronome usado pela pessoa que fala.",
    hint: "É o primeiro caractere de 我叫.",
    prompt: "Qual palavra significa “eu”?",
    hanzi: "我",
    pinyin: "wǒ",
    meaning: "eu",
    options: [{ id: "eu", label: "Eu" }, { id: "voce", label: "Você" }, { id: "nome", label: "Nome" }],
    correctOptionId: "eu",
    tokens: [], correctOrder: [], expectedAnswer: null,
    feedbackCorrect: "Você reconheceu o ponto de vista de quem fala.",
    feedbackIncorrect: "我 significa “eu”; 你 significa “você”.",
  },
  {
    id: "dialogue-practice-meaning",
    nodeId: "dialogue",
    stepId: "dialogue-practice",
    type: "multiple_choice",
    orderIndex: 1,
    title: "Conecte a conversa",
    instruction: "Qual é o sentido de 叫 nesta conversa?",
    explanation: "叫 pode significar chamar ou chamar-se, dependendo da estrutura.",
    hint: "Em 我叫, a expressão fala do nome da pessoa.",
    prompt: "Qual é o significado de 叫?",
    hanzi: "叫",
    pinyin: "jiào",
    meaning: "chamar-se; chamar",
    options: [{ id: "chamar", label: "Chamar-se / chamar" }, { id: "estudar", label: "Estudar" }, { id: "ouvir", label: "Ouvir" }],
    correctOptionId: "chamar",
    tokens: [], correctOrder: [], expectedAnswer: null,
    feedbackCorrect: "Você conectou o verbo ao contexto da apresentação.",
    feedbackIncorrect: "Neste contexto, 叫 participa da estrutura para dizer o nome.",
  },
  {
    id: "dialogue-application-greeting",
    nodeId: "dialogue",
    stepId: "dialogue-application",
    type: "context_choice",
    orderIndex: 1,
    title: "Missão · comece a conversa",
    instruction: "Você encontrou Li Ming pela primeira vez. Escolha a primeira fala do diálogo.",
    explanation: "Uma apresentação começa com uma saudação simples antes de dizer o nome.",
    hint: "Cumprimente a pessoa antes de se apresentar.",
    prompt: "Li Ming: 你好！",
    hanzi: "你好！",
    pinyin: "nǐ hǎo!",
    meaning: "Olá!",
    options: [{ id: "mission-greeting", label: "你好！" }, { id: "mission-name", label: "我叫安娜。" }, { id: "mission-country", label: "我来自巴西。" }],
    correctOptionId: "mission-greeting",
    tokens: [],
    correctOrder: [],
    expectedAnswer: "你好！",
    feedbackCorrect: "Boa abertura. Agora a conversa pode avançar para a apresentação.",
    feedbackIncorrect: "Comece com uma saudação: 你好！ (Olá!).",
  },
  {
    id: "dialogue-application-name",
    nodeId: "dialogue",
    stepId: "dialogue-application",
    type: "context_choice",
    orderIndex: 2,
    title: "Missão · diga seu nome",
    instruction: "Depois da saudação, apresente-se usando seu nome.",
    explanation: "我叫 + nome é a forma direta de dizer “eu me chamo...”.",
    hint: "Use 我叫 antes do nome Ana.",
    prompt: "Você: ____",
    hanzi: "我叫安娜。",
    pinyin: "wǒ jiào Ānnà.",
    meaning: "Eu me chamo Ana.",
    options: [{ id: "mission-name", label: "我叫安娜。" }, { id: "mission-greeting", label: "你好！" }, { id: "mission-question", label: "你叫什么名字？" }],
    correctOptionId: "mission-name",
    tokens: [],
    correctOrder: [],
    expectedAnswer: "我叫安娜。",
    feedbackCorrect: "Perfeito. Você se apresentou com clareza.",
    feedbackIncorrect: "Para dizer seu nome, escolha 我叫安娜。 (Eu me chamo Ana.).",
  },
  {
    id: "dialogue-application-question",
    nodeId: "dialogue",
    stepId: "dialogue-application",
    type: "context_choice",
    orderIndex: 3,
    title: "Missão · devolva a pergunta",
    instruction: "Finalize o diálogo perguntando o nome da outra pessoa.",
    explanation: "你叫什么名字？ retoma a conversa e pergunta naturalmente o nome do interlocutor.",
    hint: "A pergunta começa com 你叫 e termina com 名字？",
    prompt: "Você: 我叫安娜。你____？",
    hanzi: "我叫安娜。你叫什么名字？",
    pinyin: "wǒ jiào Ānnà. nǐ jiào shénme míngzi?",
    meaning: "Eu me chamo Ana. Como você se chama?",
    options: [{ id: "mission-question", label: "叫什么名字？" }, { id: "mission-greeting", label: "你好！" }, { id: "mission-country", label: "我来自巴西。" }],
    correctOptionId: "mission-question",
    tokens: [],
    correctOrder: [],
    expectedAnswer: "你叫什么名字？",
    feedbackCorrect: "Missão concluída. Você abriu, conduziu e manteve um diálogo de apresentação.",
    feedbackIncorrect: "Devolva a pergunta com 你叫什么名字？ (Como você se chama?).",
  },
];

const activityIdsByStep = new Map<string, string[]>();
for (const activity of MVP_ACTIVITIES) {
  const current = activityIdsByStep.get(activity.stepId) ?? [];
  current.push(activity.id);
  activityIdsByStep.set(activity.stepId, current);
}

export const MVP_LESSON_STEPS: LearningNodeStepSeed[] = MVP_STEPS.map((step) => {
  if (step.content.kind !== "practice" && step.content.kind !== "application") return step;
  return {
    ...step,
    content: { ...step.content, activityIds: activityIdsByStep.get(step.id) ?? [] },
  };
});

export function getLexicalEntryIdsForNode(nodeId: string): string[] {
  return [
    ...new Set(
      MVP_LESSON_STEPS
        .filter((step) => step.nodeId === nodeId && step.content.kind === "vocabulary")
        .flatMap((step) => (step.content.kind === "vocabulary" ? step.content.entryIds : [])),
    ),
  ];
}

export function toPublicActivity(activity: LessonActivitySeed): PublicLessonActivity {
  const { correctOptionId: _correctOptionId, correctOrder: _correctOrder, expectedAnswer: _expectedAnswer, ...publicActivity } = activity;
  return publicActivity;
}

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
  return nodes.find((node) => {
    const status = getNodeStatus(node, progressByNodeId);
    return status === "in_progress" || status === "available";
  }) ?? nodes[nodes.length - 1]!;
}

export function applyActivityCompletion(
  nodeProgress: NodeProgressSnapshot | undefined,
  activityId: string,
  userProgress: UserProgressSnapshot,
  isCorrect: boolean,
  completedAt: Date,
  totalActivityCount: number,
): {
  nodeProgress: NodeProgressSnapshot;
  userProgress: UserProgressSnapshot;
  xpAwarded: number;
} {
  const previousCompletedActivityIds = nodeProgress?.completedActivityIds ?? [];
  const alreadyCompleted = previousCompletedActivityIds.includes(activityId);
  const completedActivityIds = isCorrect && !alreadyCompleted
    ? [...previousCompletedActivityIds, activityId]
    : previousCompletedActivityIds;
  const wasCompleted = nodeProgress?.status === "completed";
  const shouldComplete = totalActivityCount > 0 && completedActivityIds.length >= totalActivityCount;
  const progressPercent = shouldComplete
    ? 100
    : clampProgress((completedActivityIds.length / Math.max(totalActivityCount, 1)) * 100);
  const nextNodeProgress: NodeProgressSnapshot = {
    nodeId: nodeProgress?.nodeId ?? "",
    status: shouldComplete || wasCompleted ? "completed" : "in_progress",
    progressPercent: shouldComplete || wasCompleted ? 100 : progressPercent,
    completedActivityIds,
    completedAt: shouldComplete || wasCompleted ? nodeProgress?.completedAt ?? completedAt : null,
  };
  const xpAwarded = isCorrect && !alreadyCompleted ? 15 : 0;

  return {
    nodeProgress: nextNodeProgress,
    userProgress: {
      xp: userProgress.xp + xpAwarded,
      streakDays: userProgress.streakDays,
      completedNodeCount: userProgress.completedNodeCount + (shouldComplete && !wasCompleted ? 1 : 0),
    },
    xpAwarded,
  };
}
