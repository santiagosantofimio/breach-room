import { useCallback, useState } from "react";
import { API_ORIGIN } from "../api/client";
import { browserStore } from "../progress/safeStorage";
import type { RoomSlug } from "../rooms/rooms";
import { cookieHeader, loadCookies, saveCookies, withIssuedCookie, type CookieJar } from "./roomCookies";
import {
  sendTargetRequest,
  SET_ROOM_COOKIE_HEADER,
  type TargetRequest,
  type TargetResponse,
} from "./targetClient";

export type TargetOutcome =
  | { kind: "response"; response: TargetResponse }
  | { kind: "outside" }
  | { kind: "unreachable" };

const dependencies = {
  fetcher: ((input, init) => fetch(input, init)) as typeof fetch,
  store: browserStore,
  apiOrigin: API_ORIGIN,
};

export function useTarget(slug: RoomSlug) {
  const [cookies, setCookies] = useState<CookieJar>(() => loadCookies(browserStore, slug));

  const updateCookies = useCallback(
    (next: CookieJar) => {
      saveCookies(browserStore, slug, next);
      setCookies(next);
    },
    [slug],
  );

  const send = useCallback(
    async (request: TargetRequest): Promise<TargetOutcome> => {
      try {
        const response = await sendTargetRequest(dependencies, request, cookieHeader(cookies));
        const issued = response.headers.find(([name]) => name === SET_ROOM_COOKIE_HEADER)?.[1];
        if (issued !== undefined) {
          updateCookies(withIssuedCookie(cookies, issued));
        }
        return { kind: "response", response };
      } catch (error) {
        return { kind: error instanceof RangeError ? "outside" : "unreachable" };
      }
    },
    [cookies, updateCookies],
  );

  return { cookies, updateCookies, send };
}

export async function submitFlag(slug: RoomSlug, flag: string): Promise<boolean> {
  const response = await sendTargetRequest(
    dependencies,
    {
      method: "POST",
      path: `/api/rooms/${slug}/flag`,
      headers: [["Content-Type", "application/json"]],
      body: JSON.stringify({ flag }),
    },
    null,
  );
  if (response.status !== 200) {
    throw new Error(`Flag request failed with status ${response.status}`);
  }
  return (JSON.parse(response.body) as { correct: boolean }).correct;
}
