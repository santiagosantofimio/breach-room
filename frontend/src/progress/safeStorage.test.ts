import { describe, expect, it } from "vitest";
import { createSafeStore } from "./safeStorage";

function inMemoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
  };
}

function throwingStorage() {
  const fail = () => {
    throw new Error("storage is blocked");
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

describe("createSafeStore", () => {
  it("persists through the underlying storage", () => {
    const storage = inMemoryStorage();

    createSafeStore(() => storage).write("key", "value");

    expect(createSafeStore(() => storage).read("key")).toBe("value");
  });

  it("keeps working in memory when storage throws", () => {
    const store = createSafeStore(throwingStorage);

    store.write("key", "value");

    expect(store.read("key")).toBe("value");
  });

  it("keeps working when storage cannot even be resolved", () => {
    const store = createSafeStore(() => {
      throw new Error("access denied");
    });

    expect(store.read("missing")).toBeNull();
    store.write("key", "value");
    expect(store.read("key")).toBe("value");
  });

  it("forgets removed values even when storage throws", () => {
    const store = createSafeStore(throwingStorage);
    store.write("key", "value");

    store.remove("key");

    expect(store.read("key")).toBeNull();
  });
});
