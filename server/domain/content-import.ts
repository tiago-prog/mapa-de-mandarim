import { z } from "zod";
import { audioAssetInputSchema, audioSpecSchema } from "./audio";

const contentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("objective"), objective: z.string().min(1), successCriteria: z.array(z.string().min(1)).min(1), estimatedMinutes: z.number().int().positive() }),
  z.object({ kind: z.literal("context"), instruction: z.string().min(1), lines: z.array(z.object({ speaker: z.string().min(1), hanzi: z.string().min(1), pinyin: z.string().min(1), translation: z.string().min(1), audio: audioSpecSchema.optional() })).min(1) }),
  z.object({ kind: z.literal("vocabulary"), instruction: z.string().min(1), entryIds: z.array(z.string().min(1)).min(1) }),
  z.object({ kind: z.literal("grammar"), instruction: z.string().min(1), patterns: z.array(z.object({ pattern: z.string().min(1), explanation: z.string().min(1), exampleHanzi: z.string().min(1), examplePtBr: z.string().min(1), audio: audioSpecSchema.optional() })).min(1) }),
  z.object({ kind: z.enum(["practice", "application"]), instruction: z.string().min(1), activityIds: z.array(z.string().min(1)).min(1) }),
  z.object({ kind: z.literal("review"), takeaways: z.array(z.string().min(1)).min(1), nextStep: z.string().min(1) }),
]);

const activitySchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["multiple_choice", "word_order", "context_choice", "fill_blank"]),
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(1).max(180),
  instruction: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().min(1),
  prompt: z.string().min(1).max(255),
  hanzi: z.string().min(1).max(80),
  pinyin: z.string().min(1).max(160),
  meaning: z.string().min(1).max(255),
  options: z.array(z.object({ id: z.string().min(1).max(64), label: z.string().min(1) })).default([]),
  correctOptionId: z.string().nullable().default(null),
  tokens: z.array(z.string()).default([]),
  correctOrder: z.array(z.string()).default([]),
  expectedAnswer: z.string().max(255).nullable().default(null),
  feedbackCorrect: z.string().min(1),
  feedbackIncorrect: z.string().min(1),
  audio: audioSpecSchema.optional(),
});

const nodeSchema = z.object({
  id: z.string().min(1).max(64),
  pathId: z.string().min(1).max(64),
  title: z.string().min(1).max(180),
  description: z.string().min(1),
  objective: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  prerequisiteNodeId: z.string().max(64).nullable().default(null),
  lexicalEntries: z.array(z.object({
    id: z.string().min(1).max(64),
    hanzi: z.string().min(1).max(80),
    pinyin: z.string().min(1).max(160),
    meaningPtBr: z.string().min(1).max(255),
    exampleHanzi: z.string().min(1).max(255),
    examplePtBr: z.string().min(1).max(255),
    audio: audioSpecSchema.optional(),
  })).default([]),
  steps: z.array(z.object({
    id: z.string().min(1).max(80),
    orderIndex: z.number().int().nonnegative(),
    kind: z.enum(["objective", "context", "vocabulary", "grammar", "practice", "application", "review"]),
    title: z.string().min(1).max(180),
    description: z.string().min(1),
    content: contentSchema,
  })).min(1),
  activities: z.array(activitySchema).default([]),
  mission: z.object({
    id: z.string().min(1).max(64),
    title: z.string().min(1).max(180),
    objective: z.string().min(1),
    turns: z.array(z.object({ id: z.string().min(1), speaker: z.string().min(1), prompt: z.string().min(1), expectedAnswer: z.string().min(1), feedback: z.string().min(1), audio: audioSpecSchema.optional() })).min(1),
  }).nullable().default(null),
  audioAssets: z.array(audioAssetInputSchema).default([]),
});

export const contentImportSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string().min(1).max(64),
  path: z.object({
    id: z.string().min(1).max(64),
    slug: z.string().min(1).max(160),
    title: z.string().min(1).max(180),
    description: z.string().min(1),
    status: z.enum(["draft", "review", "published", "archived"]).default("draft"),
    nodes: z.array(nodeSchema).min(1),
  }),
}).superRefine((document, context) => {
  const nodes = document.path.nodes;
  const nodeIds = new Set<string>();
  const activityIds = new Set<string>();
  const stepIds = new Set<string>();
  const nodeOrderIndexes = new Set<number>();
  const lexicalDefinitions = new Map<string, string>();
  const activityOwners = new Map<string, { nodeId: string; stepId: string }>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `ID de nó duplicado: ${node.id}` });
    nodeIds.add(node.id);
    if (nodeOrderIndexes.has(node.orderIndex)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Ordem de nó duplicada: ${node.orderIndex}` });
    nodeOrderIndexes.add(node.orderIndex);
    if (node.pathId !== document.path.id) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Nó ${node.id} referencia pathId incorreto` });
    if (node.prerequisiteNodeId && node.prerequisiteNodeId === node.id) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Nó ${node.id} não pode depender de si próprio` });
    const nodeLexicalIds = new Set<string>();
    for (const entry of node.lexicalEntries) {
      if (nodeLexicalIds.has(entry.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Entrada lexical duplicada no nó ${node.id}: ${entry.id}` });
      nodeLexicalIds.add(entry.id);
      const definition = JSON.stringify([entry.hanzi, entry.pinyin, entry.meaningPtBr, entry.exampleHanzi, entry.examplePtBr]);
      const previousDefinition = lexicalDefinitions.get(entry.id);
      if (previousDefinition && previousDefinition !== definition) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Entrada lexical ${entry.id} possui definições conflitantes` });
      lexicalDefinitions.set(entry.id, definition);
    }
    const stepOrderIndexes = new Set<number>();
    for (const step of node.steps) {
      if (stepIds.has(step.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `ID de etapa duplicado: ${step.id}` });
      stepIds.add(step.id);
      if (stepOrderIndexes.has(step.orderIndex)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Ordem de etapa duplicada no nó ${node.id}: ${step.orderIndex}` });
      stepOrderIndexes.add(step.orderIndex);
      if (step.content.kind === "practice" || step.content.kind === "application") {
        for (const activityId of step.content.activityIds) {
          const previousOwner = activityOwners.get(activityId);
          if (previousOwner) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Atividade ${activityId} é referenciada por mais de uma etapa` });
          activityOwners.set(activityId, { nodeId: node.id, stepId: step.id });
        }
      }
    }
    const activityOrderIndexes = new Map<string, Set<number>>();
    for (const activity of node.activities) {
      if (activityIds.has(activity.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `ID de atividade duplicado: ${activity.id}` });
      activityIds.add(activity.id);
      const owner = activityOwners.get(activity.id);
      if (owner) {
        const orderKey = `${owner.nodeId}:${owner.stepId}`;
        const orderIndexes = activityOrderIndexes.get(orderKey) ?? new Set<number>();
        if (orderIndexes.has(activity.orderIndex)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Ordem de atividade duplicada na etapa ${owner.stepId}: ${activity.orderIndex}` });
        orderIndexes.add(activity.orderIndex);
        activityOrderIndexes.set(orderKey, orderIndexes);
      }
      if (activity.type === "multiple_choice" || activity.type === "context_choice") {
        if (activity.options.length === 0 || !activity.correctOptionId || !activity.options.some((option) => option.id === activity.correctOptionId)) {
          context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Atividade ${activity.id} precisa de uma opção correta existente` });
        }
      }
      if (activity.type === "word_order") {
        if (activity.tokens.length === 0 || activity.correctOrder.length === 0 || activity.correctOrder.some((token) => !activity.tokens.includes(token))) {
          context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Atividade ${activity.id} possui ordem de palavras inválida` });
        }
      }
      if (activity.type === "fill_blank" && !activity.expectedAnswer?.trim()) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Atividade ${activity.id} precisa de expectedAnswer` });
      }
    }
  }
  for (const node of nodes) {
    if (node.prerequisiteNodeId && !nodeIds.has(node.prerequisiteNodeId)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Pré-requisito inexistente: ${node.prerequisiteNodeId}` });
    for (const step of node.steps) {
      if ((step.content.kind === "practice" || step.content.kind === "application") && step.content.activityIds.some((id) => !activityIds.has(id))) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Etapa ${step.id} referencia atividade inexistente` });
      }
      if ((step.content.kind === "practice" || step.content.kind === "application") && step.content.activityIds.some((id) => activityOwners.get(id)?.nodeId !== node.id || activityOwners.get(id)?.stepId !== step.id)) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Etapa ${step.id} referencia atividade de outro nó ou etapa` });
      }
      if (step.content.kind === "vocabulary" && step.content.entryIds.some((id) => !node.lexicalEntries.some((entry) => entry.id === id))) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Etapa ${step.id} referencia palavra inexistente no nó` });
      }
    }
    for (const activity of node.activities) {
      if (!activityOwners.has(activity.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Atividade ${activity.id} não está ligada a uma etapa prática` });
    }
  }
  for (const node of nodes) {
    const seen = new Set<string>();
    let current = node;
    while (current.prerequisiteNodeId) {
      if (seen.has(current.id)) break;
      seen.add(current.id);
      const prerequisite = nodes.find((candidate) => candidate.id === current.prerequisiteNodeId);
      if (!prerequisite) break;
      if (prerequisite.id === node.id || seen.has(prerequisite.id)) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Ciclo de pré-requisitos envolvendo o nó ${node.id}` });
        break;
      }
      current = prerequisite;
    }
  }
});

export type ContentImportDocument = z.infer<typeof contentImportSchema>;

export function validateContentImport(input: unknown) {
  return contentImportSchema.parse(input);
}

export function contentImportId(pathId: string, contentVersion: string) {
  return `import-${pathId}-${contentVersion}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);
}
