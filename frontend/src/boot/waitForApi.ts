export const HEALTH_POLL_INTERVAL_MS = 2_500;
export const HEALTH_REQUEST_TIMEOUT_MS = 8_000;

export interface WaitForApiOptions {
  checkHealth: (signal: AbortSignal) => Promise<boolean>;
  signal: AbortSignal;
  sleep?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

export async function waitForApi({ checkHealth, signal, sleep = abortableSleep }: WaitForApiOptions): Promise<void> {
  while (!signal.aborted) {
    const attemptSignal = AbortSignal.any([signal, AbortSignal.timeout(HEALTH_REQUEST_TIMEOUT_MS)]);
    if (await checkHealth(attemptSignal)) {
      return;
    }
    await sleep(HEALTH_POLL_INTERVAL_MS, signal);
  }
}

function abortableSleep(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
