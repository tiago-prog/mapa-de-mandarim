import { describe, expect, it } from "vitest";

import { applyWordExposure } from "./vocabulary";

describe("vocabulary exposure policy", () => {
  it("marks a new exposure as learning and records when it was seen", () => {
    const seenAt = new Date("2026-09-03T12:00:00.000Z");

    expect(applyWordExposure(undefined, seenAt)).toEqual({
      status: "learning",
      lastSeenAt: seenAt,
    });
  });

  it("preserves known when the word appears in another lesson", () => {
    const seenAt = new Date("2026-09-03T12:05:00.000Z");

    expect(
      applyWordExposure(
        { status: "known", lastSeenAt: new Date("2026-09-02T12:00:00.000Z") },
        seenAt,
      ),
    ).toEqual({
      status: "known",
      lastSeenAt: seenAt,
    });
  });
});
