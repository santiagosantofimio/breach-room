import { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageChoice } from "../i18n/LanguageChoice";
import type { Progress } from "../progress/progress";
import { PLAYABLE_ROOMS, type RoomSlug } from "../rooms/rooms";
import { Toolkit } from "../toolkit/Toolkit";
import { RoomSheet } from "./RoomSheet";
import { RouteRail } from "./RouteRail";

type DeskView = "room" | "toolkit";

interface DeskProps {
  progress: Progress;
  onSolve: (slug: RoomSlug) => void;
  onRevealHint: (slug: RoomSlug, hintsInRoom: number) => void;
}

function firstOpenRoom(progress: Progress): RoomSlug {
  return (
    PLAYABLE_ROOMS.find((slug) => !progress.solvedRooms.includes(slug)) ??
    (PLAYABLE_ROOMS[PLAYABLE_ROOMS.length - 1] as RoomSlug)
  );
}

export function Desk({ progress, onSolve, onRevealHint }: DeskProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<RoomSlug>(() => firstOpenRoom(progress));
  const [view, setView] = useState<DeskView>("room");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [selected]);

  const selectedIndex = PLAYABLE_ROOMS.indexOf(selected);
  const nextRoom = PLAYABLE_ROOMS[selectedIndex + 1] ?? null;

  return (
    <div className="desk" data-view={view}>
      <header className="desk__bar">
        <div className="desk__brand">
          <p className="flap__company">{t.envelope.company}</p>
          <LanguageChoice />
        </div>
        <RouteRail progress={progress} selected={selected} onSelect={setSelected} />
      </header>

      <main className="desk__surface">
        <RoomSheet
          key={selected}
          slug={selected}
          isSolved={progress.solvedRooms.includes(selected)}
          hintsRevealed={progress.hintsUsed[selected] ?? 0}
          nextRoom={nextRoom}
          onRevealHint={(hintsInRoom) => onRevealHint(selected, hintsInRoom)}
          onSolved={() => onSolve(selected)}
          onNext={setSelected}
        />
        <Toolkit key={`kit-${selected}`} slug={selected} />
      </main>

      <nav className="desk__switch" aria-label={t.toolkit.label}>
        {(["room", "toolkit"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-current={view === option ? "true" : undefined}
            onClick={() => {
              setView(option);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            {option === "room" ? t.game.viewRoom : t.game.viewToolkit}
          </button>
        ))}
      </nav>
    </div>
  );
}
