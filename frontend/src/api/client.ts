import type { KeyValueStore } from "../progress/safeStorage";

const SESSION_TOKEN_KEY = "breach-room.session";

export const API_ORIGIN: string = import.meta.env.VITE_API_ORIGIN ?? "";

type Fetch = typeof fetch;

export async function isApiAwake(fetcher: Fetch, signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetcher(`${API_ORIGIN}/api/health`, { signal });
    return response.ok;
  } catch {
    return false;
  }
}

export async function ensureSessionToken(fetcher: Fetch, store: KeyValueStore): Promise<string> {
  const storedToken = store.read(SESSION_TOKEN_KEY);
  if (storedToken !== null) {
    return storedToken;
  }
  const response = await fetcher(`${API_ORIGIN}/api/session`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }
  const { token } = (await response.json()) as { token: string };
  store.write(SESSION_TOKEN_KEY, token);
  return token;
}
