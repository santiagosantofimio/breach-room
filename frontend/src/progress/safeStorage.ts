export interface KeyValueStore {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createSafeStore(resolveStorage: () => BrowserStorage): KeyValueStore {
  const memory = new Map<string, string>();

  return {
    read(key) {
      if (memory.has(key)) {
        return memory.get(key) ?? null;
      }
      try {
        return resolveStorage().getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      memory.set(key, value);
      try {
        resolveStorage().setItem(key, value);
      } catch {
        return;
      }
    },
    remove(key) {
      memory.delete(key);
      try {
        resolveStorage().removeItem(key);
      } catch {
        return;
      }
    },
  };
}

export const browserStore = createSafeStore(() => window.localStorage);
