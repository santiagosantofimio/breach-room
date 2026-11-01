import { describe, expect, it } from "vitest";
import { createSafeStore } from "../progress/safeStorage";
import { cookieHeader, loadCookies, saveCookies, withIssuedCookie } from "./roomCookies";

function emptyStore() {
  return createSafeStore(() => {
    throw new Error("no persistent storage in this test");
  });
}

describe("room cookies", () => {
  it("round trips per room", () => {
    const store = emptyStore();

    saveCookies(store, "cookiejar", { profile: "abc" });

    expect(loadCookies(store, "cookiejar")).toEqual({ profile: "abc" });
    expect(loadCookies(store, "recon")).toEqual({});
  });

  it("falls back to an empty jar on corrupted data", () => {
    const store = emptyStore();
    store.write("breach-room.cookies.recon", "{oops");

    expect(loadCookies(store, "recon")).toEqual({});
  });

  it("builds a header only when the jar has cookies", () => {
    expect(cookieHeader({})).toBeNull();
    expect(cookieHeader({ profile: "abc=" })).toBe("profile=abc=");
  });

  it("keeps base64 padding when storing an issued cookie", () => {
    expect(withIssuedCookie({}, "profile=e30=")).toEqual({ profile: "e30=" });
  });

  it("ignores missing or malformed issued cookies", () => {
    expect(withIssuedCookie({ a: "1" }, undefined)).toEqual({ a: "1" });
    expect(withIssuedCookie({ a: "1" }, "no-separator")).toEqual({ a: "1" });
  });
});
