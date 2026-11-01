import { useI18n } from "../i18n/I18nProvider";
import {
  formatQueueTime,
  MAILROOM_LINE_SECONDS,
  revealedCount,
  UNDELIVERABLE_AFTER_SECONDS,
} from "./mailroomTimeline";
import { useTypedText } from "./useTypedText";
import type { BootStatus } from "./useBootSequence";

const VISIBLE_HISTORY_LINES = 2;

interface MailroomSlipProps {
  status: BootStatus;
  elapsedSeconds: number;
  onOpen: () => void;
  onRetry: () => void;
}

export function MailroomSlip({ status, elapsedSeconds, onOpen, onRetry }: MailroomSlipProps) {
  const { t } = useI18n();
  const revealedLines = t.mailroom.lines.slice(0, revealedCount(MAILROOM_LINE_SECONDS, elapsedSeconds));
  const isUndeliverable = status === "waiting" && elapsedSeconds >= UNDELIVERABLE_AFTER_SECONDS;
  const latestLine = latestMessage(status, isUndeliverable, revealedLines, t);
  const history = status === "waiting" ? revealedLines.slice(-(VISIBLE_HISTORY_LINES + 1), -1) : [];
  const typedLatestLine = useTypedText(latestLine);

  return (
    <aside className="slip">
      <span className="slip__staple" aria-hidden="true" />
      {status === "waiting" && (
        <header className="slip__head">
          <h2 className="slip__heading">{t.mailroom.heading}</h2>
          <p className="slip__queue">
            <span>{t.mailroom.queue}</span>
            <time>{formatQueueTime(elapsedSeconds)}</time>
          </p>
        </header>
      )}

      <ul className="slip__log">
        {history.map((line) => (
          <li key={line} className="slip__line slip__line--past">
            {line}
          </li>
        ))}
        <li className="slip__line">
          <span aria-hidden="true">{typedLatestLine}</span>
          <span className="visually-hidden" role="status">
            {latestLine}
          </span>
        </li>
      </ul>

      {status === "waiting" && <p className="slip__note">{t.mailroom.waitNote}</p>}
      {status === "ready" && (
        <button type="button" className="action" onClick={onOpen}>
          {t.mailroom.open}
        </button>
      )}
      {status === "refused" && (
        <button type="button" className="action" onClick={onRetry}>
          {t.mailroom.retry}
        </button>
      )}
    </aside>
  );
}

function latestMessage(
  status: BootStatus,
  isUndeliverable: boolean,
  revealedLines: string[],
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (status === "ready") {
    return t.mailroom.ready;
  }
  if (status === "refused") {
    return t.mailroom.refused;
  }
  if (isUndeliverable) {
    return t.mailroom.undeliverable;
  }
  return revealedLines.at(-1) ?? "";
}
