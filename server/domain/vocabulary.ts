export type WordStatus = "new" | "known" | "learning";

export type WordStateSnapshot = {
  status: WordStatus;
  lastSeenAt: Date | null;
};

/**
 * Registers a learning exposure without treating exposure as mastery.
 * A manually known word remains known when it appears in a lesson again.
 */
export function applyWordExposure(
  currentState: WordStateSnapshot | undefined,
  seenAt: Date,
): WordStateSnapshot {
  return {
    status: currentState?.status === "known" ? "known" : "learning",
    lastSeenAt: seenAt,
  };
}
