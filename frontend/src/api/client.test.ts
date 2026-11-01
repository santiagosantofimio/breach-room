import { describe, expect, it, vi } from "vitest";
import { createSafeStore } from "../progress/safeStorage";
import { ensureSessionToken, isApiAwake } from "./client";

function emptyStore() {
  return createSafeStore(() => {
    throw new Error("no persistent storage in this test");
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const neverAborted = new AbortController().signal;

describe("isApiAwake", () => {
  it("is true on a successful health response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ status: "ok" }));

    await expect(isApiAwake(fetcher, neverAborted)).resolves.toBe(true);
  });

  it("is false while the host answers with an error", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 503));

    await expect(isApiAwake(fetcher, neverAborted)).resolves.toBe(false);
  });

  it("is false on a network failure", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("failed to fetch"));

    await expect(isApiAwake(fetcher, neverAborted)).resolves.toBe(false);
  });
});

describe("ensureSessionToken", () => {
  it("requests a token and stores it", async () => {
    const store = emptyStore();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ token: "issued" }, 201));

    await expect(ensureSessionToken(fetcher, store)).resolves.toBe("issued");
    await expect(ensureSessionToken(fetcher, store)).resolves.toBe("issued");

    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("does not store anything when the request fails", async () => {
    const store = emptyStore();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 429));

    await expect(ensureSessionToken(fetcher, store)).rejects.toThrow("429");
    expect(store.read("breach-room.session")).toBeNull();
  });
});
