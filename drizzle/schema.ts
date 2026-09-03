import {
  boolean,
  int,
  index,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const learningPaths = mysqlTable("learning_paths", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contentImports = mysqlTable("content_imports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  pathId: varchar("pathId", { length: 64 }).notNull(),
  contentVersion: varchar("contentVersion", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["draft", "review", "published", "archived"]).notNull().default("draft"),
  payloadJson: text("payloadJson").notNull(),
  validationErrorsJson: text("validationErrorsJson").notNull().default("[]"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pathVersionIdx: uniqueIndex("content_imports_path_version_idx").on(table.pathId, table.contentVersion),
}));

export const learningNodes = mysqlTable(
  "learning_nodes",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    pathId: varchar("pathId", { length: 64 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    objective: varchar("objective", { length: 255 }).notNull(),
    orderIndex: int("orderIndex").notNull(),
    prerequisiteNodeId: varchar("prerequisiteNodeId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    pathOrderIdx: uniqueIndex("learning_nodes_path_order_idx").on(table.pathId, table.orderIndex),
  }),
);

export const lexicalEntries = mysqlTable("lexical_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  hanzi: varchar("hanzi", { length: 80 }).notNull(),
  pinyin: varchar("pinyin", { length: 160 }).notNull(),
  meaningPtBr: varchar("meaningPtBr", { length: 255 }).notNull(),
  exampleHanzi: varchar("exampleHanzi", { length: 255 }).notNull(),
  examplePtBr: varchar("examplePtBr", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const nodeLexicalEntries = mysqlTable(
  "node_lexical_entries",
  {
    nodeId: varchar("nodeId", { length: 64 }).notNull(),
    lexicalEntryId: varchar("lexicalEntryId", { length: 64 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.nodeId, table.lexicalEntryId] }),
  }),
);

export const learningNodeSteps = mysqlTable(
  "learning_node_steps",
  {
    id: varchar("id", { length: 80 }).primaryKey(),
    nodeId: varchar("nodeId", { length: 64 }).notNull(),
    orderIndex: int("orderIndex").notNull(),
    kind: mysqlEnum("kind", ["objective", "context", "vocabulary", "grammar", "practice", "application", "review"]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    contentJson: text("contentJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nodeOrderIdx: uniqueIndex("learning_node_steps_node_order_idx").on(table.nodeId, table.orderIndex),
  }),
);

export const lessonActivities = mysqlTable(
  "lesson_activities",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    nodeId: varchar("nodeId", { length: 64 }).notNull(),
    stepId: varchar("stepId", { length: 80 }).notNull(),
    type: mysqlEnum("type", ["multiple_choice", "word_order", "context_choice", "fill_blank"]).notNull(),
    orderIndex: int("orderIndex").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    instruction: text("instruction").notNull(),
    explanation: text("explanation").notNull(),
    hint: text("hint").notNull(),
    prompt: varchar("prompt", { length: 255 }).notNull(),
    hanzi: varchar("hanzi", { length: 80 }).notNull(),
    pinyin: varchar("pinyin", { length: 160 }).notNull(),
    meaning: varchar("meaning", { length: 255 }).notNull(),
    optionsJson: text("optionsJson").notNull(),
    tokensJson: text("tokensJson").notNull(),
    correctOrderJson: text("correctOrderJson").notNull(),
    expectedAnswer: varchar("expectedAnswer", { length: 255 }),
    correctOptionId: varchar("correctOptionId", { length: 64 }),
    feedbackCorrect: text("feedbackCorrect").notNull(),
    feedbackIncorrect: text("feedbackIncorrect").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nodeOrderIdx: uniqueIndex("lesson_activities_node_order_idx").on(table.nodeId, table.orderIndex),
  }),
);

export const audioAssets = mysqlTable(
  "audio_assets",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    contentType: mysqlEnum("contentType", ["lexical_entry", "example_sentence", "dialogue_line", "lesson_activity", "mission_step", "listening_prompt"]).notNull(),
    contentId: varchar("contentId", { length: 80 }).notNull(),
    lexicalEntryId: varchar("lexicalEntryId", { length: 64 }),
    textHash: varchar("textHash", { length: 32 }).notNull().unique(),
    language: varchar("language", { length: 16 }).notNull().default("zh-CN"),
    voice: varchar("voice", { length: 128 }).notNull(),
    rate: varchar("rate", { length: 16 }).notNull().default("0.85"),
    format: varchar("format", { length: 64 }).notNull().default("audio-24khz-48kbitrate-mono-mp3"),
    generatorVersion: varchar("generatorVersion", { length: 32 }).notNull().default("v1"),
    storageKey: varchar("storageKey", { length: 512 }),
    publicUrl: varchar("publicUrl", { length: 1024 }),
    durationMs: int("durationMs"),
    fileSizeBytes: int("fileSizeBytes"),
    status: mysqlEnum("status", ["pending", "processing", "ready", "failed", "stale"]).notNull().default("pending"),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    contentIdx: index("audio_assets_content_idx").on(table.contentType, table.contentId),
  }),
);

export const userWordStates = mysqlTable(
  "user_word_states",
  {
    userId: int("userId").notNull(),
    lexicalEntryId: varchar("lexicalEntryId", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["new", "known", "learning"]).default("new").notNull(),
    lastSeenAt: timestamp("lastSeenAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.lexicalEntryId] }),
  }),
);

export const userNodeProgress = mysqlTable(
  "user_node_progress",
  {
    userId: int("userId").notNull(),
    nodeId: varchar("nodeId", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
    progressPercent: int("progressPercent").default(0).notNull(),
    completedActivityIdsJson: text("completedActivityIdsJson").notNull().default("[]"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.nodeId] }),
  }),
);

export const userProgress = mysqlTable("user_progress", {
  userId: int("userId").primaryKey(),
  xp: int("xp").default(0).notNull(),
  streakDays: int("streakDays").default(0).notNull(),
  completedNodeCount: int("completedNodeCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityCompletions = mysqlTable("activity_completions", {
  clientEventId: varchar("clientEventId", { length: 96 }).primaryKey(),
  userId: int("userId").notNull(),
  activityId: varchar("activityId", { length: 64 }).notNull(),
  nodeId: varchar("nodeId", { length: 64 }).notNull(),
  selectedOptionId: varchar("selectedOptionId", { length: 64 }).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  xpAwarded: int("xpAwarded").default(0).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LearningPath = typeof learningPaths.$inferSelect;
export type ContentImport = typeof contentImports.$inferSelect;
export type LearningNode = typeof learningNodes.$inferSelect;
export type LexicalEntry = typeof lexicalEntries.$inferSelect;
export type LearningNodeStep = typeof learningNodeSteps.$inferSelect;
export type LessonActivity = typeof lessonActivities.$inferSelect;
export type AudioAsset = typeof audioAssets.$inferSelect;
export type UserWordState = typeof userWordStates.$inferSelect;
export type UserNodeProgress = typeof userNodeProgress.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type ActivityCompletion = typeof activityCompletions.$inferSelect;
