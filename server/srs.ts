import { and, asc, count, eq, lte } from "drizzle-orm";

import { lexicalEntries, srsCards, srsReviews, userWordStates } from "../drizzle/schema";
import { getDb } from "./db";
import {
  applySrsReview,
  createInitialSrsCard,
  type SrsCardSnapshot,
  type SrsRating,
} from "./domain/srs";
import { getMemoryWordStates } from "./word-state-memory";
import { MVP_LEXICAL_ENTRIES } from "./domain/learning";

export type SrsCardWithEntry = SrsCardSnapshot & {
  hanzi: string;
  pinyin: string;
  meaningPtBr: string;
  exampleHanzi: string;
  examplePtBr: string;
};

export type SrsReviewResult = {
  card: SrsCardSnapshot;
  review: {
    id: string;
    clientEventId: string;
    rating: SrsRating;
    previousBox: number;
    nextBox: number;
    previousDueAt: Date;
    nextDueAt: Date;
    reviewedAt: Date;
  };
};

const memoryCards = new Map<string, SrsCardSnapshot>();
const memoryReviews = new Map<string, SrsReviewResult>();

function toSnapshot(row: typeof srsCards.$inferSelect): SrsCardSnapshot {
  return {
    id: row.id,
    userId: row.userId,
    lexicalEntryId: row.lexicalEntryId,
    box: row.box,
    dueAt: row.dueAt,
    intervalDays: row.intervalDays,
    easeFactor: Number(row.easeFactor),
    reviewCount: row.reviewCount,
    lapseCount: row.lapseCount,
    lastReviewedAt: row.lastReviewedAt,
  };
}

function toCardWithEntry(card: SrsCardSnapshot, entry: typeof MVP_LEXICAL_ENTRIES[number]): SrsCardWithEntry {
  return { ...entry, ...card };
}

function buildMemoryCard(userId: number, lexicalEntryId: string, now: Date): SrsCardSnapshot {
  const cardId = `srs-${userId}-${lexicalEntryId}`;
  const existing = memoryCards.get(cardId);
  if (existing) return existing;
  const created = createInitialSrsCard({ userId, lexicalEntryId, now });
  memoryCards.set(created.id, created);
  return created;
}

export async function ensureSrsCard(userId: number, lexicalEntryId: string, now = new Date()): Promise<SrsCardSnapshot> {
  const db = await getDb();
  if (db) {
    try {
      const entry = await db.select().from(lexicalEntries).where(eq(lexicalEntries.id, lexicalEntryId)).limit(1);
      if (!entry[0]) throw new Error("Palavra não encontrada");

      const initial = createInitialSrsCard({ userId, lexicalEntryId, now });
      await db.insert(srsCards).values({
        id: initial.id,
        userId: initial.userId,
        lexicalEntryId: initial.lexicalEntryId,
        box: initial.box,
        dueAt: initial.dueAt,
        intervalDays: initial.intervalDays,
        easeFactor: String(initial.easeFactor),
        reviewCount: initial.reviewCount,
        lapseCount: initial.lapseCount,
        lastReviewedAt: initial.lastReviewedAt,
        createdAt: now,
        updatedAt: now,
      }).onDuplicateKeyUpdate({ set: { updatedAt: now } });
      const rows = await db.select().from(srsCards).where(and(eq(srsCards.userId, userId), eq(srsCards.lexicalEntryId, lexicalEntryId))).limit(1);
      if (!rows[0]) throw new Error("Cartão SRS não encontrado após criação");
      return toSnapshot(rows[0]);
    } catch (error) {
      if (error instanceof Error && error.message === "Palavra não encontrada") throw error;
      console.warn("[SRS] Falling back to in-memory card creation:", error);
    }
  }

  const entry = MVP_LEXICAL_ENTRIES.find((candidate) => candidate.id === lexicalEntryId);
  if (!entry) throw new Error("Palavra não encontrada");
  return buildMemoryCard(userId, lexicalEntryId, now);
}

async function materializeLearningCards(userId: number, now: Date): Promise<void> {
  const db = await getDb();
  if (db) {
    try {
      const learningWords = await db.select({ lexicalEntryId: userWordStates.lexicalEntryId })
        .from(userWordStates)
        .where(and(eq(userWordStates.userId, userId), eq(userWordStates.status, "learning")));
      for (const word of learningWords) {
        await ensureSrsCard(userId, word.lexicalEntryId, now);
      }
      return;
    } catch (error) {
      console.warn("[SRS] Falling back to in-memory learning card materialization:", error);
    }
  }

  const states = getMemoryWordStates(userId);
  for (const [lexicalEntryId, state] of states) {
    if (state.status === "learning") buildMemoryCard(userId, lexicalEntryId, now);
  }
}

export async function getDueSrsCount(userId: number, now = new Date()): Promise<number> {
  await materializeLearningCards(userId, now);
  const db = await getDb();
  if (db) {
    try {
      const rows = await db
        .select({ total: count() })
        .from(srsCards)
        .where(and(eq(srsCards.userId, userId), lte(srsCards.dueAt, now)));
      return Number(rows[0]?.total ?? 0);
    } catch (error) {
      console.warn("[SRS] Falling back to in-memory due count:", error);
    }
  }

  return [...memoryCards.values()].filter((card) => card.userId === userId && card.dueAt <= now).length;
}

export async function getDueSrsCards(userId: number, now = new Date(), limit = 20): Promise<SrsCardWithEntry[]> {
  await materializeLearningCards(userId, now);
  const db = await getDb();
  if (db) {
    try {
      const rows = await db
        .select({ card: srsCards, entry: lexicalEntries })
        .from(srsCards)
        .innerJoin(lexicalEntries, eq(lexicalEntries.id, srsCards.lexicalEntryId))
        .where(and(eq(srsCards.userId, userId), lte(srsCards.dueAt, now)))
        .orderBy(asc(srsCards.dueAt))
        .limit(limit);
      return rows.map(({ card, entry }) => toCardWithEntry(toSnapshot(card), entry));
    } catch (error) {
      console.warn("[SRS] Falling back to in-memory due cards:", error);
    }
  }

  return [...memoryCards.values()]
    .filter((card) => card.userId === userId && card.dueAt <= now)
    .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime())
    .slice(0, limit)
    .map((card) => {
      const entry = MVP_LEXICAL_ENTRIES.find((candidate) => candidate.id === card.lexicalEntryId);
      return entry ? toCardWithEntry(card, entry) : null;
    })
    .filter((card): card is SrsCardWithEntry => Boolean(card));
}

export async function submitSrsRating(input: {
  userId: number;
  cardId: string;
  rating: SrsRating;
  clientEventId: string;
  reviewedAt?: Date;
}): Promise<SrsReviewResult> {
  const reviewedAt = input.reviewedAt ?? new Date();
  const previousMemoryReview = memoryReviews.get(`${input.userId}:${input.clientEventId}`);
  if (previousMemoryReview) return previousMemoryReview;

  const db = await getDb();
  if (db) {
    try {
      const rows = await db.select().from(srsCards).where(and(eq(srsCards.id, input.cardId), eq(srsCards.userId, input.userId))).limit(1);
      const currentRow = rows[0];
      if (!currentRow) throw new Error("Cartão SRS não encontrado");
      const currentCard = toSnapshot(currentRow);
      const existingReviews = await db.select().from(srsReviews).where(and(eq(srsReviews.userId, input.userId), eq(srsReviews.clientEventId, input.clientEventId))).limit(1);
      if (existingReviews[0]) {
        return { card: currentCard, review: {
          id: existingReviews[0].id,
          clientEventId: existingReviews[0].clientEventId,
          rating: existingReviews[0].rating,
          previousBox: existingReviews[0].previousBox,
          nextBox: existingReviews[0].nextBox,
          previousDueAt: existingReviews[0].previousDueAt,
          nextDueAt: existingReviews[0].nextDueAt,
          reviewedAt: existingReviews[0].reviewedAt,
        } };
      }
      const nextCard = applySrsReview(currentCard, input.rating, reviewedAt);
      const scheduleId = `review-${input.userId}-${input.clientEventId}`;
      const result: SrsReviewResult = {
        card: nextCard,
        review: {
          id: scheduleId,
          clientEventId: input.clientEventId,
          rating: input.rating,
          previousBox: currentCard.box,
          nextBox: nextCard.box,
          previousDueAt: currentCard.dueAt,
          nextDueAt: nextCard.dueAt,
          reviewedAt,
        },
      };
      await db.transaction(async (tx) => {
        await tx.update(srsCards).set({
          box: nextCard.box,
          dueAt: nextCard.dueAt,
          intervalDays: nextCard.intervalDays,
          easeFactor: String(nextCard.easeFactor),
          reviewCount: nextCard.reviewCount,
          lapseCount: nextCard.lapseCount,
          lastReviewedAt: nextCard.lastReviewedAt,
          updatedAt: reviewedAt,
        }).where(and(eq(srsCards.id, input.cardId), eq(srsCards.userId, input.userId)));
        await tx.insert(srsReviews).values({
          id: result.review.id,
          clientEventId: result.review.clientEventId,
          userId: input.userId,
          cardId: input.cardId,
          rating: result.review.rating,
          previousBox: result.review.previousBox,
          nextBox: result.review.nextBox,
          previousDueAt: result.review.previousDueAt,
          nextDueAt: result.review.nextDueAt,
          reviewedAt,
        });
      });
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "Cartão SRS não encontrado") throw error;
      console.warn("[SRS] Falling back to in-memory rating:", error);
    }
  }

  const currentCard = memoryCards.get(input.cardId);
  if (!currentCard) throw new Error("Cartão SRS não encontrado");
  const nextCard = applySrsReview(currentCard, input.rating, reviewedAt);
  const result: SrsReviewResult = {
    card: nextCard,
    review: {
      id: `review-${input.userId}-${input.clientEventId}`,
      clientEventId: input.clientEventId,
      rating: input.rating,
      previousBox: currentCard.box,
      nextBox: nextCard.box,
      previousDueAt: currentCard.dueAt,
      nextDueAt: nextCard.dueAt,
      reviewedAt,
    },
  };
  memoryCards.set(nextCard.id, nextCard);
  memoryReviews.set(`${input.userId}:${input.clientEventId}`, result);
  return result;
}
