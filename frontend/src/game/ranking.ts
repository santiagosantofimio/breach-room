export const RANKS = ["chiefExitOfficer", "seniorDoorConsultant", "associateEscapist", "unpaidIntern"] as const;

export type Rank = (typeof RANKS)[number];

const MINUTES_WITHOUT_PENALTY = 20;
const MINUTES_PER_PENALTY = 5;
const MILLISECONDS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function rankFor(hintsUsed: number, elapsedMilliseconds: number): Rank {
  const minutes = elapsedMilliseconds / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE);
  const slowness = Math.floor(Math.max(0, minutes - MINUTES_WITHOUT_PENALTY) / MINUTES_PER_PENALTY);
  const penalty = hintsUsed + slowness;
  if (penalty === 0) {
    return "chiefExitOfficer";
  }
  if (penalty <= 3) {
    return "seniorDoorConsultant";
  }
  return penalty <= 9 ? "associateEscapist" : "unpaidIntern";
}

export function formatDuration(elapsedMilliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMilliseconds / MILLISECONDS_PER_SECOND));
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours === 0 ? clock : `${hours}:${clock}`;
}
