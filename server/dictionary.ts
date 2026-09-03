import { and, eq, like, or } from "drizzle-orm";

import { lexicalEntries, userWordStates } from "../drizzle/schema";
import { MVP_LEXICAL_ENTRIES } from "./domain/learning";
import { getDb } from "./db";
import { getMemoryWordStates } from "./word-state-memory";
import { isMemoryFallbackEnabled } from "./runtime-mode";

export type WordStatus = "new" | "known" | "learning";

export type DictionaryEntry = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaningPtBr: string;
  exampleHanzi: string;
  examplePtBr: string;
  status: WordStatus;
  lastSeenAt: Date | null;
};

function toDictionaryEntry(
  entry: typeof lexicalEntries.$inferSelect,
  state?: typeof userWordStates.$inferSelect,
): DictionaryEntry {
  return {
    id: entry.id,
    hanzi: entry.hanzi,
    pinyin: entry.pinyin,
    meaningPtBr: entry.meaningPtBr,
    exampleHanzi: entry.exampleHanzi,
    examplePtBr: entry.examplePtBr,
    status: state?.status ?? "new",
    lastSeenAt: state?.lastSeenAt ?? null,
  };
}

function toMemoryEntry(id: string, status?: { status: WordStatus; lastSeenAt: Date | null }): DictionaryEntry | null {
  const entry = MVP_LEXICAL_ENTRIES.find((candidate) => candidate.id === id);
  if (!entry) return null;
  return { ...entry, status: status?.status ?? "new", lastSeenAt: status?.lastSeenAt ?? null };
}

function searchMemory(userId: number, query: string, limit: number): DictionaryEntry[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const states = getMemoryWordStates(userId);
  return MVP_LEXICAL_ENTRIES.filter((entry) => {
    if (!normalizedQuery) return true;
    return [entry.hanzi, entry.pinyin, entry.meaningPtBr].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  })
    .slice(0, limit)
    .map((entry) => toMemoryEntry(entry.id, states.get(entry.id))!)
    .filter(Boolean);
}

export async function searchDictionary(userId: number, query: string, limit: number): Promise<DictionaryEntry[]> {
  const db = await getDb();
  if (db) {
    try {
      const normalizedQuery = query.trim();
      const filter = normalizedQuery
        ? or(
            like(lexicalEntries.hanzi, `%${normalizedQuery}%`),
            like(lexicalEntries.pinyin, `%${normalizedQuery}%`),
            like(lexicalEntries.meaningPtBr, `%${normalizedQuery}%`),
          )
        : undefined;
      const entries = filter
        ? await db.select().from(lexicalEntries).where(filter).limit(limit)
        : await db.select().from(lexicalEntries).limit(limit);
      const states = await db.select().from(userWordStates).where(eq(userWordStates.userId, userId));
      const stateByEntryId = new Map(states.map((state) => [state.lexicalEntryId, state]));
      return entries.map((entry) => toDictionaryEntry(entry, stateByEntryId.get(entry.id)));
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Dictionary] Falling back to in-memory search:", error);
    }
  }
  return searchMemory(userId, query, limit);
}

export async function getDictionaryEntry(userId: number, entryId: string): Promise<DictionaryEntry | null> {
  const db = await getDb();
  if (db) {
    try {
      const entries = await db.select().from(lexicalEntries).where(eq(lexicalEntries.id, entryId)).limit(1);
      if (!entries[0]) return null;
      const states = await db
        .select()
        .from(userWordStates)
        .where(and(eq(userWordStates.userId, userId), eq(userWordStates.lexicalEntryId, entryId)))
        .limit(1);
      return toDictionaryEntry(entries[0], states[0]);
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Dictionary] Falling back to in-memory entry:", error);
    }
  }
  return toMemoryEntry(entryId, getMemoryWordStates(userId).get(entryId));
}

export async function setDictionaryEntryStatus(
  userId: number,
  entryId: string,
  status: WordStatus,
): Promise<DictionaryEntry> {
  const entry = await getDictionaryEntry(userId, entryId);
  if (!entry) throw new Error("Palavra não encontrada");
  const lastSeenAt = new Date();
  const db = await getDb();

  if (db) {
    try {
      await db
        .insert(userWordStates)
        .values({ userId, lexicalEntryId: entryId, status, lastSeenAt, updatedAt: lastSeenAt })
        .onDuplicateKeyUpdate({ set: { status, lastSeenAt, updatedAt: lastSeenAt } });
      return { ...entry, status, lastSeenAt };
    } catch (error) {
      if (!isMemoryFallbackEnabled()) throw error;
      console.warn("[Dictionary] Falling back to in-memory status:", error);
    }
  }

  getMemoryWordStates(userId).set(entryId, { status, lastSeenAt });
  return { ...entry, status, lastSeenAt };
}
