import { describe, expect, it } from "vitest";

import { getDictionaryEntry, searchDictionary, setDictionaryEntryStatus } from "./dictionary";

describe("dictionary", () => {
  const userId = 987654;

  it("searches by hanzi, pinyin and Portuguese meaning", async () => {
    const byHanzi = await searchDictionary(userId, "我叫", 10);
    const byPinyin = await searchDictionary(userId, "wǒ jiào", 10);
    const byMeaning = await searchDictionary(userId, "me chamo", 10);

    expect(byHanzi.some((entry) => entry.id === "wo-jiao")).toBe(true);
    expect(byPinyin.some((entry) => entry.id === "wo-jiao")).toBe(true);
    expect(byMeaning.some((entry) => entry.id === "wo-jiao")).toBe(true);
  });

  it("persists the personal status of a word in the local repository", async () => {
    const updated = await setDictionaryEntryStatus(userId, "wo-jiao", "known");
    const loaded = await getDictionaryEntry(userId, "wo-jiao");

    expect(updated.status).toBe("known");
    expect(loaded?.status).toBe("known");
    expect(loaded?.lastSeenAt).toBeInstanceOf(Date);
  });
});
