import { describe, expect, it } from "vitest";

import {
  applySrsReview,
  createInitialSrsCard,
  makeSrsCardId,
  scheduleSrsReview,
} from "./srs";

describe("srs domain", () => {
  const now = new Date("2026-09-03T12:00:00Z");

  it("creates a due card in the first box", () => {
    const card = createInitialSrsCard({ userId: 42, lexicalEntryId: "nihao", now });

    expect(card).toMatchObject({
      id: "srs-42-nihao",
      userId: 42,
      lexicalEntryId: "nihao",
      box: 1,
      dueAt: now,
      intervalDays: 0,
      easeFactor: 2.5,
      reviewCount: 0,
      lapseCount: 0,
      lastReviewedAt: null,
    });
  });

  it("moves a forgotten card back to the first box and records a lapse", () => {
    const card = createInitialSrsCard({ userId: 42, lexicalEntryId: "nihao", now });
    const reviewedAt = new Date("2026-09-04T12:00:00Z");

    const next = applySrsReview(card, "forgot", reviewedAt);

    expect(next).toMatchObject({ box: 1, intervalDays: 1, reviewCount: 1, lapseCount: 1, lastReviewedAt: reviewedAt });
    expect(next.dueAt).toEqual(new Date("2026-09-05T12:00:00Z"));
    expect(next.easeFactor).toBe(2.3);
  });

  it("keeps a hard card in its box with a longer but conservative interval", () => {
    const schedule = scheduleSrsReview(
      { box: 2, dueAt: now, intervalDays: 4, easeFactor: 2.5 },
      "hard",
      now,
    );

    expect(schedule).toMatchObject({ nextBox: 2, nextIntervalDays: 6, nextEaseFactor: 2.35, lapseIncrement: 0 });
    expect(schedule.nextDueAt).toEqual(new Date("2026-09-09T12:00:00Z"));
  });

  it("advances an easy card through the five boxes without exceeding the maximum", () => {
    const first = createInitialSrsCard({ userId: 42, lexicalEntryId: "nihao", now });
    const second = applySrsReview(first, "easy", now);
    const third = applySrsReview(second, "easy", now);
    const fourth = applySrsReview(third, "easy", now);
    const fifth = applySrsReview(fourth, "easy", now);
    const sixth = applySrsReview(fifth, "easy", now);

    expect([second.box, third.box, fourth.box, fifth.box, sixth.box]).toEqual([2, 3, 4, 5, 5]);
    expect(sixth.intervalDays).toBe(14);
    expect(sixth.easeFactor).toBe(3);
  });

  it("uses a stable card id for the same user and lexical entry", () => {
    expect(makeSrsCardId(42, "nihao")).toBe(makeSrsCardId(42, "nihao"));
    expect(makeSrsCardId(42, "nihao")).not.toBe(makeSrsCardId(43, "nihao"));
  });
});
