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
        { nodeId: "intro", status: "completed", progressPercent: 100, completedAt: new Date() },
      ],
    ]);

    expect(getNodeStatus(MVP_NODES[0]!, progress)).toBe("completed");
    expect(getNodeStatus(MVP_NODES[1]!, progress)).toBe("available");
    expect(getRecommendedNode(MVP_NODES, progress).id).toBe("identity");
  });

  it("awards XP once and never regresses a completed node", () => {
    const first = applyActivityCompletion(
      { nodeId: "intro", status: "in_progress", progressPercent: 35, completedAt: null },
      { xp: 0, streakDays: 0, completedNodeCount: 0 },
      true,
      new Date("2026-09-02T12:00:00Z"),
    );
    const repeatedWrong = applyActivityCompletion(
      first.nodeProgress,
      first.userProgress,
      false,
      new Date("2026-09-02T12:01:00Z"),
    );

    expect(first.xpAwarded).toBe(40);
    expect(first.userProgress).toMatchObject({ xp: 40, completedNodeCount: 1 });
    expect(repeatedWrong.xpAwarded).toBe(0);
    expect(repeatedWrong.nodeProgress).toMatchObject({ status: "completed", progressPercent: 100 });
  });
});
