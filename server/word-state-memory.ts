import type { WordStatus } from "./domain/vocabulary";

export type MemoryWordState = {
  status: WordStatus;
  lastSeenAt: Date | null;
};

const memoryWordStates = new Map<number, Map<string, MemoryWordState>>();

export function getMemoryWordStates(userId: number): Map<string, MemoryWordState> {
  const existing = memoryWordStates.get(userId);
  if (existing) return existing;
  const created = new Map<string, MemoryWordState>();
  memoryWordStates.set(userId, created);
  return created;
}
