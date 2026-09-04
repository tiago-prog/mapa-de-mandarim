import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const databaseDescribe = runDatabaseTests ? describe : describe.skip;

function createContext(userId: number): TrpcContext {
  const now = new Date("2026-09-03T12:00:00.000Z");
  return {
    user: {
      id: userId,
      openId: `learning-persistence-${userId}`,
      name: "Learning Persistence Test",
      email: null,
      loginMethod: "test",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: { protocol: "http", hostname: "localhost", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

databaseDescribe("learning persistence", () => {
  it("preserva duas atividades concorrentes e isola o mesmo event id entre usuários", async () => {
    const suffix = `${Date.now()}`;
    const userId = Number(process.env.LEARNING_TEST_USER_ID ?? 490002);
    const caller = appRouter.createCaller(createContext(userId));
    const [first, second] = await Promise.all([
      caller.lesson.submitActivity({
        nodeId: "intro",
        stepId: "intro-practice",
        activityId: "intro-practice-meaning",
        selectedOptionId: "eu-me-chamo",
        clientEventId: `learning-${suffix}-meaning`,
      }),
      caller.lesson.submitActivity({
        nodeId: "intro",
        stepId: "intro-practice",
        activityId: "intro-practice-order",
        selectedOrder: ["我", "叫", "安娜"],
        clientEventId: `learning-${suffix}-order`,
      }),
    ]);

    expect(first.isCorrect).toBe(true);
    expect(second.isCorrect).toBe(true);
    const node = await caller.learningMap.getNode({ nodeId: "intro" });
    expect(node.node.completedActivityCount).toBeGreaterThanOrEqual(2);

    const sharedEventId = `learning-${suffix}-shared`;
    const otherUser = appRouter.createCaller(createContext(userId + 1));
    const [sameEventA, sameEventB] = await Promise.all([
      caller.lesson.submitActivity({ nodeId: "intro", stepId: "intro-practice", activityId: "intro-practice-meaning", selectedOptionId: "eu-me-chamo", clientEventId: sharedEventId }),
      otherUser.lesson.submitActivity({ nodeId: "intro", stepId: "intro-practice", activityId: "intro-practice-meaning", selectedOptionId: "eu-me-chamo", clientEventId: sharedEventId }),
    ]);
    expect(sameEventA.node.id).toBe("intro");
    expect(sameEventB.node.id).toBe("intro");
  });
});
