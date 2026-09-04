import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  activityCompletions,
  audioAssets,
  contentImports,
  type InsertUser,
  learningNodeSteps,
  learningNodes,
  learningPaths,
  lessonActivities,
  lexicalEntries,
  nodeLexicalEntries,
  srsCards,
  userNodeProgress,
  userProgress,
  userWordStates,
  users,
} from "../drizzle/schema";
import {
  applyActivityCompletion,
  getNodeStatus,
  getRecommendedNode,
  MVP_ACTIVITIES,
  MVP_LESSON_STEPS,
  MVP_LEXICAL_ENTRIES,
  MVP_NODES,
  MVP_PATH,
  type LearningNodeSeed,
  type LearningNodeStepSeed,
  type LessonActivitySeed,
  type LexicalEntrySeed,
  type NodeProgressSnapshot,
  type PublicLessonActivity,
  type UserProgressSnapshot,
  toPublicActivity,
} from "./domain/learning";
import { applyVocabularyExposure, getVocabularyEntryIdsForNode } from "./domain/vocabulary";
import { createInitialSrsCard } from "./domain/srs";
import { getMemoryWordStates } from "./word-state-memory";
import { ENV } from "./_core/env";
import { databaseRequiredError, isMemoryFallbackEnabled } from "./runtime-mode";
import { parseAudioJson } from "./domain/audio";
import { validateContentImport, type ContentImportDocument } from "./domain/content-import";

let _db: ReturnType<typeof drizzle> | null = null;
let mvpSeedPromise: Promise<void> | null = null;

const DEMO_USER_ID = 0;

type LearningPathData = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

type LearningMapNode = LearningNodeSeed & {
  status: ReturnType<typeof getNodeStatus>;
  progressPercent: number;
  completedAt: Date | null;
  completedActivityCount: number;
  activityCount: number;
  stepCount: number;
};

export type LearningMapData = {
  path: LearningPathData;
  nodes: LearningMapNode[];
  recommendedNodeId: string;
  userProgress: UserProgressSnapshot;
};

export type LearningNodeData = {
  path: LearningPathData;
  node: LearningMapNode;
  steps: LearningNodeStepSeed[];
  activityCount: number;
};

export type LearningLessonData = {
  path: LearningPathData;
  node: LearningMapNode;
  step: LearningNodeStepSeed;
  stepCount: number;
  previousStepId: string | null;
  nextStepId: string | null;
  activity: PublicLessonActivity | null;
  vocabulary: LexicalEntrySeed[];
  stepComplete: boolean;
  completedActivityCount: number;
  totalActivityCount: number;
};

type ActivitySubmission = {
  clientEventId: string;
  activityId: string;
  nodeId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  feedback: string;
  correctOptionId: string | null;
  correctOrder: string[];
  correctAnswer: string | null;
  xpAwarded: number;
  node: LearningMapNode;
  userProgress: UserProgressSnapshot;
};

const memoryNodeProgress = new Map<number, Map<string, NodeProgressSnapshot>>();
const memoryUserProgress = new Map<number, UserProgressSnapshot>();
const memoryEvents = new Map<string, ActivitySubmission>();

function markMemoryVocabularyExposed(userId: number, nodeId: string, seenAt: Date): void {
  const entryIds = getVocabularyEntryIdsForNode(MVP_LESSON_STEPS, nodeId);
  if (entryIds.length === 0) return;

  const states = getMemoryWordStates(userId);
  const nextStates = applyVocabularyExposure(states, entryIds, seenAt);
  for (const entryId of entryIds) {
    const nextState = nextStates.get(entryId);
    if (nextState) states.set(entryId, nextState);
  }
}

function getMemoryNodeProgress(userId: number) {
  const existing = memoryNodeProgress.get(userId);
  if (existing) return existing;
  const created = new Map<string, NodeProgressSnapshot>();
  memoryNodeProgress.set(userId, created);
  return created;
}

function getMemoryUserProgress(userId: number): UserProgressSnapshot {
  return memoryUserProgress.get(userId) ?? { xp: 0, streakDays: 0, completedNodeCount: 0 };
}

function parseStringArray(value: string | null | undefined): string[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function parseOptions(optionsJson: string): LessonActivitySeed["options"] {
  try {
    const parsed: unknown = JSON.parse(optionsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (option): option is { id: string; label: string } =>
        typeof option === "object" &&
        option !== null &&
        typeof (option as { id?: unknown }).id === "string" &&
        typeof (option as { label?: unknown }).label === "string",
    );
  } catch {
    return [];
  }
}

function parseContent(contentJson: string): LearningNodeStepSeed["content"] {
  try {
    return JSON.parse(contentJson) as LearningNodeStepSeed["content"];
  } catch {
    return { kind: "review", takeaways: [], nextStep: "" };
  }
}

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function toNodeSeed(row: typeof learningNodes.$inferSelect): LearningNodeSeed {
  return {
    id: row.id,
    pathId: row.pathId,
    title: row.title,
    description: row.description,
    objective: row.objective,
    orderIndex: row.orderIndex,
    prerequisiteNodeId: row.prerequisiteNodeId,
  };
}

function toLexicalEntrySeed(row: typeof lexicalEntries.$inferSelect): LexicalEntrySeed {
  return {
    id: row.id,
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    meaningPtBr: row.meaningPtBr,
    exampleHanzi: row.exampleHanzi,
    examplePtBr: row.examplePtBr,
    audio: parseAudioJson(row.audioJson),
  };
}

function toStepSeed(row: typeof learningNodeSteps.$inferSelect): LearningNodeStepSeed {
  return {
    id: row.id,
    nodeId: row.nodeId,
    orderIndex: row.orderIndex,
    kind: row.kind,
    title: row.title,
    description: row.description,
    content: parseContent(row.contentJson),
  };
}

function toActivitySeed(row: typeof lessonActivities.$inferSelect): LessonActivitySeed {
  return {
    id: row.id,
    nodeId: row.nodeId,
    stepId: row.stepId,
    type: row.type,
    orderIndex: row.orderIndex,
    title: row.title,
    instruction: row.instruction,
    explanation: row.explanation,
    hint: row.hint,
    prompt: row.prompt,
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    meaning: row.meaning,
    options: parseOptions(row.optionsJson),
    correctOptionId: row.correctOptionId,
    tokens: parseStringList(row.tokensJson),
    correctOrder: parseStringList(row.correctOrderJson),
    expectedAnswer: row.expectedAnswer,
    feedbackCorrect: row.feedbackCorrect,
    feedbackIncorrect: row.feedbackIncorrect,
    audio: parseAudioJson(row.audioJson),
  };
}

function toPathData(row?: typeof learningPaths.$inferSelect): LearningPathData {
  return row
    ? { id: row.id, slug: row.slug, title: row.title, description: row.description }
    : MVP_PATH;
}

function buildMapData(
  nodes: readonly LearningNodeSeed[],
  progressByNodeId: ReadonlyMap<string, NodeProgressSnapshot>,
  progress: UserProgressSnapshot,
  stepCountByNodeId: ReadonlyMap<string, number>,
  activityCountByNodeId: ReadonlyMap<string, number>,
  path: LearningPathData = MVP_PATH,
): LearningMapData {
  const mappedNodes = nodes.map((node) => {
    const nodeProgress = progressByNodeId.get(node.id);
    return {
      ...node,
      status: getNodeStatus(node, progressByNodeId),
      progressPercent: nodeProgress?.progressPercent ?? 0,
      completedAt: nodeProgress?.completedAt ?? null,
      completedActivityCount: nodeProgress?.completedActivityIds.length ?? 0,
      activityCount: activityCountByNodeId.get(node.id) ?? 0,
      stepCount: stepCountByNodeId.get(node.id) ?? 0,
    };
  });
  const recommendedNode = getRecommendedNode(nodes, progressByNodeId);
  return { path, nodes: mappedNodes, recommendedNodeId: recommendedNode.id, userProgress: progress };
}

async function seedMvpData(db: ReturnType<typeof drizzle>): Promise<void> {
  const now = new Date();

  await db
    .insert(learningPaths)
    .values({ ...MVP_PATH, createdAt: now, updatedAt: now })
    .onDuplicateKeyUpdate({
      set: { slug: MVP_PATH.slug, title: MVP_PATH.title, description: MVP_PATH.description, updatedAt: now },
    });

  for (const node of MVP_NODES) {
    await db
      .insert(learningNodes)
      .values({ ...node, createdAt: now, updatedAt: now })
      .onDuplicateKeyUpdate({
        set: {
          pathId: node.pathId,
          title: node.title,
          description: node.description,
          objective: node.objective,
          orderIndex: node.orderIndex,
          prerequisiteNodeId: node.prerequisiteNodeId,
          updatedAt: now,
        },
      });
  }

  for (const entry of MVP_LEXICAL_ENTRIES) {
    await db
      .insert(lexicalEntries)
      .values({
        id: entry.id,
        hanzi: entry.hanzi,
        pinyin: entry.pinyin,
        meaningPtBr: entry.meaningPtBr,
        exampleHanzi: entry.exampleHanzi,
        examplePtBr: entry.examplePtBr,
        audioJson: JSON.stringify(entry.audio ?? {}),
        createdAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          hanzi: entry.hanzi,
          pinyin: entry.pinyin,
          meaningPtBr: entry.meaningPtBr,
          exampleHanzi: entry.exampleHanzi,
          examplePtBr: entry.examplePtBr,
          audioJson: JSON.stringify(entry.audio ?? {}),
          updatedAt: now,
        },
      });
  }

  const entryByNode: Record<string, string[]> = {
    intro: ["nihao", "wo-jiao", "wo", "ni", "shenme", "jiao", "mingzi"],
    identity: ["wo", "ni", "shi", "xuesheng"],
    "ask-name": ["ni", "shenme", "jiao", "mingzi"],
    countries: ["wo", "laizi", "baxi"],
    dialogue: ["nihao", "wo-jiao", "ni", "shenme", "mingzi", "laizi", "baxi"],
  };

  for (const [nodeId, entryIds] of Object.entries(entryByNode)) {
    for (const lexicalEntryId of entryIds) {
      await db.insert(nodeLexicalEntries).values({ nodeId, lexicalEntryId }).onDuplicateKeyUpdate({
        set: { nodeId, lexicalEntryId },
      });
    }
  }

  for (const step of MVP_LESSON_STEPS) {
    await db
      .insert(learningNodeSteps)
      .values({
        id: step.id,
        nodeId: step.nodeId,
        orderIndex: step.orderIndex,
        kind: step.kind,
        title: step.title,
        description: step.description,
        contentJson: JSON.stringify(step.content),
        createdAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          nodeId: step.nodeId,
          orderIndex: step.orderIndex,
          kind: step.kind,
          title: step.title,
          description: step.description,
          contentJson: JSON.stringify(step.content),
          updatedAt: now,
        },
      });
  }

  for (const activity of MVP_ACTIVITIES) {
    await db
      .insert(lessonActivities)
      .values({
        id: activity.id,
        nodeId: activity.nodeId,
        stepId: activity.stepId,
        type: activity.type,
        orderIndex: activity.orderIndex,
        title: activity.title,
        instruction: activity.instruction,
        explanation: activity.explanation,
        hint: activity.hint,
        prompt: activity.prompt,
        hanzi: activity.hanzi,
        pinyin: activity.pinyin,
        meaning: activity.meaning,
        optionsJson: JSON.stringify(activity.options),
        tokensJson: JSON.stringify(activity.tokens),
        correctOrderJson: JSON.stringify(activity.correctOrder),
        expectedAnswer: activity.expectedAnswer,
        correctOptionId: activity.correctOptionId,
        feedbackCorrect: activity.feedbackCorrect,
        feedbackIncorrect: activity.feedbackIncorrect,
        audioJson: JSON.stringify(activity.audio ?? {}),
        createdAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          nodeId: activity.nodeId,
          stepId: activity.stepId,
          type: activity.type,
          orderIndex: activity.orderIndex,
          title: activity.title,
          instruction: activity.instruction,
          explanation: activity.explanation,
          hint: activity.hint,
          prompt: activity.prompt,
          hanzi: activity.hanzi,
          pinyin: activity.pinyin,
          meaning: activity.meaning,
          optionsJson: JSON.stringify(activity.options),
          tokensJson: JSON.stringify(activity.tokens),
          correctOrderJson: JSON.stringify(activity.correctOrder),
          expectedAnswer: activity.expectedAnswer,
          correctOptionId: activity.correctOptionId,
          feedbackCorrect: activity.feedbackCorrect,
          feedbackIncorrect: activity.feedbackIncorrect,
          audioJson: JSON.stringify(activity.audio ?? {}),
          updatedAt: now,
        },
      });
  }
}

export async function ensureMvpSeed(db: ReturnType<typeof drizzle>): Promise<void> {
  if (!mvpSeedPromise) {
    mvpSeedPromise = db.select({ id: learningPaths.id }).from(learningPaths).where(eq(learningPaths.id, MVP_PATH.id)).limit(1).then(async (rows) => {
      if (rows.length === 0) await seedMvpData(db);
    }).catch((error) => {
      mvpSeedPromise = null;
      throw error;
    });
  }
  await mvpSeedPromise;
}

function progressFromRows(rows: Array<typeof userNodeProgress.$inferSelect>) {
  return new Map<string, NodeProgressSnapshot>(
    rows.map((row) => [
      row.nodeId,
      {
        nodeId: row.nodeId,
        status: row.status,
        progressPercent: row.progressPercent,
        completedActivityIds: parseStringArray(row.completedActivityIdsJson),
        completedAt: row.completedAt,
      },
    ]),
  );
}

async function getDbMapData(db: ReturnType<typeof drizzle>, userId: number): Promise<LearningMapData> {
  await ensureMvpSeed(db);
  const publishedRows = await db.select({ pathId: contentImports.pathId })
    .from(contentImports)
    .where(eq(contentImports.status, "published"))
    .orderBy(desc(contentImports.updatedAt))
    .limit(1);
  const activePathId = publishedRows[0]?.pathId ?? MVP_PATH.id;
  const [pathRows, nodeRows, stepRows, activityRows, progressRows, userProgressRows] = await Promise.all([
    db.select().from(learningPaths).where(eq(learningPaths.id, activePathId)).limit(1),
    db.select().from(learningNodes).where(eq(learningNodes.pathId, activePathId)).orderBy(asc(learningNodes.orderIndex)),
    db.select().from(learningNodeSteps).orderBy(asc(learningNodeSteps.orderIndex)),
    db.select().from(lessonActivities).orderBy(asc(lessonActivities.orderIndex)),
    db.select().from(userNodeProgress).where(eq(userNodeProgress.userId, userId)),
    db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1),
  ]);
  const activeNodeIds = new Set(nodeRows.map((row) => row.id));
  const activeStepRows = stepRows.filter((row) => activeNodeIds.has(row.nodeId));
  const activeActivityRows = activityRows.filter((row) => activeNodeIds.has(row.nodeId));
  const progressByNodeId = progressFromRows(progressRows);
  const storedProgress = userProgressRows[0];
  const progress: UserProgressSnapshot = {
    xp: storedProgress?.xp ?? 0,
    streakDays: storedProgress?.streakDays ?? 0,
    completedNodeCount: storedProgress?.completedNodeCount ?? 0,
  };
  const stepCountByNodeId = new Map<string, number>();
  for (const row of activeStepRows) stepCountByNodeId.set(row.nodeId, (stepCountByNodeId.get(row.nodeId) ?? 0) + 1);
  const activityCountByNodeId = new Map<string, number>();
  for (const row of activeActivityRows) activityCountByNodeId.set(row.nodeId, (activityCountByNodeId.get(row.nodeId) ?? 0) + 1);

  return buildMapData(
    nodeRows.length ? nodeRows.map(toNodeSeed) : MVP_NODES,
    progressByNodeId,
    progress,
    stepCountByNodeId,
    activityCountByNodeId,
    toPathData(pathRows[0]),
  );
}

function getMemoryMapData(userId: number): LearningMapData {
  const stepCountByNodeId = new Map<string, number>();
  for (const step of MVP_LESSON_STEPS) stepCountByNodeId.set(step.nodeId, (stepCountByNodeId.get(step.nodeId) ?? 0) + 1);
  const activityCountByNodeId = new Map<string, number>();
  for (const activity of MVP_ACTIVITIES) activityCountByNodeId.set(activity.nodeId, (activityCountByNodeId.get(activity.nodeId) ?? 0) + 1);
  return buildMapData(
    MVP_NODES,
    getMemoryNodeProgress(userId),
    getMemoryUserProgress(userId),
    stepCountByNodeId,
    activityCountByNodeId,
  );
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Database] Failed to connect; using preview fallback:", error);
      _db = null;
    }
  }
  if (!_db && !isMemoryFallbackEnabled()) throw databaseRequiredError();
  return _db;
}

export async function getAudioAssetByHash(textHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(audioAssets).where(eq(audioAssets.textHash, textHash)).limit(1);
  return rows[0];
}

export async function saveAudioAsset(asset: typeof audioAssets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para guardar áudio");
  await db.insert(audioAssets).values(asset).onDuplicateKeyUpdate({
    set: {
      storageKey: asset.storageKey,
      publicUrl: asset.publicUrl,
      durationMs: asset.durationMs,
      fileSizeBytes: asset.fileSizeBytes,
      status: asset.status,
      errorMessage: asset.errorMessage,
    },
  });
}

export async function saveContentImportDraft(input: typeof contentImports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para guardar importação");
  await db.insert(contentImports).values(input).onDuplicateKeyUpdate({
    set: {
      payloadJson: input.payloadJson,
      validationErrorsJson: input.validationErrorsJson,
      status: input.status,
    },
  });
  const rows = await db.select().from(contentImports).where(eq(contentImports.id, input.id)).limit(1);
  return rows[0];
}
export async function listContentImports() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: contentImports.id,
    pathId: contentImports.pathId,
    contentVersion: contentImports.contentVersion,
    status: contentImports.status,
    validationErrorsJson: contentImports.validationErrorsJson,
    createdBy: contentImports.createdBy,
    createdAt: contentImports.createdAt,
    updatedAt: contentImports.updatedAt,
  }).from(contentImports).orderBy(desc(contentImports.updatedAt));
}
export async function getContentImport(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(contentImports).where(eq(contentImports.id, id)).limit(1);
  return rows[0];
}
export async function updateContentImportStatus(id: string, status: "draft" | "review" | "published" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para atualizar importação");
  await db.update(contentImports).set({ status }).where(eq(contentImports.id, id));
  return getContentImport(id);
}

export async function updateContentImportValidation(id: string, errors: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para guardar validação");
  await db.update(contentImports).set({ validationErrorsJson: JSON.stringify(errors), updatedAt: new Date() }).where(eq(contentImports.id, id));
  return getContentImport(id);
}

function parseContentImportDocument(saved: NonNullable<Awaited<ReturnType<typeof getContentImport>>>): ContentImportDocument {
  try {
    return validateContentImport(JSON.parse(saved.payloadJson));
  } catch (error) {
    throw new Error(error instanceof Error ? `Conteúdo inválido: ${error.message}` : "Conteúdo inválido");
  }
}

export async function publishContentImport(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para publicar conteúdo");
  const saved = await getContentImport(id);
  if (!saved) throw new Error("Importação não encontrada");
  const document = parseContentImportDocument(saved);
  const now = new Date();

  await db.transaction(async (tx) => {
    const oldNodes = await tx.select({ id: learningNodes.id })
      .from(learningNodes)
      .where(eq(learningNodes.pathId, document.path.id));
    const oldNodeIds = oldNodes.map((node) => node.id);
    if (oldNodeIds.length > 0) {
      await tx.delete(lessonActivities).where(inArray(lessonActivities.nodeId, oldNodeIds));
      await tx.delete(learningNodeSteps).where(inArray(learningNodeSteps.nodeId, oldNodeIds));
      await tx.delete(nodeLexicalEntries).where(inArray(nodeLexicalEntries.nodeId, oldNodeIds));
      await tx.delete(learningNodes).where(inArray(learningNodes.id, oldNodeIds));
    }

    await tx.insert(learningPaths).values({
      id: document.path.id,
      slug: document.path.slug,
      title: document.path.title,
      description: document.path.description,
      createdAt: now,
      updatedAt: now,
    }).onDuplicateKeyUpdate({ set: {
      slug: document.path.slug,
      title: document.path.title,
      description: document.path.description,
      updatedAt: now,
    } });

    const activityStepById = new Map<string, { nodeId: string; stepId: string }>();
    for (const node of document.path.nodes) {
      await tx.insert(learningNodes).values({
        id: node.id,
        pathId: node.pathId,
        title: node.title,
        description: node.description,
        objective: node.objective,
        orderIndex: node.orderIndex,
        prerequisiteNodeId: node.prerequisiteNodeId,
        createdAt: now,
        updatedAt: now,
      });
      for (const entry of node.lexicalEntries) {
        await tx.insert(lexicalEntries).values({
          id: entry.id,
          hanzi: entry.hanzi,
          pinyin: entry.pinyin,
          meaningPtBr: entry.meaningPtBr,
          exampleHanzi: entry.exampleHanzi,
          examplePtBr: entry.examplePtBr,
          audioJson: JSON.stringify(entry.audio ?? {}),
          createdAt: now,
          updatedAt: now,
        }).onDuplicateKeyUpdate({ set: {
          hanzi: entry.hanzi,
          pinyin: entry.pinyin,
          meaningPtBr: entry.meaningPtBr,
          exampleHanzi: entry.exampleHanzi,
          examplePtBr: entry.examplePtBr,
          audioJson: JSON.stringify(entry.audio ?? {}),
          updatedAt: now,
        } });
        await tx.insert(nodeLexicalEntries).values({ nodeId: node.id, lexicalEntryId: entry.id });
      }
      for (const step of node.steps) {
        await tx.insert(learningNodeSteps).values({
          id: step.id,
          nodeId: node.id,
          orderIndex: step.orderIndex,
          kind: step.kind,
          title: step.title,
          description: step.description,
          contentJson: JSON.stringify(step.content),
          createdAt: now,
          updatedAt: now,
        });
        if (step.content.kind === "practice" || step.content.kind === "application") {
          for (const activityId of step.content.activityIds) activityStepById.set(activityId, { nodeId: node.id, stepId: step.id });
        }
      }
      for (const activity of node.activities) {
        const owner = activityStepById.get(activity.id);
        if (!owner) throw new Error(`Atividade ${activity.id} não está associada a uma etapa prática`);
        await tx.insert(lessonActivities).values({
          id: activity.id,
          nodeId: owner.nodeId,
          stepId: owner.stepId,
          type: activity.type,
          orderIndex: activity.orderIndex,
          title: activity.title,
          instruction: activity.instruction,
          explanation: activity.explanation,
          hint: activity.hint,
          prompt: activity.prompt,
          hanzi: activity.hanzi,
          pinyin: activity.pinyin,
          meaning: activity.meaning,
          optionsJson: JSON.stringify(activity.options),
          tokensJson: JSON.stringify(activity.tokens),
          correctOrderJson: JSON.stringify(activity.correctOrder),
          expectedAnswer: activity.expectedAnswer,
          correctOptionId: activity.correctOptionId,
          feedbackCorrect: activity.feedbackCorrect,
          feedbackIncorrect: activity.feedbackIncorrect,
          audioJson: JSON.stringify(activity.audio ?? {}),
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await tx.update(contentImports).set({ status: "published", validationErrorsJson: "[]", updatedAt: now }).where(eq(contentImports.id, id));
  });

  return getContentImport(id);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLearningMapData(userId = DEMO_USER_ID): Promise<LearningMapData> {
  const db = await getDb();
  if (db) {
    try {
      return await getDbMapData(db, userId);
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Learning] Falling back to in-memory map:", error);
    }
  }
  return getMemoryMapData(userId);
}

export async function getLearningNodeData(userId: number, nodeId: string): Promise<LearningNodeData | null> {
  const map = await getLearningMapData(userId);
  const node = map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return null;
  const db = await getDb();
  if (db) {
    try {
      await ensureMvpSeed(db);
      const stepRows = await db.select().from(learningNodeSteps).where(eq(learningNodeSteps.nodeId, nodeId)).orderBy(asc(learningNodeSteps.orderIndex));
      const steps = stepRows.map(toStepSeed);
      return { path: map.path, node, steps: steps.length ? steps : MVP_LESSON_STEPS.filter((step) => step.nodeId === nodeId), activityCount: node.activityCount };
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Learning] Falling back to in-memory node:", error);
    }
  }
  return { path: map.path, node, steps: MVP_LESSON_STEPS.filter((step) => step.nodeId === nodeId), activityCount: node.activityCount };
}

function chooseStep(steps: LearningNodeStepSeed[], stepId?: string) {
  return (stepId ? steps.find((step) => step.id === stepId) : steps[0]) ?? null;
}

function getMemoryActivities(nodeId: string, stepId: string) {
  return MVP_ACTIVITIES.filter((activity) => activity.nodeId === nodeId && activity.stepId === stepId);
}

function getVocabularyForStep(step: LearningNodeStepSeed): LexicalEntrySeed[] {
  if (step.content.kind !== "vocabulary") return [];
  return step.content.entryIds
    .map((entryId) => MVP_LEXICAL_ENTRIES.find((entry) => entry.id === entryId))
    .filter((entry): entry is LexicalEntrySeed => Boolean(entry));
}

function buildLessonData(
  map: LearningMapData,
  steps: LearningNodeStepSeed[],
  activities: LessonActivitySeed[],
  progress: NodeProgressSnapshot | undefined,
  stepId?: string,
  activityId?: string,
  vocabulary: LexicalEntrySeed[] = [],
): LearningLessonData | null {
  const step = chooseStep(steps, stepId);
  if (!step) return null;
  const stepActivities = activities.filter((activity) => activity.stepId === step.id);
  const completedActivityIds = progress?.completedActivityIds ?? [];
  const pendingActivity = stepActivities.find((activity) => !completedActivityIds.includes(activity.id));
  const selectedActivity = activityId ? stepActivities.find((activity) => activity.id === activityId) : pendingActivity;
  const stepComplete = stepActivities.length === 0 || stepActivities.every((activity) => completedActivityIds.includes(activity.id));
  const stepIndex = steps.findIndex((candidate) => candidate.id === step.id);
  return {
    path: map.path,
    node: map.nodes.find((candidate) => candidate.id === step.nodeId)!,
    step,
    stepCount: steps.length,
    previousStepId: steps[stepIndex - 1]?.id ?? null,
    nextStepId: steps[stepIndex + 1]?.id ?? null,
    activity: selectedActivity ? toPublicActivity(selectedActivity) : null,
    vocabulary: vocabulary.length ? vocabulary : getVocabularyForStep(step),
    stepComplete,
    completedActivityCount: completedActivityIds.length,
    totalActivityCount: activities.length,
  };
}

export async function getLessonData(userId: number, nodeId: string, stepId?: string, activityId?: string): Promise<LearningLessonData | null> {
  const map = await getLearningMapData(userId);
  const node = map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return null;
  const memoryProgress = getMemoryNodeProgress(userId).get(nodeId);
  const db = await getDb();

  if (db) {
    try {
      await ensureMvpSeed(db);
      const [stepRows, activityRows, progressRows] = await Promise.all([
        db.select().from(learningNodeSteps).where(eq(learningNodeSteps.nodeId, nodeId)).orderBy(asc(learningNodeSteps.orderIndex)),
        db.select().from(lessonActivities).where(eq(lessonActivities.nodeId, nodeId)).orderBy(asc(lessonActivities.orderIndex)),
        db.select().from(userNodeProgress).where(eq(userNodeProgress.userId, userId)),
      ]);
      const steps = stepRows.map(toStepSeed);
      const activitySeeds = activityRows.map(toActivitySeed);
      const progress = progressRows.find((row) => row.nodeId === nodeId);
      const nodeProgress: NodeProgressSnapshot | undefined = progress
        ? {
            nodeId: progress.nodeId,
            status: progress.status,
            progressPercent: progress.progressPercent,
            completedActivityIds: parseStringArray(progress.completedActivityIdsJson),
            completedAt: progress.completedAt,
          }
        : undefined;
      const step = chooseStep(steps, stepId);
      const vocabularyIds = step?.content.kind === "vocabulary" ? step.content.entryIds : [];
      const vocabularyRows = vocabularyIds.length
        ? await db.select().from(lexicalEntries).where(inArray(lexicalEntries.id, vocabularyIds))
        : [];
      return buildLessonData(map, steps, activitySeeds, nodeProgress, stepId, activityId, vocabularyRows.map(toLexicalEntrySeed));
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Learning] Falling back to in-memory lesson:", error);
    }
  }

  return buildLessonData(
    map,
    MVP_LESSON_STEPS.filter((step) => step.nodeId === nodeId),
    getMemoryActivities(nodeId, stepId ?? `${nodeId}-practice`).length
      ? MVP_ACTIVITIES.filter((activity) => activity.nodeId === nodeId)
      : MVP_ACTIVITIES.filter((activity) => activity.nodeId === nodeId),
    memoryProgress,
    stepId,
    activityId,
  );
}

async function getInternalActivity(nodeId: string, stepId: string, activityId: string): Promise<LessonActivitySeed | null> {
  const db = await getDb();
  if (db) {
    try {
      await ensureMvpSeed(db);
      const rows = await db
        .select()
        .from(lessonActivities)
        .where(eq(lessonActivities.id, activityId))
        .limit(1);
      const activity = rows[0] ? toActivitySeed(rows[0]) : null;
      if (activity?.nodeId === nodeId && activity.stepId === stepId) return activity;
      return null;
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Learning] Falling back to in-memory activity:", error);
    }
  }
  return MVP_ACTIVITIES.find((activity) => activity.id === activityId && activity.nodeId === nodeId && activity.stepId === stepId) ?? null;
}

function evaluateActivity(
  activity: LessonActivitySeed,
  selectedOptionId?: string,
  selectedOrder?: string[],
): { isCorrect: boolean; selectedOptionId: string } {
  if (activity.type === "word_order") {
    const normalizedOrder = selectedOrder ?? [];
    return { isCorrect: JSON.stringify(normalizedOrder) === JSON.stringify(activity.correctOrder), selectedOptionId: JSON.stringify(normalizedOrder) };
  }
  const normalizedSelection = selectedOptionId ?? "";
  if (activity.type === "fill_blank") {
    const normalize = (value: string) => value.trim().replace(/[。！？!?.,，、\s]+$/g, "");
    const expectedAnswer = activity.expectedAnswer ?? "";
    return { isCorrect: Boolean(expectedAnswer) && normalize(expectedAnswer) === normalize(normalizedSelection), selectedOptionId: normalizedSelection };
  }
  return { isCorrect: Boolean(activity.correctOptionId) && activity.correctOptionId === normalizedSelection, selectedOptionId: normalizedSelection };
}

export async function submitActivityData(
  userId: number,
  input: {
    nodeId: string;
    stepId: string;
    activityId: string;
    selectedOptionId?: string;
    selectedOrder?: string[];
    clientEventId: string;
  },
): Promise<ActivitySubmission> {
  const eventKey = `${userId}:${input.clientEventId}`;
  const previousEvent = memoryEvents.get(eventKey);
  if (previousEvent) {
    if (previousEvent.activityId !== input.activityId || previousEvent.nodeId !== input.nodeId) throw new Error("clientEventId já foi usado em outra atividade");
    return previousEvent;
  }

  const activeMap = await getLearningMapData(userId);
  if (!activeMap.nodes.some((node) => node.id === input.nodeId)) throw new Error("Atividade não encontrada");
  const activity = await getInternalActivity(input.nodeId, input.stepId, input.activityId);
  if (!activity) throw new Error("Atividade não encontrada");
  const evaluation = evaluateActivity(activity, input.selectedOptionId, input.selectedOrder);
  const completedAt = new Date();
  const db = await getDb();

  if (db) {
    try {
      await ensureMvpSeed(db);
      const existing = await db.select().from(activityCompletions).where(and(
        eq(activityCompletions.userId, userId),
        eq(activityCompletions.clientEventId, input.clientEventId),
      )).limit(1);
      if (existing[0]) {
        if (existing[0].activityId !== input.activityId || existing[0].nodeId !== input.nodeId) throw new Error("clientEventId já foi usado em outra atividade");
        const map = await getLearningMapData(userId);
        const node = map.nodes.find((candidate) => candidate.id === input.nodeId);
        if (node) {
          return {
            clientEventId: input.clientEventId,
            activityId: existing[0].activityId,
            nodeId: existing[0].nodeId,
            selectedOptionId: existing[0].selectedOptionId,
            isCorrect: existing[0].isCorrect,
            feedback: existing[0].isCorrect ? activity.feedbackCorrect : activity.feedbackIncorrect,
            correctOptionId: activity.correctOptionId,
            correctOrder: activity.correctOrder,
            correctAnswer: activity.expectedAnswer,
            xpAwarded: existing[0].xpAwarded,
            node,
            userProgress: map.userProgress,
          };
        }
      }

      let result: ReturnType<typeof applyActivityCompletion> | undefined;
      let replayedCompletion = false;
      await db.transaction(async (tx) => {
        await tx.insert(userProgress).values({ userId, xp: 0, streakDays: 0, completedNodeCount: 0, updatedAt: completedAt }).onDuplicateKeyUpdate({ set: { updatedAt: completedAt } });
        await tx.insert(userNodeProgress).values({
          userId,
          nodeId: input.nodeId,
          status: "in_progress",
          progressPercent: 0,
          completedActivityIdsJson: "[]",
          completedAt: null,
          createdAt: completedAt,
          updatedAt: completedAt,
        }).onDuplicateKeyUpdate({ set: { updatedAt: completedAt } });
        const [currentNodeRows, currentUserRows, activityRows] = await Promise.all([
        tx.select().from(userNodeProgress).where(eq(userNodeProgress.userId, userId)).for("update"),
        tx.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1).for("update"),
        tx.select().from(lessonActivities).where(eq(lessonActivities.nodeId, input.nodeId)),
      ]);
      const replayRows = await tx.select().from(activityCompletions).where(and(
        eq(activityCompletions.userId, userId),
        eq(activityCompletions.clientEventId, input.clientEventId),
      )).limit(1);
      if (replayRows[0]) {
        if (replayRows[0].activityId !== input.activityId || replayRows[0].nodeId !== input.nodeId) throw new Error("clientEventId já foi usado em outra atividade");
        replayedCompletion = true;
        return;
      }
      const currentNode = currentNodeRows.find((row) => row.nodeId === input.nodeId);
      const currentUser = currentUserRows[0];
      const currentNodeProgress: NodeProgressSnapshot | undefined = currentNode
        ? {
            nodeId: currentNode.nodeId,
            status: currentNode.status,
            progressPercent: currentNode.progressPercent,
            completedActivityIds: parseStringArray(currentNode.completedActivityIdsJson),
            completedAt: currentNode.completedAt,
          }
        : undefined;
      result = applyActivityCompletion(
        currentNodeProgress ?? {
          nodeId: input.nodeId,
          status: "in_progress",
          progressPercent: 0,
          completedActivityIds: [],
          completedAt: null,
        },
        input.activityId,
        {
          xp: currentUser?.xp ?? 0,
          streakDays: currentUser?.streakDays ?? 0,
          completedNodeCount: currentUser?.completedNodeCount ?? 0,
        },
        evaluation.isCorrect,
        completedAt,
        activityRows.length,
      );

        await tx
          .insert(userNodeProgress)
          .values({
            userId,
            nodeId: input.nodeId,
            status: result.nodeProgress.status,
            progressPercent: result.nodeProgress.progressPercent,
            completedActivityIdsJson: JSON.stringify(result.nodeProgress.completedActivityIds),
            completedAt: result.nodeProgress.completedAt,
            createdAt: completedAt,
            updatedAt: completedAt,
          })
          .onDuplicateKeyUpdate({
            set: {
              status: result.nodeProgress.status,
              progressPercent: result.nodeProgress.progressPercent,
              completedActivityIdsJson: JSON.stringify(result.nodeProgress.completedActivityIds),
              completedAt: result.nodeProgress.completedAt,
              updatedAt: completedAt,
            },
          });
        await tx
          .insert(userProgress)
          .values({ userId, xp: result.userProgress.xp, streakDays: result.userProgress.streakDays, completedNodeCount: result.userProgress.completedNodeCount, updatedAt: completedAt })
          .onDuplicateKeyUpdate({
            set: { xp: result.userProgress.xp, streakDays: result.userProgress.streakDays, completedNodeCount: result.userProgress.completedNodeCount, updatedAt: completedAt },
          });
        const relationRows = await tx
          .select({ lexicalEntryId: nodeLexicalEntries.lexicalEntryId })
          .from(nodeLexicalEntries)
          .where(eq(nodeLexicalEntries.nodeId, input.nodeId));
        const entryIds = [...new Set(relationRows.map((row) => row.lexicalEntryId))];
        if (entryIds.length > 0) {
          const stateRows = await tx
            .select()
            .from(userWordStates)
            .where(and(eq(userWordStates.userId, userId), inArray(userWordStates.lexicalEntryId, entryIds)));
          const currentStates = new Map(
            stateRows.map((state) => [state.lexicalEntryId, { status: state.status, lastSeenAt: state.lastSeenAt }]),
          );
          const nextStates = applyVocabularyExposure(currentStates, entryIds, completedAt);
          for (const entryId of entryIds) {
            const nextState = nextStates.get(entryId);
            if (!nextState) continue;
            await tx
              .insert(userWordStates)
              .values({
                userId,
                lexicalEntryId: entryId,
                status: nextState.status,
                lastSeenAt: nextState.lastSeenAt,
                updatedAt: completedAt,
              })
              .onDuplicateKeyUpdate({
                set: {
                  status: nextState.status,
                  lastSeenAt: nextState.lastSeenAt,
                  updatedAt: completedAt,
                },
              });
            if (nextState.status === "learning") {
              const initialCard = createInitialSrsCard({ userId, lexicalEntryId: entryId, now: completedAt });
              await tx
                .insert(srsCards)
                .values({
                  id: initialCard.id,
                  userId: initialCard.userId,
                  lexicalEntryId: initialCard.lexicalEntryId,
                  box: initialCard.box,
                  dueAt: initialCard.dueAt,
                  intervalDays: initialCard.intervalDays,
                  easeFactor: String(initialCard.easeFactor),
                  reviewCount: initialCard.reviewCount,
                  lapseCount: initialCard.lapseCount,
                  lastReviewedAt: initialCard.lastReviewedAt,
                  createdAt: completedAt,
                  updatedAt: completedAt,
                })
                .onDuplicateKeyUpdate({ set: { updatedAt: completedAt } });
            }
          }
        }
        await tx.insert(activityCompletions).values({
          clientEventId: input.clientEventId,
          userId,
          activityId: input.activityId,
          nodeId: input.nodeId,
          selectedOptionId: evaluation.selectedOptionId,
          isCorrect: evaluation.isCorrect,
          xpAwarded: result.xpAwarded,
          completedAt,
        });
      });
      if (replayedCompletion) return submitActivityData(userId, input);
      if (!result) throw new Error("Progresso da atividade não foi calculado");

      const map = await getLearningMapData(userId);
      const node = map.nodes.find((candidate) => candidate.id === input.nodeId)!;
      return {
        clientEventId: input.clientEventId,
        activityId: input.activityId,
        nodeId: input.nodeId,
        selectedOptionId: evaluation.selectedOptionId,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.isCorrect ? activity.feedbackCorrect : activity.feedbackIncorrect,
        correctOptionId: activity.correctOptionId,
        correctOrder: activity.correctOrder,
        correctAnswer: activity.expectedAnswer,
        xpAwarded: result.xpAwarded,
        node,
        userProgress: map.userProgress,
      };
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Learning] Falling back to in-memory submission:", error);
    }
  }

  const currentNodeProgress = getMemoryNodeProgress(userId).get(input.nodeId);
  const totalActivityCount = MVP_ACTIVITIES.filter((candidate) => candidate.nodeId === input.nodeId).length;
  const result = applyActivityCompletion(
    currentNodeProgress ?? {
      nodeId: input.nodeId,
      status: "in_progress",
      progressPercent: 0,
      completedActivityIds: [],
      completedAt: null,
    },
    input.activityId,
    getMemoryUserProgress(userId),
    evaluation.isCorrect,
    completedAt,
    totalActivityCount,
  );
  getMemoryNodeProgress(userId).set(input.nodeId, result.nodeProgress);
  markMemoryVocabularyExposed(userId, input.nodeId, completedAt);
  memoryUserProgress.set(userId, result.userProgress);
  const map = getMemoryMapData(userId);
  const node = map.nodes.find((candidate) => candidate.id === input.nodeId)!;
  const submission: ActivitySubmission = {
    clientEventId: input.clientEventId,
    activityId: input.activityId,
    nodeId: input.nodeId,
    selectedOptionId: evaluation.selectedOptionId,
    isCorrect: evaluation.isCorrect,
    feedback: evaluation.isCorrect ? activity.feedbackCorrect : activity.feedbackIncorrect,
    correctOptionId: activity.correctOptionId,
    correctOrder: activity.correctOrder,
    correctAnswer: activity.expectedAnswer,
    xpAwarded: result.xpAwarded,
    node,
    userProgress: map.userProgress,
  };
  memoryEvents.set(eventKey, submission);
  return submission;
}
