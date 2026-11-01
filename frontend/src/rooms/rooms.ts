export const ROOM_SLUGS = [
  "recon",
  "checkout",
  "cookiejar",
  "idor",
  "sqli",
  "xss",
  "traversal",
  "jwt",
  "cmdinjection",
] as const;

export type RoomSlug = (typeof ROOM_SLUGS)[number];

export function isRoomSlug(value: unknown): value is RoomSlug {
  return ROOM_SLUGS.includes(value as RoomSlug);
}
