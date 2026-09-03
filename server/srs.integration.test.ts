import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "http",
      hostname: "localhost",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("srs integration", () => {
  it("activates a card, returns it as due and applies an idempotent rating", async () => {
    const caller = appRouter.createCaller(createContext());
    const activated = await caller.review.activate({ lexicalEntryId: "xuesheng" });

    expect(activated).toMatchObject({
      id: "srs-0-xuesheng",
      lexicalEntryId: "xuesheng",
      box: 1,
      intervalDays: 0,
    });

    const dueCards = await caller.review.getDue({ limit: 10 });
    expect(dueCards.some((card) => card.id === activated.id && card.hanzi === "学生")).toBe(true);

    const firstReview = await caller.review.submitRating({
      cardId: activated.id,
      rating: "easy",
      clientEventId: "srs-integration-xuesheng-20260903",
    });
    const repeatedReview = await caller.review.submitRating({
      cardId: activated.id,
      rating: "easy",
      clientEventId: "srs-integration-xuesheng-20260903",
    });

    expect(firstReview.card).toMatchObject({ box: 2, intervalDays: 1, reviewCount: 1 });
    expect(firstReview.review.nextBox).toBe(2);
    expect(repeatedReview).toEqual(firstReview);

    const noLongerDue = await caller.review.getDue({ limit: 10 });
    expect(noLongerDue.some((card) => card.id === activated.id)).toBe(false);
  });
});
