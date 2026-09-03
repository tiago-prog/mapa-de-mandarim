export type SrsRating = "forgot" | "hard" | "easy";

export type SrsCardSnapshot = {
  id: string;
  userId: number;
  lexicalEntryId: string;
  box: number;
  dueAt: Date;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lapseCount: number;
  lastReviewedAt: Date | null;
};

export type SrsSchedule = {
  nextBox: number;
  nextDueAt: Date;
  nextIntervalDays: number;
  nextEaseFactor: number;
  lapseIncrement: number;
};

const MIN_BOX = 1;
const MAX_BOX = 5;
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3;
const BOX_INTERVALS = [0, 0, 1, 3, 7, 14] as const;

function clampBox(box: number): number {
  return Math.max(MIN_BOX, Math.min(MAX_BOX, Math.round(box)));
}

function clampEaseFactor(easeFactor: number): number {
  if (!Number.isFinite(easeFactor)) return DEFAULT_EASE_FACTOR;
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, easeFactor));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function makeSrsCardId(userId: number, lexicalEntryId: string): string {
  return `srs-${userId}-${lexicalEntryId}`;
}

export function createInitialSrsCard(input: {
  userId: number;
  lexicalEntryId: string;
  now: Date;
}): SrsCardSnapshot {
  return {
    id: makeSrsCardId(input.userId, input.lexicalEntryId),
    userId: input.userId,
    lexicalEntryId: input.lexicalEntryId,
    box: MIN_BOX,
    dueAt: input.now,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    reviewCount: 0,
    lapseCount: 0,
    lastReviewedAt: null,
  };
}

export function scheduleSrsReview(
  card: Pick<SrsCardSnapshot, "box" | "dueAt" | "intervalDays" | "easeFactor">,
  rating: SrsRating,
  reviewedAt: Date,
): SrsSchedule {
  const currentBox = clampBox(card.box);
  const currentEaseFactor = clampEaseFactor(card.easeFactor);
  let nextBox = currentBox;
  let nextIntervalDays = card.intervalDays;
  let nextEaseFactor = currentEaseFactor;
  let lapseIncrement = 0;

  if (rating === "forgot") {
    nextBox = MIN_BOX;
    nextIntervalDays = 1;
    nextEaseFactor = clampEaseFactor(currentEaseFactor - 0.2);
    lapseIncrement = 1;
  } else if (rating === "hard") {
    nextBox = currentBox;
    nextIntervalDays = Math.max(1, Math.round(Math.max(card.intervalDays, 1) * 1.5));
    nextEaseFactor = clampEaseFactor(currentEaseFactor - 0.15);
  } else {
    nextBox = Math.min(MAX_BOX, currentBox + 1);
    nextIntervalDays = BOX_INTERVALS[nextBox];
    nextEaseFactor = clampEaseFactor(currentEaseFactor + 0.15);
  }

  return {
    nextBox,
    nextDueAt: addDays(reviewedAt, nextIntervalDays),
    nextIntervalDays,
    nextEaseFactor,
    lapseIncrement,
  };
}

export function applySrsReview(
  card: SrsCardSnapshot,
  rating: SrsRating,
  reviewedAt: Date,
): SrsCardSnapshot {
  const schedule = scheduleSrsReview(card, rating, reviewedAt);
  return {
    ...card,
    box: schedule.nextBox,
    dueAt: schedule.nextDueAt,
    intervalDays: schedule.nextIntervalDays,
    easeFactor: schedule.nextEaseFactor,
    reviewCount: card.reviewCount + 1,
    lapseCount: card.lapseCount + schedule.lapseIncrement,
    lastReviewedAt: reviewedAt,
  };
}
