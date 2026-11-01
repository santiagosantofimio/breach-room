import { describe, expect, it, vi } from "vitest";
import { createSafeStore } from "../progress/safeStorage";
import { parseHeaderLines, resolveTargetUrl, sendTargetRequest, type TargetRequest } from "./targetClient";

const API = "https://api.example.test";

function emptyStore() {
  const store = createSafeStore(() => {
    throw new Error("no persistent storage in this test");
  });
  store.write("breach-room.session", "stored-token");
  return store;
}

function getRequest(path: string): TargetRequest {
  return { method: "GET", path, headers: [], body: "" };
}

function sentHeaders(fetcher: ReturnType<typeof vi.fn>, call = 0) {
  return (fetcher.mock.calls[call]?.[1] as RequestInit).headers as Headers;
}

describe("resolveTargetUrl", () => {
  it("accepts room paths", () => {
    expect(resolveTargetUrl("/api/rooms/recon/robots.txt", API)?.href).toBe(`${API}/api/rooms/recon/robots.txt`);
  });

  it("refuses paths outside the rooms", () => {
    expect(resolveTargetUrl("/api/session", API)).toBeNull();
    expect(resolveTargetUrl("/api/rooms/../session", API)).toBeNull();
    expect(resolveTargetUrl("/api/rooms/%2e%2e/session", API)).toBeNull();
  });

  it("refuses other hosts", () => {
    expect(resolveTargetUrl("https://example.org/api/rooms/recon/", API)).toBeNull();
    expect(resolveTargetUrl("//example.org/api/rooms/recon/", API)).toBeNull();
  });

  it("refuses unparsable input", () => {
    expect(resolveTargetUrl("http://", API)).toBeNull();
  });
});

describe("parseHeaderLines", () => {
  it("reads one header per line and keeps colons in values", () => {
    expect(parseHeaderLines("Content-Type: application/json\nX-Note: a:b")).toEqual([
      ["Content-Type", "application/json"],
      ["X-Note", "a:b"],
    ]);
  });

  it("skips lines without a name", () => {
    expect(parseHeaderLines("\nnot a header\n: value")).toEqual([]);
  });
});

describe("sendTargetRequest", () => {
  it("sends the session and the room cookie", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));

    await sendTargetRequest(
      { fetcher, store: emptyStore(), apiOrigin: API },
      getRequest("/api/rooms/cookiejar/locker"),
      "profile=abc",
    );

    expect(sentHeaders(fetcher).get("X-Breach-Session")).toBe("stored-token");
    expect(sentHeaders(fetcher).get("X-Room-Cookie")).toBe("profile=abc");
  });

  it("lets a hand-written cookie header win over the jar", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));

    await sendTargetRequest(
      { fetcher, store: emptyStore(), apiOrigin: API },
      { ...getRequest("/api/rooms/cookiejar/locker"), headers: [["X-Room-Cookie", "profile=mine"]] },
      "profile=jar",
    );

    expect(sentHeaders(fetcher).get("X-Room-Cookie")).toBe("profile=mine");
  });

  it("returns status, headers and body", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("page", { status: 403, headers: { "X-Kryptelia-Debug": "value" } }));

    const response = await sendTargetRequest(
      { fetcher, store: emptyStore(), apiOrigin: API },
      getRequest("/api/rooms/recon/"),
      null,
    );

    expect(response.status).toBe(403);
    expect(response.body).toBe("page");
    expect(response.headers).toContainEqual(["x-kryptelia-debug", "value"]);
  });

  it("omits the body on GET and sends it on POST", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response("ok"));
    const dependencies = { fetcher, store: emptyStore(), apiOrigin: API };

    await sendTargetRequest(dependencies, { ...getRequest("/api/rooms/idor/documents"), body: "ignored" }, null);
    await sendTargetRequest(
      dependencies,
      { method: "post", path: "/api/rooms/checkout/purchase", headers: [], body: "{}" },
      null,
    );

    expect(fetcher.mock.calls[0]?.[1]?.body).toBeUndefined();
    expect(fetcher.mock.calls[1]?.[1]?.method).toBe("POST");
    expect(fetcher.mock.calls[1]?.[1]?.body).toBe("{}");
  });

  it("opens a new session once when the stored one is rejected", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "fresh-token" }), { status: 201 }))
      .mockResolvedValueOnce(new Response("ok"));

    const response = await sendTargetRequest(
      { fetcher, store: emptyStore(), apiOrigin: API },
      getRequest("/api/rooms/recon/"),
      null,
    );

    expect(response.status).toBe(200);
    expect(sentHeaders(fetcher, 2).get("X-Breach-Session")).toBe("fresh-token");
  });

  it("refuses to leave the target", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      sendTargetRequest({ fetcher, store: emptyStore(), apiOrigin: API }, getRequest("/api/session"), null),
    ).rejects.toThrow(RangeError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
