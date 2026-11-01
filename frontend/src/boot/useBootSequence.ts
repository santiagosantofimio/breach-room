import { useCallback, useEffect, useState } from "react";
import { ensureSessionToken, isApiAwake } from "../api/client";
import { browserStore } from "../progress/safeStorage";
import { waitForApi } from "./waitForApi";

export type BootStatus = "waiting" | "ready" | "refused";

const ONE_SECOND_MS = 1_000;

const browserFetch: typeof fetch = (input, init) => fetch(input, init);

export function useBootSequence() {
  const [status, setStatus] = useState<BootStatus>("waiting");
  const [attempt, setAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function boot() {
      await waitForApi({
        checkHealth: (signal) => isApiAwake(browserFetch, signal),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      try {
        await ensureSessionToken(browserFetch, browserStore);
        if (!controller.signal.aborted) {
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("refused");
        }
      }
    }

    void boot();
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (status !== "waiting") {
      return;
    }
    const startedAt = performance.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((performance.now() - startedAt) / ONE_SECOND_MS));
    }, ONE_SECOND_MS);
    return () => clearInterval(timer);
  }, [status, attempt]);

  const retry = useCallback(() => {
    setStatus("waiting");
    setElapsedSeconds(0);
    setAttempt((current) => current + 1);
  }, []);

  return { status, elapsedSeconds, retry };
}
