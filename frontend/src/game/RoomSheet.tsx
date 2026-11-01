import { useI18n } from "../i18n/I18nProvider";
import type { RoomSlug } from "../rooms/rooms";
import { Debrief } from "./Debrief";
import { FlagForm } from "./FlagForm";
import { FoilSeal } from "./FoilSeal";
import { MailboxViewer } from "./MailboxViewer";

interface RoomSheetProps {
  slug: RoomSlug;
  isSolved: boolean;
  hintsRevealed: number;
  nextRoom: RoomSlug | null;
  onRevealHint: (hintsInRoom: number) => void;
  onSolved: () => void;
  onNext: (slug: RoomSlug) => void;
  onFinish: () => void;
}

export function RoomSheet({
  slug,
  isSolved,
  hintsRevealed,
  nextRoom,
  onRevealHint,
  onSolved,
  onNext,
  onFinish,
}: RoomSheetProps) {
  const { t } = useI18n();
  const room = t.rooms[slug];

  if (room === undefined) {
    return null;
  }

  const visibleHints = room.hints.slice(0, hintsRevealed);
  const hasMoreHints = hintsRevealed < room.hints.length;

  return (
    <article className="sheet" data-room={slug}>
      <header className="sheet__head">
        <p className="sheet__letterhead">{room.letterhead}</p>
        <h1 className="sheet__title">{t.route.rooms[slug]}</h1>
        {isSolved && <FoilSeal label={t.game.solvedSeal} />}
      </header>

      <p className="sheet__story">{room.story}</p>

      <dl className="fields sheet__objective">
        <div className="fields__row">
          <dt>{t.game.objective}</dt>
          <dd>{room.objective}</dd>
        </div>
      </dl>

      {!isSolved && (
        <section className="hints">
          <h2 className="hints__heading">{t.game.hintsHeading}</h2>
          <ol className="hints__list">
            {visibleHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ol>
          {hasMoreHints ? (
            <button type="button" className="kit__button" onClick={() => onRevealHint(room.hints.length)}>
              {t.game.hintRequest} ({hintsRevealed + 1} {t.game.hintCount} {room.hints.length})
            </button>
          ) : (
            <p className="hints__exhausted">{t.game.hintsExhausted}</p>
          )}
        </section>
      )}

      {slug === "xss" && !isSolved && <MailboxViewer />}

      {isSolved ? (
        <Debrief
          slug={slug}
          content={room.debrief}
          nextLabel={nextRoom === null ? t.game.leave : t.game.next}
          onNext={nextRoom === null ? onFinish : () => onNext(nextRoom)}
        />
      ) : (
        <FlagForm slug={slug} onSolved={onSolved} />
      )}
    </article>
  );
}
