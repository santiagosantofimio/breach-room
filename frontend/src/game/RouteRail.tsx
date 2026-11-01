import { useI18n } from "../i18n/I18nProvider";
import type { Progress } from "../progress/progress";
import { isPlayable, ROOM_SLUGS, type RoomSlug } from "../rooms/rooms";

type StopState = "solved" | "current" | "open" | "locked";

interface RouteRailProps {
  progress: Progress;
  selected: RoomSlug;
  onSelect: (slug: RoomSlug) => void;
}

export function RouteRail({ progress, selected, onSelect }: RouteRailProps) {
  const { t } = useI18n();
  const firstUnsolved = ROOM_SLUGS.find((slug) => !progress.solvedRooms.includes(slug));

  function stateOf(slug: RoomSlug): StopState {
    if (progress.solvedRooms.includes(slug)) {
      return slug === selected ? "current" : "solved";
    }
    if (slug === selected) {
      return "current";
    }
    return slug === firstUnsolved && isPlayable(slug) ? "open" : "locked";
  }

  const stateLabels: Record<StopState, string> = {
    solved: t.game.stopSolved,
    current: t.game.stopCurrent,
    open: t.game.stopOpen,
    locked: t.game.stopLocked,
  };

  return (
    <ol className="rail" aria-label={t.game.routeLabel}>
      {ROOM_SLUGS.map((slug, index) => {
        const state = stateOf(slug);
        const isCleared = progress.solvedRooms.includes(slug);
        return (
          <li key={slug} className="rail__stop" data-state={state} data-cleared={isCleared}>
            <button
              type="button"
              className="rail__button"
              disabled={state === "locked"}
              aria-current={state === "current" ? "step" : undefined}
              aria-label={`${index + 1}. ${t.route.rooms[slug]}, ${stateLabels[state]}`}
              onClick={() => onSelect(slug)}
            >
              <span className="rail__hole" aria-hidden="true" />
              <span className="rail__number" aria-hidden="true">
                {index + 1}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
