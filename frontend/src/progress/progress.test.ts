import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  loadProgress,
  markSolved,
  nextRoom,
  revealNextHint,
  saveProgress,
  startGame,
  type Progress,
} from "./progress";
import { createSafeStore, type KeyValueStore } from "./safeStorage";

function emptyStore(): KeyValueStore {
  return createSafeStore(() => {
    throw new Error("no persistent storage in this test");
  });
}

function storeHolding(serialized: string): KeyValueStore {
  const store = emptyStore();
  store.write("breach-room.progress", serialized);
  return store;
}

describe("progress", () => {
  it("starts empty", () => {
    expect(loadProgress(emptyStore())).toEqual(EMPTY_PROGRESS);
  });

  it("survives a save and load round trip", () => {
    const store = emptyStore();
    const progress: Progress = { startedAt: 1000, solvedRooms: ["recon"], hintsUsed: { recon: 2 } };

    saveProgress(store, progress);

    expect(loadProgress(store)).toEqual(progress);
  });

  it("falls back to empty on corrupted json", () => {
    expect(loadProgress(storeHolding("{not json"))).toEqual(EMPTY_PROGRESS);
  });

  it("falls back to empty on a value of the wrong shape", () => {
    expect(loadProgress(storeHolding("null"))).toEqual(EMPTY_PROGRESS);
    expect(loadProgress(storeHolding("42"))).toEqual(EMPTY_PROGRESS);
  });

  it("drops unknown rooms, duplicates and invalid hint counts", () => {
    const tampered = JSON.stringify({
      startedAt: "yesterday",
      solvedRooms: ["recon", "recon", "vault", 7],
      hintsUsed: { recon: 1, idor: -1, sqli: 1.5, vault: 3 },
    });

    expect(loadProgress(storeHolding(tampered))).toEqual({
      startedAt: null,
      solvedRooms: ["recon"],
      hintsUsed: { recon: 1 },
    });
  });

  it("points to the first unsolved room", () => {
    expect(nextRoom(EMPTY_PROGRESS)).toBe("recon");
    expect(nextRoom({ ...EMPTY_PROGRESS, solvedRooms: ["recon", "checkout"] })).toBe("cookiejar");
  });

  it("has no next room once all are solved", () => {
    const solvedRooms: Progress["solvedRooms"] = [
      "recon",
      "checkout",
      "cookiejar",
      "idor",
      "sqli",
      "xss",
      "traversal",
      "jwt",
      "cmdinjection",
    ];

    expect(nextRoom({ ...EMPTY_PROGRESS, solvedRooms })).toBeNull();
  });

  it("keeps the first start time", () => {
    const started = startGame(EMPTY_PROGRESS, 1000);

    expect(started.startedAt).toBe(1000);
    expect(startGame(started, 2000).startedAt).toBe(1000);
  });

  it("marks a room solved only once", () => {
    const solved = markSolved(markSolved(EMPTY_PROGRESS, "recon"), "recon");

    expect(solved.solvedRooms).toEqual(["recon"]);
  });

  it("reveals hints one at a time up to the room's limit", () => {
    const once = revealNextHint(EMPTY_PROGRESS, "idor", 2);
    const twice = revealNextHint(once, "idor", 2);

    expect(once.hintsUsed.idor).toBe(1);
    expect(twice.hintsUsed.idor).toBe(2);
    expect(revealNextHint(twice, "idor", 2).hintsUsed.idor).toBe(2);
  });
});
