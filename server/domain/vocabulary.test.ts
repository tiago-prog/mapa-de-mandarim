import { describe, expect, it } from "vitest";

import { applyVocabularyExposure, getVocabularyEntryIdsForNode } from "./vocabulary";

describe("vocabulary exposure domain", () => {
  it("promotes new words to learning and updates their last exposure", () => {
    const seenAt = new Date("2026-09-03T18:00:00Z");
    const current = new Map([
      ["known-word", { status: "known" as const, lastSeenAt: new Date("2026-09-01T12:00:00Z") }],
      ["new-word", { status: "new" as const, lastSeenAt: null }],
    ]);

    const next = applyVocabularyExposure(current, ["new-word", "known-word"], seenAt);

    expect(next.get("new-word")).toEqual({ status: "learning", lastSeenAt: seenAt });
    expect(next.get("known-word")).toEqual({ status: "known", lastSeenAt: seenAt });
  });

  it("is idempotent for repeated entry ids and does not create unrelated states", () => {
    const seenAt = new Date("2026-09-03T18:00:00Z");
    const next = applyVocabularyExposure(new Map(), ["word", "word", "word"], seenAt);

    expect([...next.entries()]).toEqual([["word", { status: "learning", lastSeenAt: seenAt }]]);
  });

  it("extracts the vocabulary step for a node without duplicating entries", () => {
    const steps = [
      { nodeId: "intro", content: { kind: "objective" } },
      { nodeId: "intro", content: { kind: "vocabulary", entryIds: ["nihao", "wo", "nihao"] } },
      { nodeId: "other", content: { kind: "vocabulary", entryIds: ["other-word"] } },
    ];

    expect(getVocabularyEntryIdsForNode(steps, "intro")).toEqual(["nihao", "wo"]);
  });
});
