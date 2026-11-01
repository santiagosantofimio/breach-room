import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageChoice } from "../i18n/LanguageChoice";
import { totalHints, type Progress } from "../progress/progress";
import { FoilSeal } from "./FoilSeal";
import { formatDuration, rankFor } from "./ranking";
import { downloadCanvas, drawShareCard } from "./shareCard";

const SHARE_FILE_NAME = "breach-room-escape.png";

interface FinaleProps {
  progress: Progress;
  onPlayAgain: () => void;
}

export function Finale({ progress, onPlayAgain }: FinaleProps) {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);

  const elapsed = (progress.finishedAt ?? 0) - (progress.startedAt ?? 0);
  const hints = totalHints(progress);
  const rank = t.finale.ranks[rankFor(hints, elapsed)];
  const fields = [
    { label: t.finale.time, value: formatDuration(elapsed) },
    { label: t.finale.hints, value: String(hints) },
    { label: t.finale.rank, value: rank },
  ];
  const fieldsKey = fields.map(({ value }) => value).join("|");

  useEffect(() => {
    if (canvas.current !== null) {
      void drawShareCard(canvas.current, {
        company: t.envelope.company,
        title: t.envelope.title,
        stamp: t.finale.stamp,
        fields,
        disclaimer: t.finale.cardDisclaimer,
      });
    }
  }, [t, fieldsKey]);

  return (
    <main className="finale">
      <header className="finale__head">
        <LanguageChoice />
      </header>
      <h1 className="finale__title">{t.finale.title}</h1>
      <p className="finale__lede">{t.finale.lede}</p>

      <div className="finale__results">
        <dl className="fields">
          {fields.map(({ label, value }) => (
            <div key={label} className="fields__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <FoilSeal label={t.game.solvedSeal} />
      </div>

      <canvas ref={canvas} className="finale__card" width={1200} height={630} aria-label={t.finale.cardLabel} />

      <div className="finale__actions">
        <button
          type="button"
          className="action"
          onClick={() => canvas.current !== null && downloadCanvas(canvas.current, SHARE_FILE_NAME)}
        >
          {t.finale.download}
        </button>
        <button type="button" className="kit__button" onClick={onPlayAgain}>
          {t.finale.playAgain}
        </button>
      </div>

      <p className="fine-print">
        {t.finale.disclaimer}{" "}
        <a href="https://santofimiodev.pages.dev" rel="noopener">
          {t.footer.author}
        </a>
        .
      </p>
    </main>
  );
}
