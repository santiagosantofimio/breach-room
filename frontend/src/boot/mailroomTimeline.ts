export const MAILROOM_LINE_SECONDS = [0, 6, 14, 24, 36, 50, 70, 100] as const;
export const STAMP_SECONDS = [4, 12, 22, 34, 48, 66] as const;
export const UNDELIVERABLE_AFTER_SECONDS = 150;

const SECONDS_PER_MINUTE = 60;

export function revealedCount(scheduleSeconds: readonly number[], elapsedSeconds: number): number {
  return scheduleSeconds.filter((second) => second <= elapsedSeconds).length;
}

export function formatQueueTime(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / SECONDS_PER_MINUTE);
  const seconds = elapsedSeconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
