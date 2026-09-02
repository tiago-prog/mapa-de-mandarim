import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  activityCompletions,
  InsertUser,
  learningNodes,
  learningPaths,
  lessonActivities,
  lexicalEntries,
  nodeLexicalEntries,
  userNodeProgress,
  userProgress,
  users,
} from "../drizzle/schema";
import {
  applyActivityCompletion,
  getNodeStatus,
  getRecommendedNode,
  MVP_ACTIVITIES,
  MVP_LEXICAL_ENTRIES,
  MVP_NODES,
  MVP_PATH,
  type LearningNodeSeed,
  type LessonActivitySeed,
  type NodeProgressSnapshot,
  type UserProgressSnapshot,
} from "./domain/learning";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let mvpSeedPromise: Promise<void> | null = null;

const DEMO_USER_ID = 0;

type LearningMapNode = LearningNodeSeed & {
  status: ReturnType<typeof getNodeStatus>;
  progressPercent: number;
  completedAt: Date | null;
};

type LearningMapData = {
  path: typeof MVP_PATH;
  nodes: LearningMapNode[];
  recommendedNodeId: string;
  userProgress: UserProgressSnapshot;
};

type LearningNodeData = {
  path: typeof MVP_PATH;
  node: LearningMapNode;
  activities: LessonActivitySeed[];
};

type ActivitySubmission = {
  clientEventId: string;
  activityId: string;
  nodeId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  xpAwarded: number;
  node: LearningMapNode;
  userProgress: UserProgressSnapshot;
};

const memoryNodeProgress = new Map<number, Map<string, NodeProgressSnapshot>>();
const memoryUserProgress = new Map<number, UserProgressSnapshot>();
const memoryEvents = new Map<string, ActivitySubmission>();

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

function toActivitySeed(row: typeof lessonActivities.$inferSelect): LessonActivitySeed {
  return {
    id: row.id,
    nodeId: row.nodeId,
    type: row.type,
    orderIndex: row.orderIndex,
    prompt: row.prompt,
    hanzi: row.hanzi,
    pinyin: row.pinyin,
    meaning: row.meaning,
    options: parseOptions(row.optionsJson),
    correctOptionId: row.correctOptionId,
  };
}

function buildMapData(
  userId: number,
  nodes: readonly LearningNodeSeed[],
  progressByNodeId: ReadonlyMap<string, NodeProgressSnapshot>,
  progress: UserProgressSnapshot,
): LearningMapData {
  const mappedNodes = nodes.map((node) => {
    const nodeProgress = progressByNodeId.get(node.id);
    return {
      ...node,
      status: getNodeStatus(node, progressByNodeId),
      progressPercent: nodeProgress?.progressPercent ?? 0,
      completedAt: nodeProgress?.completedAt ?? null,
    };
  });
  const recommendedNode = getRecommendedNode(nodes, progressByNodeId);
  void userId;
  return {
    path: MVP_PATH,
    nodes: mappedNodes,
    recommendedNodeId: recommendedNode.id,
    userProgress: progress,
  };
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
      .values({ ...entry, createdAt: now, updatedAt: now })
      .onDuplicateKeyUpdate({
        set: {
          hanzi: entry.hanzi,
          pinyin: entry.pinyin,
          meaningPtBr: entry.meaningPtBr,
          exampleHanzi: entry.exampleHanzi,
          examplePtBr: entry.examplePtBr,
          updatedAt: now,
        },
      });
  }

  const entryByNode: Record<string, string[]> = {
    intro: ["wo-jiao", "wo", "jiao"],
    identity: ["wo", "ni"],
    "ask-name": ["ni", "jiao", "mingzi"],
    countries: ["wo", "ni"],
    dialogue: ["wo-jiao", "ni", "mingzi"],
  };

  for (const [nodeId, entryIds] of Object.entries(entryByNode)) {
    for (const lexicalEntryId of entryIds) {
      await db.insert(nodeLexicalEntries).values({ nodeId, lexicalEntryId }).onDuplicateKeyUpdate({
        set: { nodeId, lexicalEntryId },
      });
    }
  }

  for (const activity of MVP_ACTIVITIES) {
    await db
      .insert(lessonActivities)
      .values({
        ...activity,
        optionsJson: JSON.stringify(activity.options),
        createdAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          nodeId: activity.nodeId,
          type: activity.type,
          orderIndex: activity.orderIndex,
          prompt: activity.prompt,
          hanzi: activity.hanzi,
          pinyin: activity.pinyin,
          meaning: activity.meaning,
          optionsJson: JSON.stringify(activity.options),
          correctOptionId: activity.correctOptionId,
          updatedAt: now,
        },
      });
  }
}

async function ensureMvpSeed(db: ReturnType<typeof drizzle>): Promise<void> {
  if (!mvpSeedPromise) {
    mvpSeedPromise = seedMvpData(db).catch((error) => {
      mvpSeedPromise = null;
      throw error;
    });
  }
  await mvpSeedPromise;
}

async function getDbMapData(db: ReturnType<typeof drizzle>, userId: number): Promise<LearningMapData> {
  await ensureMvpSeed(db);
  const [pathRows, nodeRows, progressRows, userProgressRows] = await Promise.all([
    db.select().from(learningPaths).where(eq(learningPaths.id, MVP_PATH.id)).limit(1),
    db.select().from(learningNodes).where(eq(learningNodes.pathId, MVP_PATH.id)).orderBy(asc(learningNodes.orderIndex)),
    db.select().from(userNodeProgress).where(eq(userNodeProgress.userId, userId)),
    db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1),
  ]);

  const progressByNodeId = new Map<string, NodeProgressSnapshot>(
    progressRows.map((row) => [
      row.nodeId,
      {
        nodeId: row.nodeId,
        status: row.status,
        progressPercent: row.progressPercent,
        completedAt: row.completedAt,
      },
    ]),
  );
  const storedProgress = userProgressRows[0];
  const progress: UserProgressSnapshot = {
    xp: storedProgress?.xp ?? 0,
    streakDays: storedProgress?.streakDays ?? 0,
    completedNodeCount: storedProgress?.completedNodeCount ?? 0,
  };

  const nodes = nodeRows.map(toNodeSeed);
  return {
    ...buildMapData(userId, nodes.length > 0 ? nodes : MVP_NODES, progressByNodeId, progress),
    path: pathRows[0]
      ? {
          id: pathRows[0].id,
          slug: pathRows[0].slug,
          title: pathRows[0].title,
          description: pathRows[0].description,
        }
      : MVP_PATH,
  };
}

function getMemoryMapData(userId: number): LearningMapData {
  const progressByNodeId = getMemoryNodeProgress(userId);
  return buildMapData(userId, MVP_NODES, progressByNodeId, getMemoryUserProgress(userId));
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLearningMapData(userId = DEMO_USER_ID): Promise<LearningMapData> {
  const db = await getDb();
  if (db) {
    try {
      return await getDbMapData(db, userId);
    } catch (error) {
      console.warn("[Learning] Falling back to in-memory map:", error);
    }
  }
  return getMemoryMapData(userId);
}

export async function getLearningNodeData(
  userId: number,
  nodeId: string,
): Promise<LearningNodeData | null> {
  const map = await getLearningMapData(userId);
  const node = map.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return null;

  const db = await getDb();
  if (db) {
    try {
      await ensureMvpSeed(db);
      const activityRows = await db
        .select()
        .from(lessonActivities)
        .where(eq(lessonActivities.nodeId, nodeId))
        .orderBy(asc(lessonActivities.orderIndex));
      return { path: map.path, node, activities: activityRows.map(toActivitySeed) };
    } catch (error) {
      console.warn("[Learning] Falling back to in-memory node:", error);
    }
  }

  return {
    path: map.path,
    node,
    activities: MVP_ACTIVITIES.filter((activity) => activity.nodeId === nodeId),
  };
}

export async function getLessonData(userId: number, nodeId: string) {
  const nodeData = await getLearningNodeData(userId, nodeId);
  if (!nodeData) return null;
  return { node: nodeData.node, activity: nodeData.activities[0] ?? null };
}

export async function submitActivityData(
  userId: number,
  input: {
    nodeId: string;
    activityId: string;
    selectedOptionId: string;
    clientEventId: string;
  },
): Promise<ActivitySubmission> {
  const previousEvent = memoryEvents.get(input.clientEventId);
  if (previousEvent) return previousEvent;

  const lesson = await getLessonData(userId, input.nodeId);
  if (!lesson?.activity || lesson.activity.id !== input.activityId) {
    throw new Error("Atividade não encontrada");
  }

  const isCorrect = lesson.activity.correctOptionId === input.selectedOptionId;
  const completedAt = new Date();
  const db = await getDb();

  if (db) {
    try {
      await ensureMvpSeed(db);
      const existing = await db
        .select()
        .from(activityCompletions)
        .where(eq(activityCompletions.clientEventId, input.clientEventId))
        .limit(1);
      if (existing[0]) {
        const map = await getLearningMapData(userId);
        const node = map.nodes.find((candidate) => candidate.id === input.nodeId);
        if (node) {
          return {
            clientEventId: input.clientEventId,
            activityId: existing[0].activityId,
            nodeId: existing[0].nodeId,
            selectedOptionId: existing[0].selectedOptionId,
            isCorrect: existing[0].isCorrect,
            xpAwarded: existing[0].xpAwarded,
            node,
            userProgress: map.userProgress,
          };
        }
      }

      const currentNodeRows = await db
        .select()
        .from(userNodeProgress)
        .where(eq(userNodeProgress.userId, userId));
      const currentUserRows = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
      const currentNode = currentNodeRows.find((row) => row.nodeId === input.nodeId);
      const currentUser = currentUserRows[0];
      const result = applyActivityCompletion(
        currentNode
          ? {
              nodeId: currentNode.nodeId,
              status: currentNode.status,
              progressPercent: currentNode.progressPercent,
              completedAt: currentNode.completedAt,
            }
          : {
              nodeId: input.nodeId,
              status: "in_progress",
              progressPercent: 0,
              completedAt: null,
            },
        {
          xp: currentUser?.xp ?? 0,
          streakDays: currentUser?.streakDays ?? 0,
          completedNodeCount: currentUser?.completedNodeCount ?? 0,
        },
        isCorrect,
        completedAt,
      );

      await db.transaction(async (tx) => {
        await tx
          .insert(userNodeProgress)
          .values({
            userId,
            nodeId: input.nodeId,
            status: result.nodeProgress.status,
            progressPercent: result.nodeProgress.progressPercent,
            completedAt: result.nodeProgress.completedAt,
            createdAt: completedAt,
            updatedAt: completedAt,
          })
          .onDuplicateKeyUpdate({
            set: {
              status: result.nodeProgress.status,
              progressPercent: result.nodeProgress.progressPercent,
              completedAt: result.nodeProgress.completedAt,
              updatedAt: completedAt,
            },
          });
        await tx
          .insert(userProgress)
          .values({
            userId,
            xp: result.userProgress.xp,
            streakDays: result.userProgress.streakDays,
            completedNodeCount: result.userProgress.completedNodeCount,
            updatedAt: completedAt,
          })
          .onDuplicateKeyUpdate({
            set: {
              xp: result.userProgress.xp,
              streakDays: result.userProgress.streakDays,
              completedNodeCount: result.userProgress.completedNodeCount,
              updatedAt: completedAt,
            },
          });
        await tx.insert(activityCompletions).values({
          clientEventId: input.clientEventId,
          userId,
          activityId: input.activityId,
          nodeId: input.nodeId,
          selectedOptionId: input.selectedOptionId,
          isCorrect,
          xpAwarded: result.xpAwarded,
          completedAt,
        });
      });

      const map = await getLearningMapData(userId);
      const node = map.nodes.find((candidate) => candidate.id === input.nodeId)!;
      return {
        clientEventId: input.clientEventId,
        activityId: input.activityId,
        nodeId: input.nodeId,
        selectedOptionId: input.selectedOptionId,
        isCorrect,
        xpAwarded: result.xpAwarded,
        node,
        userProgress: map.userProgress,
      };
    } catch (error) {
      console.warn("[Learning] Falling back to in-memory submission:", error);
    }
  }

  const nodeProgress = getMemoryNodeProgress(userId).get(input.nodeId);
  const result = applyActivityCompletion(
    nodeProgress ?? {
      nodeId: input.nodeId,
      status: "in_progress",
      progressPercent: 0,
      completedAt: null,
    },
    getMemoryUserProgress(userId),
    isCorrect,
    completedAt,
  );
  getMemoryNodeProgress(userId).set(input.nodeId, result.nodeProgress);
  memoryUserProgress.set(userId, result.userProgress);
  const map = getMemoryMapData(userId);
  const node = map.nodes.find((candidate) => candidate.id === input.nodeId)!;
  const submission: ActivitySubmission = {
    clientEventId: input.clientEventId,
    activityId: input.activityId,
    nodeId: input.nodeId,
    selectedOptionId: input.selectedOptionId,
    isCorrect,
    xpAwarded: result.xpAwarded,
    node,
    userProgress: map.userProgress,
  };
  memoryEvents.set(input.clientEventId, submission);
  return submission;
}
