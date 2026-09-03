import { z } from "zod";
import { audioAssetInputSchema } from "./audio";

const contentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("objective"), objective: z.string().min(1), successCriteria: z.array(z.string().min(1)).min(1), estimatedMinutes: z.number().int().positive() }),
  z.object({ kind: z.literal("context"), instruction: z.string().min(1), lines: z.array(z.object({ speaker: z.string().min(1), hanzi: z.string().min(1), pinyin: z.string().min(1), translation: z.string().min(1), audio: z.unknown().optional() })).min(1) }),
  z.object({ kind: z.literal("vocabulary"), instruction: z.string().min(1), entryIds: z.array(z.string().min(1)).min(1) }),
  z.object({ kind: z.literal("grammar"), instruction: z.string().min(1), patterns: z.array(z.object({ pattern: z.string().min(1), explanation: z.string().min(1), exampleHanzi: z.string().min(1), examplePtBr: z.string().min(1), audio: z.unknown().optional() })).min(1) }),
  z.object({ kind: z.enum(["practice", "application"]), instruction: z.string().min(1), activityIds: z.array(z.string().min(1)).min(1) }),
  z.object({ kind: z.literal("review"), takeaways: z.array(z.string().min(1)).min(1), nextStep: z.string().min(1) }),
]);

const activitySchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["multiple_choice", "word_order", "context_choice", "fill_blank"]),
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(1),
  instruction: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().min(1),
  prompt: z.string().min(1),
  hanzi: z.string().min(1),
  pinyin: z.string().min(1),
  meaning: z.string().min(1),
  options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).default([]),
  correctOptionId: z.string().nullable().default(null),
  tokens: z.array(z.string()).default([]),
  correctOrder: z.array(z.string()).default([]),
  expectedAnswer: z.string().nullable().default(null),
  feedbackCorrect: z.string().min(1),
  feedbackIncorrect: z.string().min(1),
  audio: z.unknown().optional(),
});

const nodeSchema = z.object({
  id: z.string().min(1).max(64),
  pathId: z.string().min(1).max(64),
  title: z.string().min(1),
  description: z.string().min(1),
  objective: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  prerequisiteNodeId: z.string().nullable().default(null),
  lexicalEntries: z.array(z.object({
    id: z.string().min(1).max(64),
    hanzi: z.string().min(1),
    pinyin: z.string().min(1),
    meaningPtBr: z.string().min(1),
    exampleHanzi: z.string().min(1),
    examplePtBr: z.string().min(1),
    audio: z.unknown().optional(),
  })).default([]),
  steps: z.array(z.object({
    id: z.string().min(1).max(80),
    orderIndex: z.number().int().nonnegative(),
    kind: z.enum(["objective", "context", "vocabulary", "grammar", "practice", "application", "review"]),
    title: z.string().min(1),
    description: z.string().min(1),
    content: contentSchema,
  })).min(1),
  activities: z.array(activitySchema).default([]),
  mission: z.object({
    id: z.string().min(1).max(64),
    title: z.string().min(1),
    objective: z.string().min(1),
    turns: z.array(z.object({ id: z.string().min(1), speaker: z.string().min(1), prompt: z.string().min(1), expectedAnswer: z.string().min(1), feedback: z.string().min(1), audio: z.unknown().optional() })).min(1),
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
  for (const node of nodes) {
    if (nodeIds.has(node.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `ID de nó duplicado: ${node.id}` });
    nodeIds.add(node.id);
    if (node.pathId !== document.path.id) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Nó ${node.id} referencia pathId incorreto` });
    if (node.prerequisiteNodeId && node.prerequisiteNodeId === node.id) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Nó ${node.id} não pode depender de si próprio` });
    for (const step of node.steps) {
      if (stepIds.has(step.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `ID de etapa duplicado: ${step.id}` });
      stepIds.add(step.id);
    }
    for (const activity of node.activities) {
      if (activityIds.has(activity.id)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `ID de atividade duplicado: ${activity.id}` });
      activityIds.add(activity.id);
    }
  }
  for (const node of nodes) {
    if (node.prerequisiteNodeId && !nodeIds.has(node.prerequisiteNodeId)) context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Pré-requisito inexistente: ${node.prerequisiteNodeId}` });
    for (const step of node.steps) {
      if ((step.content.kind === "practice" || step.content.kind === "application") && step.content.activityIds.some((id) => !activityIds.has(id))) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Etapa ${step.id} referencia atividade inexistente` });
      }
      if (step.content.kind === "vocabulary" && step.content.entryIds.some((id) => !node.lexicalEntries.some((entry) => entry.id === id))) {
        context.addIssue({ code: "custom", path: ["path", "nodes"], message: `Etapa ${step.id} referencia palavra inexistente no nó` });
      }
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
