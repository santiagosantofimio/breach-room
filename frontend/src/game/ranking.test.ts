import { describe, expect, it } from "vitest";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import { formatDuration, rankFor, RANKS } from "./ranking";

const MINUTE = 60_000;

describe("rankFor", () => {
  it("rewards a quick run without hints", () => {
    expect(rankFor(0, 10 * MINUTE)).toBe("chiefExitOfficer");
  });

  it("drops with hints", () => {
    expect(rankFor(3, 10 * MINUTE)).toBe("seniorDoorConsultant");
    expect(rankFor(4, 10 * MINUTE)).toBe("associateEscapist");
    expect(rankFor(10, 10 * MINUTE)).toBe("unpaidIntern");
  });

  it("drops when time runs long", () => {
    expect(rankFor(0, 24 * MINUTE)).toBe("chiefExitOfficer");
    expect(rankFor(0, 25 * MINUTE)).toBe("seniorDoorConsultant");
    expect(rankFor(0, 120 * MINUTE)).toBe("unpaidIntern");
  });
});

describe("formatDuration", () => {
  it("shows minutes and seconds", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(83_000)).toBe("01:23");
  });

  it("adds hours when needed", () => {
    expect(formatDuration(62 * MINUTE)).toBe("1:02:00");
  });

  it("never goes negative", () => {
    expect(formatDuration(-5_000)).toBe("00:00");
  });
});

describe("rank names", () => {
  it.each([
    ["en", en],
    ["es", es],
  ])("%s names every rank", (_language, dictionary) => {
    for (const rank of RANKS) {
      expect(dictionary.finale.ranks[rank]).not.toBe("");
    }
  });
});
