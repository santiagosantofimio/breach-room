import type { KeyValueStore } from "../progress/safeStorage";
import type { RoomSlug } from "../rooms/rooms";

const COOKIES_KEY_PREFIX = "breach-room.cookies.";

export type CookieJar = Record<string, string>;

export function loadCookies(store: KeyValueStore, slug: RoomSlug): CookieJar {
  try {
    const parsed: unknown = JSON.parse(store.read(COOKIES_KEY_PREFIX + slug) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as CookieJar) : {};
  } catch {
    return {};
  }
}

export function saveCookies(store: KeyValueStore, slug: RoomSlug, jar: CookieJar): void {
  store.write(COOKIES_KEY_PREFIX + slug, JSON.stringify(jar));
}

export function cookieHeader(jar: CookieJar): string | null {
  const pairs = Object.entries(jar).map(([name, value]) => `${name}=${value}`);
  return pairs.length === 0 ? null : pairs.join("; ");
}

export function withIssuedCookie(jar: CookieJar, issued: string | undefined): CookieJar {
  const separator = issued?.indexOf("=") ?? -1;
  if (issued === undefined || separator < 1) {
    return jar;
  }
  return { ...jar, [issued.slice(0, separator)]: issued.slice(separator + 1) };
}
