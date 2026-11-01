import { describe, expect, it } from "vitest";
import {
  base64Decode,
  base64Encode,
  crackJwtSecret,
  hexDecode,
  hexEncode,
  hmacSha256Base64Url,
  jwtDecode,
  jwtEncode,
  urlDecode,
  urlEncode,
} from "./decoders";

const RFC_7515_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("base64", () => {
  it("round trips text beyond ascii", () => {
    expect(base64Decode(base64Encode("contraseña ✓"))).toBe("contraseña ✓");
  });

  it("decodes the room's profile cookie", () => {
    expect(base64Decode("eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoiZ3Vlc3QifQ==")).toBe('{"user":"guest","role":"guest"}');
  });

  it("accepts url safe input without padding", () => {
    expect(base64Decode("Pz8_")).toBe("???");
  });

  it("rejects invalid input", () => {
    expect(() => base64Decode("not base64!")).toThrow();
  });
});

describe("url encoding", () => {
  it("round trips reserved characters", () => {
    expect(urlEncode("a b&c=d")).toBe("a%20b%26c%3Dd");
    expect(urlDecode("a%20b%26c%3Dd")).toBe("a b&c=d");
  });
});

describe("hex", () => {
  it("round trips text", () => {
    expect(hexEncode("Key")).toBe("4b6579");
    expect(hexDecode("4b 65 79")).toBe("Key");
  });

  it("rejects odd or non hex input", () => {
    expect(() => hexDecode("abc")).toThrow(RangeError);
    expect(() => hexDecode("zz")).toThrow(RangeError);
  });
});

describe("hmac", () => {
  it("matches the published RFC 4231 vector", async () => {
    await expect(hmacSha256Base64Url("Jefe", "what do ya want for nothing?")).resolves.toBe(
      "W9zBRr9gdU5qBCQmCJV1x1oAPwidJzmDnexYuWTsOEM",
    );
  });
});

describe("jwt", () => {
  it("decodes header and payload", () => {
    const decoded = jwtDecode(RFC_7515_TOKEN);

    expect(JSON.parse(decoded.header).alg).toBe("HS256");
    expect(JSON.parse(decoded.payload).name).toBe("John Doe");
  });

  it("rejects text that is not a token", () => {
    expect(() => jwtDecode("nonsense")).toThrow(RangeError);
  });

  it("builds an unsigned token", async () => {
    const token = await jwtEncode("none", '{"role":"admin"}', "");

    expect(token.endsWith(".")).toBe(true);
    expect(JSON.parse(jwtDecode(token).header).alg).toBe("none");
  });

  it("signs a token that the cracker can verify", async () => {
    const token = await jwtEncode("HS256", '{"role":"admin"}', "letmein");

    await expect(crackJwtSecret(token, ["password", "letmein"])).resolves.toBe("letmein");
  });

  it("reports when no candidate matches", async () => {
    await expect(crackJwtSecret(RFC_7515_TOKEN, ["password"])).resolves.toBeNull();
  });

  it("rejects a payload that is not json", async () => {
    await expect(jwtEncode("none", "{oops", "")).rejects.toThrow(SyntaxError);
  });
});
