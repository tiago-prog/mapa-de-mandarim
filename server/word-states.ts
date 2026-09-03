import type { WordStateSnapshot } from "./domain/vocabulary";

const memoryWordStates = new Map<number, Map<string, WordStateSnapshot>>();

function getMemoryWordStates(userId: number): Map<string, WordStateSnapshot> {
  const existing = memoryWordStates.get(userId);
  if (existing) return existing;

  const created = new Map<string, WordStateSnapshot>();
  memoryWordStates.set(userId, created);
  return created;
}

export function getMemoryWordState(userId: number, lexicalEntryId: string): WordStateSnapshot | undefined {
  return getMemoryWordStates(userId).get(lexicalEntryId);
}

export function setMemoryWordState(userId: number, lexicalEntryId: string, state: WordStateSnapshot): void {
  getMemoryWordStates(userId).set(lexicalEntryId, state);
}
