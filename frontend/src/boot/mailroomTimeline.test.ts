import { describe, expect, it } from "vitest";
import { en } from "../i18n/en";
import { es } from "../i18n/es";
import { formatQueueTime, MAILROOM_LINE_SECONDS, revealedCount, STAMP_SECONDS } from "./mailroomTimeline";

describe("revealedCount", () => {
  it("reveals the first line immediately", () => {
    expect(revealedCount(MAILROOM_LINE_SECONDS, 0)).toBe(1);
  });

  it("reveals nothing before the first scheduled moment", () => {
    expect(revealedCount(STAMP_SECONDS, 3)).toBe(0);
  });

  it("counts every moment already reached", () => {
    expect(revealedCount(MAILROOM_LINE_SECONDS, 14)).toBe(3);
  });

  it("stops at the end of the schedule", () => {
    expect(revealedCount(MAILROOM_LINE_SECONDS, 10_000)).toBe(MAILROOM_LINE_SECONDS.length);
  });
});

describe("formatQueueTime", () => {
  it("pads minutes and seconds", () => {
    expect(formatQueueTime(0)).toBe("00:00");
    expect(formatQueueTime(9)).toBe("00:09");
    expect(formatQueueTime(83)).toBe("01:23");
  });
});

describe("dictionaries", () => {
  it.each([
    ["en", en],
    ["es", es],
  ])("%s has one line per scheduled moment", (_language, dictionary) => {
    expect(dictionary.mailroom.lines).toHaveLength(MAILROOM_LINE_SECONDS.length);
    expect(dictionary.mailroom.stamps).toHaveLength(STAMP_SECONDS.length);
  });
});
