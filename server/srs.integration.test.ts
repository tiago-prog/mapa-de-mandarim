import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(userId: number | null = 42001): TrpcContext {
  const now = new Date("2026-09-03T12:00:00.000Z");
  return {
    user: userId === null ? null : {
      id: userId,
      openId: `srs-test-${userId}`,
      name: "SRS Test User",
      email: null,
      loginMethod: "test",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: {
      protocol: "http",
      hostname: "localhost",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("srs integration", () => {
  it("rejects anonymous review access in persistent mode", async () => {
    const previousMode = process.env.MAPA_RUNTIME_MODE;
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    process.env.MAPA_RUNTIME_MODE = "persistent";

    try {
      const caller = appRouter.createCaller(createContext(null));
      await expect(caller.review.getDue({ limit: 10 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    } finally {
      if (previousMode === undefined) delete process.env.MAPA_RUNTIME_MODE;
      else process.env.MAPA_RUNTIME_MODE = previousMode;
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it("allows anonymous review access only in preview without a database", async () => {
    const previousMode = process.env.MAPA_RUNTIME_MODE;
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    process.env.MAPA_RUNTIME_MODE = "preview";

    try {
      const caller = appRouter.createCaller(createContext(null));
      await expect(caller.review.getDue({ limit: 10 })).resolves.toEqual([]);
    } finally {
      if (previousMode === undefined) delete process.env.MAPA_RUNTIME_MODE;
      else process.env.MAPA_RUNTIME_MODE = previousMode;
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it("activates a card, returns it as due and applies an idempotent rating", async () => {
    const caller = appRouter.createCaller(createContext());
    const activated = await caller.review.activate({ lexicalEntryId: "xuesheng" });

    expect(activated).toMatchObject({
      id: "srs-42001-xuesheng",
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
