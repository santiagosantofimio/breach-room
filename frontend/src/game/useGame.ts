import { useCallback, useState } from "react";
import {
  clearGame,
  EMPTY_PROGRESS,
  loadProgress,
  markSolved,
  revealNextHint,
  saveProgress,
  startGame,
  type Progress,
} from "../progress/progress";
import { browserStore } from "../progress/safeStorage";
import type { RoomSlug } from "../rooms/rooms";

export function useGame() {
  const [progress, setProgress] = useState(() => loadProgress(browserStore));

  const update = useCallback((change: (current: Progress) => Progress) => {
    setProgress((current) => {
      const next = change(current);
      saveProgress(browserStore, next);
      return next;
    });
  }, []);

  const begin = useCallback(() => update((current) => startGame(current, Date.now())), [update]);
  const solve = useCallback(
    (slug: RoomSlug) => update((current) => markSolved(current, slug, Date.now())),
    [update],
  );
  const revealHint = useCallback(
    (slug: RoomSlug, hintsInRoom: number) => update((current) => revealNextHint(current, slug, hintsInRoom)),
    [update],
  );

  const reset = useCallback(() => {
    clearGame(browserStore);
    setProgress(EMPTY_PROGRESS);
  }, []);

  return { progress, begin, solve, revealHint, reset };
}
