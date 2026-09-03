import { describe, expect, it } from "vitest";

import {
  applyActivityCompletion,
  getNodeStatus,
  getRecommendedNode,
  MVP_NODES,
  type NodeProgressSnapshot,
} from "./learning";

describe("learning domain", () => {
  it("unlocks only the first node when there is no progress", () => {
    const progress = new Map<string, NodeProgressSnapshot>();

    expect(getNodeStatus(MVP_NODES[0]!, progress)).toBe("available");
    expect(getNodeStatus(MVP_NODES[1]!, progress)).toBe("locked");
    expect(getRecommendedNode(MVP_NODES, progress).id).toBe("intro");
  });

  it("unlocks the next node after completing its prerequisite", () => {
    const progress = new Map<string, NodeProgressSnapshot>([
      [
        "intro",
        { nodeId: "intro", status: "completed", progressPercent: 100, completedActivityIds: ["a", "b"], completedAt: new Date() },
      ],
    ]);

    expect(getNodeStatus(MVP_NODES[0]!, progress)).toBe("completed");
    expect(getNodeStatus(MVP_NODES[1]!, progress)).toBe("available");
    expect(getRecommendedNode(MVP_NODES, progress).id).toBe("identity");
  });

  it("increments node progress and completes only after all activities", () => {
    const initial = {
      nodeId: "intro",
      status: "in_progress" as const,
      progressPercent: 0,
      completedActivityIds: [],
      completedAt: null,
    };
    const first = applyActivityCompletion(initial, "activity-1", { xp: 0, streakDays: 0, completedNodeCount: 0 }, true, new Date("2026-09-02T12:00:00Z"), 3);
    const second = applyActivityCompletion(first.nodeProgress, "activity-2", first.userProgress, true, new Date("2026-09-02T12:01:00Z"), 3);
    const final = applyActivityCompletion(second.nodeProgress, "activity-3", second.userProgress, true, new Date("2026-09-02T12:02:00Z"), 3);

    expect(first.xpAwarded).toBe(15);
    expect(first.nodeProgress).toMatchObject({ status: "in_progress", progressPercent: 33, completedActivityIds: ["activity-1"] });
    expect(second.nodeProgress).toMatchObject({ status: "in_progress", progressPercent: 67, completedActivityIds: ["activity-1", "activity-2"] });
    expect(final.xpAwarded).toBe(15);
    expect(final.nodeProgress).toMatchObject({ status: "completed", progressPercent: 100 });
    expect(final.userProgress).toMatchObject({ xp: 45, completedNodeCount: 1 });
  });

  it("does not award XP twice for the same activity", () => {
    const progress = { nodeId: "intro", status: "in_progress" as const, progressPercent: 0, completedActivityIds: [], completedAt: null };
    const first = applyActivityCompletion(progress, "activity-1", { xp: 0, streakDays: 0, completedNodeCount: 0 }, true, new Date(), 1);
    const repeated = applyActivityCompletion(first.nodeProgress, "activity-1", first.userProgress, true, new Date(), 1);

    expect(first.xpAwarded).toBe(15);
    expect(repeated.xpAwarded).toBe(0);
    expect(repeated.userProgress.xp).toBe(15);
    expect(repeated.nodeProgress.status).toBe("completed");
  });
});
