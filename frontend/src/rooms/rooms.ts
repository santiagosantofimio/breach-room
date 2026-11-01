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

export const PLAYABLE_ROOMS: readonly RoomSlug[] = [
  "recon",
  "checkout",
  "cookiejar",
  "idor",
  "sqli",
  "xss",
  "traversal",
];

export function isPlayable(slug: RoomSlug): boolean {
  return PLAYABLE_ROOMS.includes(slug);
}

export const ROOM_ENTRY_PATHS: Partial<Record<RoomSlug, string>> = {
  recon: "/api/rooms/recon/",
  checkout: "/api/rooms/checkout/catalog",
  cookiejar: "/api/rooms/cookiejar/locker",
  idor: "/api/rooms/idor/documents",
  sqli: "/api/rooms/sqli/employees?search=Quill",
  xss: "/api/rooms/xss/inbox?subject=quarterly",
  traversal: "/api/rooms/traversal/",
};
