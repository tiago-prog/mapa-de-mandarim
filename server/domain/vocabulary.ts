export type WordStatus = "new" | "known" | "learning";

export type WordStateSnapshot = {
  status: WordStatus;
  lastSeenAt: Date | null;
};

/**
 * Applies a learning exposure without confusing exposure with mastery.
 * Known words stay known; new words become learning.
 */
export function applyVocabularyExposure(
  currentStates: ReadonlyMap<string, WordStateSnapshot>,
  entryIds: readonly string[],
  seenAt: Date,
): Map<string, WordStateSnapshot> {
  const nextStates = new Map(currentStates);
  const uniqueEntryIds = new Set(entryIds);

  for (const entryId of uniqueEntryIds) {
    const previousState = nextStates.get(entryId);
    nextStates.set(entryId, {
      status: previousState?.status === "known" ? "known" : "learning",
      lastSeenAt: seenAt,
    });
  }

  return nextStates;
}

export function getVocabularyEntryIdsForNode(
  steps:   ReadonlyArray<{ nodeId: string; content: { kind: string; entryIds?: string[] } }>,
  nodeId: string,
): string[] {
  const vocabularyStep = steps.find((step) => step.nodeId === nodeId && step.content.kind === "vocabulary");
  return [...new Set(vocabularyStep?.content.entryIds ?? [])];
}
