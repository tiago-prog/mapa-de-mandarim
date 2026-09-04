import { describe, expect, it } from "vitest";

import { ensureSrsCard, getDueSrsCount, submitSrsRating } from "./srs";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const databaseDescribe = runDatabaseTests ? describe : describe.skip;

function databaseTestUserId(): number {
  return Number(process.env.SRS_TEST_USER_ID ?? (490001 + (Date.now() % 1000000)));
}

databaseDescribe("srs persistence", () => {
  it("persists a card, schedules a rating and replays the same event idempotently", async () => {
    const userId = databaseTestUserId();
    const reviewedAt = new Date("2026-09-03T12:00:00.000Z");
    const card = await ensureSrsCard(userId, "xuesheng", reviewedAt);

    expect(card.userId).toBe(userId);
    expect(card.lexicalEntryId).toBe("xuesheng");
    expect(await getDueSrsCount(userId, reviewedAt)).toBeGreaterThanOrEqual(1);

    const first = await submitSrsRating({
      userId,
      cardId: card.id,
      rating: "easy",
      clientEventId: `persistence-${userId}-easy`,
      reviewedAt,
    });
    const replay = await submitSrsRating({
      userId,
      cardId: card.id,
      rating: "easy",
      clientEventId: `persistence-${userId}-easy`,
      reviewedAt,
    });

    expect(first).toEqual(replay);
    expect(first.card.box).toBe(2);
    expect(first.review.clientEventId).toBe(`persistence-${userId}-easy`);

    const concurrentEventId = `persistence-${userId}-concurrent`;
    const [concurrentA, concurrentB] = await Promise.all([
      submitSrsRating({ userId, cardId: card.id, rating: "hard", clientEventId: concurrentEventId, reviewedAt: new Date(reviewedAt.getTime() + 1) }),
      submitSrsRating({ userId, cardId: card.id, rating: "hard", clientEventId: concurrentEventId, reviewedAt: new Date(reviewedAt.getTime() + 1) }),
    ]);

    expect(concurrentA).toEqual(concurrentB);
    expect(concurrentA.review.clientEventId).toBe(concurrentEventId);
  });
});
