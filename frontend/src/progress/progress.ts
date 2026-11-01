import { isRoomSlug, ROOM_SLUGS, type RoomSlug } from "../rooms/rooms";
import type { KeyValueStore } from "./safeStorage";

const PROGRESS_KEY = "breach-room.progress";
const COOKIES_KEY_PREFIX = "breach-room.cookies.";

export interface Progress {
  startedAt: number | null;
  finishedAt: number | null;
  solvedRooms: RoomSlug[];
  hintsUsed: Partial<Record<RoomSlug, number>>;
}

export const EMPTY_PROGRESS: Progress = { startedAt: null, finishedAt: null, solvedRooms: [], hintsUsed: {} };

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

export function startGame(progress: Progress, now: number): Progress {
  return progress.startedAt === null ? { ...progress, startedAt: now } : progress;
}

export function markSolved(progress: Progress, slug: RoomSlug, now: number): Progress {
  if (progress.solvedRooms.includes(slug)) {
    return progress;
  }
  const solvedRooms = [...progress.solvedRooms, slug];
  return { ...progress, solvedRooms, finishedAt: solvedRooms.length === ROOM_SLUGS.length ? now : null };
}

export function totalHints(progress: Progress): number {
  return Object.values(progress.hintsUsed).reduce((total, count) => total + count, 0);
}

export function clearGame(store: KeyValueStore): void {
  store.remove(PROGRESS_KEY);
  ROOM_SLUGS.forEach((slug) => store.remove(`${COOKIES_KEY_PREFIX}${slug}`));
}

export function revealNextHint(progress: Progress, slug: RoomSlug, hintsInRoom: number): Progress {
  const revealed = progress.hintsUsed[slug] ?? 0;
  return revealed >= hintsInRoom
    ? progress
    : { ...progress, hintsUsed: { ...progress.hintsUsed, [slug]: revealed + 1 } };
}

function sanitize(candidate: unknown): Progress {
  if (typeof candidate !== "object" || candidate === null) {
    return EMPTY_PROGRESS;
  }
  const { startedAt, finishedAt, solvedRooms, hintsUsed } = candidate as Record<string, unknown>;
  return {
    startedAt: typeof startedAt === "number" ? startedAt : null,
    finishedAt: typeof finishedAt === "number" ? finishedAt : null,
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
