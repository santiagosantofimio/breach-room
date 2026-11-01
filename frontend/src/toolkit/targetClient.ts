import { clearSessionToken, ensureSessionToken, SESSION_HEADER } from "../api/client";
import type { KeyValueStore } from "../progress/safeStorage";

const ROOMS_PATH_PREFIX = "/api/rooms/";
const UNAUTHORIZED = 401;
const METHODS_WITHOUT_BODY = ["GET", "HEAD"];

export const ROOM_COOKIE_HEADER = "X-Room-Cookie";
export const SET_ROOM_COOKIE_HEADER = "x-set-room-cookie";

export interface TargetRequest {
  method: string;
  path: string;
  headers: [string, string][];
  body: string;
}

export interface TargetResponse {
  status: number;
  headers: [string, string][];
  body: string;
}

export interface TargetDependencies {
  fetcher: typeof fetch;
  store: KeyValueStore;
  apiOrigin: string;
}

export function resolveTargetUrl(path: string, apiOrigin: string): URL | null {
  try {
    const url = new URL(path, apiOrigin);
    const staysOnTarget = url.origin === new URL(apiOrigin).origin;
    return staysOnTarget && url.pathname.startsWith(ROOMS_PATH_PREFIX) ? url : null;
  } catch {
    return null;
  }
}

export function parseHeaderLines(text: string): [string, string][] {
  return text.split("\n").flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) {
      return [];
    }
    return [[line.slice(0, separator).trim(), line.slice(separator + 1).trim()] as [string, string]];
  });
}

export async function sendTargetRequest(
  dependencies: TargetDependencies,
  request: TargetRequest,
  roomCookie: string | null,
): Promise<TargetResponse> {
  const response = await attempt(dependencies, request, roomCookie);
  if (response.status !== UNAUTHORIZED) {
    return response;
  }
  clearSessionToken(dependencies.store);
  return attempt(dependencies, request, roomCookie);
}

async function attempt(
  { fetcher, store, apiOrigin }: TargetDependencies,
  request: TargetRequest,
  roomCookie: string | null,
): Promise<TargetResponse> {
  const url = resolveTargetUrl(request.path, apiOrigin);
  if (url === null) {
    throw new RangeError(`Outside the target: ${request.path}`);
  }
  const headers = new Headers(request.headers);
  headers.set(SESSION_HEADER, await ensureSessionToken(fetcher, store));
  if (roomCookie !== null && !headers.has(ROOM_COOKIE_HEADER)) {
    headers.set(ROOM_COOKIE_HEADER, roomCookie);
  }
  const method = request.method.toUpperCase();
  const response = await fetcher(url, {
    method,
    headers,
    body: METHODS_WITHOUT_BODY.includes(method) ? undefined : request.body,
  });
  return {
    status: response.status,
    headers: [...response.headers.entries()],
    body: await response.text(),
  };
}
