import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { ResponseView } from "./ResponseView";
import { parseHeaderLines, type TargetRequest } from "./targetClient";
import type { TargetOutcome } from "./useTarget";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export interface RepeaterDraft {
  method: string;
  path: string;
  headers: string;
  body: string;
}

interface RepeaterProps {
  draft: RepeaterDraft;
  onDraftChange: (draft: RepeaterDraft) => void;
  send: (request: TargetRequest) => Promise<TargetOutcome>;
}

export function Repeater({ draft, onDraftChange, send }: RepeaterProps) {
  const { t } = useI18n();
  const [outcome, setOutcome] = useState<TargetOutcome | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function resend(event: FormEvent) {
    event.preventDefault();
    setIsSending(true);
    setOutcome(await send({ ...draft, headers: parseHeaderLines(draft.headers) }));
    setIsSending(false);
  }

  return (
    <div className="kit__panel">
      <form className="kit__form" onSubmit={resend}>
        <div className="kit__bar">
          <label className="kit__field">
            <span className="kit__label">{t.toolkit.method}</span>
            <select
              className="kit__input"
              value={draft.method}
              onChange={(event) => onDraftChange({ ...draft, method: event.target.value })}
            >
              {METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>
          <label className="kit__field kit__field--grow">
            <span className="kit__label">{t.toolkit.path}</span>
            <input
              className="kit__input"
              value={draft.path}
              onChange={(event) => onDraftChange({ ...draft, path: event.target.value })}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>
        </div>
        <label className="kit__field">
          <span className="kit__label">{t.toolkit.headers}</span>
          <textarea
            className="kit__input"
            rows={2}
            value={draft.headers}
            onChange={(event) => onDraftChange({ ...draft, headers: event.target.value })}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <label className="kit__field">
          <span className="kit__label">{t.toolkit.body}</span>
          <textarea
            className="kit__input"
            rows={4}
            value={draft.body}
            onChange={(event) => onDraftChange({ ...draft, body: event.target.value })}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <button type="submit" className="kit__button" disabled={isSending}>
          {isSending ? t.toolkit.sending : t.toolkit.send}
        </button>
      </form>
      <ResponseView outcome={outcome} />
    </div>
  );
}
