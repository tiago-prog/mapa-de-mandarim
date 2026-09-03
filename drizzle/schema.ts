import {
  boolean,
  int,
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

export const lessonActivities = mysqlTable(
  "lesson_activities",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    nodeId: varchar("nodeId", { length: 64 }).notNull(),
    type: mysqlEnum("type", ["multiple_choice"]).notNull(),
    orderIndex: int("orderIndex").notNull(),
    prompt: varchar("prompt", { length: 255 }).notNull(),
    hanzi: varchar("hanzi", { length: 80 }).notNull(),
    pinyin: varchar("pinyin", { length: 160 }).notNull(),
    meaning: varchar("meaning", { length: 255 }).notNull(),
    optionsJson: text("optionsJson").notNull(),
    correctOptionId: varchar("correctOptionId", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nodeOrderIdx: uniqueIndex("lesson_activities_node_order_idx").on(table.nodeId, table.orderIndex),
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
export type LearningNode = typeof learningNodes.$inferSelect;
export type LexicalEntry = typeof lexicalEntries.$inferSelect;
export type LessonActivity = typeof lessonActivities.$inferSelect;
export type UserWordState = typeof userWordStates.$inferSelect;
export type UserNodeProgress = typeof userNodeProgress.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type ActivityCompletion = typeof activityCompletions.$inferSelect;
