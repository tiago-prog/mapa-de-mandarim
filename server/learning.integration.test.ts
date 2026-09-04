import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  const now = new Date("2026-09-03T12:00:00.000Z");
  return {
    user: {
      id: 42002,
      openId: "learning-test-42002",
      name: "Learning Test User",
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

describe("learning vertical slice", () => {
  it("loads the lesson plan, completes its activities and unlocks the next node", async () => {
    const caller = appRouter.createCaller(createContext());
    const initialMap = await caller.learningMap.get();
    const firstNode = initialMap.nodes.find((node) => node.id === "intro");

    expect(initialMap.recommendedNodeId).toBe("intro");
    expect(firstNode?.status).toBe("available");
    expect(firstNode?.stepCount).toBe(7);
    expect(firstNode?.activityCount).toBe(3);

    const objective = await caller.lesson.get({ nodeId: "intro" });
    expect(objective.step.kind).toBe("objective");
    expect(objective.activity).toBeNull();
    expect(objective.step.content.kind).toBe("objective");

    const context = await caller.lesson.get({ nodeId: "intro", stepId: "intro-context" });
    expect(context.step.kind).toBe("context");
    expect(context.activity).toBeNull();
    expect(context.step.content.kind).toBe("context");

    const practice = await caller.lesson.get({ nodeId: "intro", stepId: "intro-practice" });
    expect(practice.activity?.id).toBe("intro-practice-meaning");
    expect(practice.activity).not.toHaveProperty("correctOptionId");
    expect(practice.activity).not.toHaveProperty("correctOrder");

    const firstSubmission = await caller.lesson.submitActivity({
      nodeId: "intro",
      stepId: "intro-practice",
      activityId: "intro-practice-meaning",
      selectedOptionId: "eu-me-chamo",
      clientEventId: "integration-intro-meaning-20260902",
    });
    expect(firstSubmission.isCorrect).toBe(true);
    expect(firstSubmission.xpAwarded).toBe(15);
    expect(firstSubmission.node.progressPercent).toBe(33);

    expect(await caller.dictionary.myWords({})).toEqual([]);
    expect(await caller.review.getDue({ limit: 50 })).toEqual([]);

    const secondSubmission = await caller.lesson.submitActivity({
      nodeId: "intro",
      stepId: "intro-practice",
      activityId: "intro-practice-order",
      selectedOrder: ["我", "叫", "安娜"],
      clientEventId: "integration-intro-order-20260902",
    });
    expect(secondSubmission.isCorrect).toBe(true);
    expect(secondSubmission.node.progressPercent).toBe(67);

    const finalSubmission = await caller.lesson.submitActivity({
      nodeId: "intro",
      stepId: "intro-application",
      activityId: "intro-application-context",
      selectedOptionId: "answer-name",
      clientEventId: "integration-intro-application-20260902",
    });
    expect(finalSubmission.isCorrect).toBe(true);
    expect(finalSubmission.node.progressPercent).toBe(100);

    const exposedWords = await caller.dictionary.myWords({});
    expect(exposedWords.map((entry) => entry.id)).toEqual(expect.arrayContaining(["nihao", "wo-jiao", "wo", "ni", "shenme", "jiao", "mingzi"]));
    expect(exposedWords.find((entry) => entry.id === "wo-jiao")?.status).toBe("learning");
    const dueAfterExposure = await caller.review.getDue({ limit: 50 });
    expect(dueAfterExposure.some((card) => card.lexicalEntryId === "wo-jiao")).toBe(true);
    expect((await caller.today.get()).reviewDueCount).toBeGreaterThan(0);

    const manuallyKnown = await caller.dictionary.setStatus({ entryId: "nihao", status: "known" });
    expect(manuallyKnown.status).toBe("known");

    const wordsAfterRepeatedExposure = await caller.dictionary.myWords({});
    expect(wordsAfterRepeatedExposure.find((entry) => entry.id === "nihao")?.status).toBe("known");
    expect(wordsAfterRepeatedExposure.find((entry) => entry.id === "wo-jiao")?.lastSeenAt).toBeInstanceOf(Date);

    const updatedMap = await caller.learningMap.get();
    expect(updatedMap.nodes.find((node) => node.id === "intro")?.status).toBe("completed");
    expect(updatedMap.nodes.find((node) => node.id === "identity")?.status).toBe("available");
    expect(updatedMap.recommendedNodeId).toBe("identity");

    const fillBlank = await caller.lesson.get({ nodeId: "ask-name", stepId: "ask-name-practice", activityId: "ask-name-practice-fill" });
    expect(fillBlank.activity?.type).toBe("fill_blank");
    expect(fillBlank.activity).not.toHaveProperty("expectedAnswer");
    const fillSubmission = await caller.lesson.submitActivity({
      nodeId: "ask-name",
      stepId: "ask-name-practice",
      activityId: "ask-name-practice-fill",
      selectedOptionId: "什么。",
      clientEventId: "integration-ask-name-fill-20260902",
    });
    expect(fillSubmission.isCorrect).toBe(true);
    expect(fillSubmission.xpAwarded).toBe(15);

    const mission = await caller.lesson.get({ nodeId: "dialogue", stepId: "dialogue-application" });
    expect(mission.step.title).toBe("Missão final · diálogo completo");
    expect(mission.activity?.id).toBe("dialogue-application-greeting");
    expect(mission.activity).not.toHaveProperty("correctOptionId");

    const dialoguePractice = await caller.lesson.submitActivity({
      nodeId: "dialogue",
      stepId: "dialogue-practice",
      activityId: "dialogue-practice-meaning",
      selectedOptionId: "chamar",
      clientEventId: "integration-dialogue-practice-20260902",
    });
    expect(dialoguePractice.isCorrect).toBe(true);

    for (const [activityId, selectedOptionId] of [
      ["dialogue-application-greeting", "mission-greeting"],
      ["dialogue-application-name", "mission-name"],
      ["dialogue-application-question", "mission-question"],
    ] as const) {
      const submission = await caller.lesson.submitActivity({
        nodeId: "dialogue",
        stepId: "dialogue-application",
        activityId,
        selectedOptionId,
        clientEventId: `integration-${activityId}-20260902`,
      });
      expect(submission.isCorrect).toBe(true);
    }

    const completedMission = await caller.learningMap.getNode({ nodeId: "dialogue" });
    expect(completedMission.node.status).toBe("completed");
    expect(completedMission.node.progressPercent).toBe(100);
  });
});
