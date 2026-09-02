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

describe("learning vertical slice", () => {
  it("loads the first node, completes its lesson and unlocks the next node", async () => {
    const caller = appRouter.createCaller(createContext());
    const initialMap = await caller.learningMap.get();
    const firstNode = initialMap.nodes.find((node) => node.id === "intro");

    expect(initialMap.recommendedNodeId).toBe("intro");
    expect(firstNode?.status).toBe("available");

    const lesson = await caller.lesson.get({ nodeId: "intro" });
    expect(lesson.activity?.correctOptionId).toBe("eu-me-chamo");

    const submission = await caller.lesson.submitActivity({
      nodeId: "intro",
      activityId: lesson.activity!.id,
      selectedOptionId: "eu-me-chamo",
      clientEventId: "integration-intro-20260902",
    });

    expect(submission.isCorrect).toBe(true);
    expect(submission.xpAwarded).toBe(40);
    expect(submission.userProgress.completedNodeCount).toBe(1);

    const updatedMap = await caller.learningMap.get();
    expect(updatedMap.nodes.find((node) => node.id === "intro")?.status).toBe("completed");
    expect(updatedMap.nodes.find((node) => node.id === "identity")?.status).toBe("available");
    expect(updatedMap.recommendedNodeId).toBe("identity");
  });
});
