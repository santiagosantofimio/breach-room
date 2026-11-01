import { describe, expect, it } from "vitest";
import { DEBRIEF_CODE } from "../rooms/debriefCode";
import { ROOM_ENTRY_PATHS, PLAYABLE_ROOMS, ROOM_SLUGS } from "../rooms/rooms";
import { en } from "./en";
import { es } from "./es";

type Tree = { [key: string]: unknown };

function leaves(tree: unknown, path = ""): [string, unknown][] {
  if (typeof tree !== "object" || tree === null) {
    return [[path, tree]];
  }
  return Object.entries(tree as Tree).flatMap(([key, value]) => leaves(value, `${path}/${key}`));
}

describe("dictionaries", () => {
  it("have exactly the same keys", () => {
    const keysOf = (tree: unknown) => leaves(tree).map(([path]) => path).sort();

    expect(keysOf(es)).toEqual(keysOf(en));
  });

  it.each([
    ["en", en],
    ["es", es],
  ])("%s has no empty text", (_language, dictionary) => {
    const empty = leaves(dictionary)
      .filter(([path]) => !path.includes("/form/rows/"))
      .filter(([, value]) => typeof value !== "string" || value.trim() === "");

    expect(empty).toEqual([]);
  });

  it("translate the prose instead of copying it", () => {
    const untranslated = leaves(en.rooms)
      .filter(([path]) => /story|objective|hints|happened|why|detection/.test(path))
      .filter(([path, value]) => leaves(es.rooms).some(([otherPath, other]) => otherPath === path && other === value));

    expect(untranslated).toEqual([]);
  });
});

describe("rooms", () => {
  it("are all playable and complete", () => {
    expect([...PLAYABLE_ROOMS]).toEqual([...ROOM_SLUGS]);
    for (const slug of ROOM_SLUGS) {
      expect(en.rooms[slug]?.hints).toHaveLength(3);
      expect(es.rooms[slug]?.hints).toHaveLength(3);
      expect(DEBRIEF_CODE[slug]).toBeDefined();
      expect(ROOM_ENTRY_PATHS[slug]).toMatch(`/api/rooms/${slug}/`);
    }
  });

  it("show debrief code without comments", () => {
    for (const code of Object.values(DEBRIEF_CODE)) {
      expect(`${code.vulnerable}\n${code.corrected}`).not.toMatch(/(^|\s)\/\/|\/\*/);
    }
  });

  it("name a current OWASP category in every debrief", () => {
    for (const slug of ROOM_SLUGS) {
      expect(en.rooms[slug]?.debrief.owasp).toMatch(/^A(0[1-9]|10):2025 /);
      expect(es.rooms[slug]?.debrief.owasp).toBe(en.rooms[slug]?.debrief.owasp);
    }
  });
});
