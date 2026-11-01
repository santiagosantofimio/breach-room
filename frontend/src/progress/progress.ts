import { isRoomSlug, ROOM_SLUGS, type RoomSlug } from "../rooms/rooms";
import type { KeyValueStore } from "./safeStorage";

const PROGRESS_KEY = "breach-room.progress";

export interface Progress {
  startedAt: number | null;
  solvedRooms: RoomSlug[];
  hintsUsed: Partial<Record<RoomSlug, number>>;
}

export const EMPTY_PROGRESS: Progress = { startedAt: null, solvedRooms: [], hintsUsed: {} };

export function loadProgress(store: KeyValueStore): Progress {
  const serialized = store.read(PROGRESS_KEY);
  if (serialized === null) {
    return EMPTY_PROGRESS;
  }
  try {
    return sanitize(JSON.parse(serialized));
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(store: KeyValueStore, progress: Progress): void {
  store.write(PROGRESS_KEY, JSON.stringify(progress));
}

export function nextRoom(progress: Progress): RoomSlug | null {
  return ROOM_SLUGS.find((slug) => !progress.solvedRooms.includes(slug)) ?? null;
}

function sanitize(candidate: unknown): Progress {
  if (typeof candidate !== "object" || candidate === null) {
    return EMPTY_PROGRESS;
  }
  const { startedAt, solvedRooms, hintsUsed } = candidate as Record<string, unknown>;
  return {
    startedAt: typeof startedAt === "number" ? startedAt : null,
    solvedRooms: Array.isArray(solvedRooms) ? [...new Set(solvedRooms.filter(isRoomSlug))] : [],
    hintsUsed: sanitizeHints(hintsUsed),
  };
}

function sanitizeHints(candidate: unknown): Progress["hintsUsed"] {
  if (typeof candidate !== "object" || candidate === null) {
    return {};
  }
  const validEntries = Object.entries(candidate).filter(
    ([slug, count]) => isRoomSlug(slug) && Number.isInteger(count) && count >= 0,
  );
  return Object.fromEntries(validEntries);
}
