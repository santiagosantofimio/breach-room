const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export type JwtAlgorithm = "none" | "HS256";

export interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
}

function binaryToBytes(binary: string): Uint8Array {
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toStandardBase64(value: string): string {
  const standard = value.trim().replaceAll("-", "+").replaceAll("_", "/");
  return standard.padEnd(standard.length + ((4 - (standard.length % 4)) % 4), "=");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(bytesToBinary(bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function base64Encode(text: string): string {
  return btoa(bytesToBinary(encoder.encode(text)));
}

export function base64Decode(value: string): string {
  return decoder.decode(binaryToBytes(atob(toStandardBase64(value))));
}

export function base64UrlEncode(text: string): string {
  return bytesToBase64Url(encoder.encode(text));
}

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(value: string): string {
  return decodeURIComponent(value);
}

export function hexEncode(text: string): string {
  return Array.from(encoder.encode(text), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexDecode(value: string): string {
  const compact = value.replace(/\s+/g, "");
  if (compact.length % 2 !== 0 || /[^0-9a-f]/i.test(compact)) {
    throw new RangeError("Not hexadecimal");
  }
  const pairs = compact.match(/../g) ?? [];
  return decoder.decode(Uint8Array.from(pairs, (pair) => Number.parseInt(pair, 16)));
}

export async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message))));
}

export function jwtDecode(token: string): DecodedJwt {
  const [header, payload, signature] = token.trim().split(".");
  if (header === undefined || payload === undefined) {
    throw new RangeError("Not a token");
  }
  return { header: base64Decode(header), payload: base64Decode(payload), signature: signature ?? "" };
}

export async function jwtEncode(
  algorithm: JwtAlgorithm,
  payloadJson: string,
  secret: string,
): Promise<string> {
  const signedPart = `${base64UrlEncode(JSON.stringify({ alg: algorithm, typ: "JWT" }))}.${base64UrlEncode(
    JSON.stringify(JSON.parse(payloadJson)),
  )}`;
  return algorithm === "none" ? `${signedPart}.` : `${signedPart}.${await hmacSha256Base64Url(secret, signedPart)}`;
}

export async function crackJwtSecret(token: string, wordlist: readonly string[]): Promise<string | null> {
  const separator = token.trim().lastIndexOf(".");
  const signedPart = token.trim().slice(0, separator);
  const signature = token.trim().slice(separator + 1);
  for (const candidate of wordlist) {
    if ((await hmacSha256Base64Url(candidate, signedPart)) === signature) {
      return candidate;
    }
  }
  return null;
}
