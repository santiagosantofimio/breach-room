import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { ResponseView } from "./ResponseView";
import type { TargetRequest } from "./targetClient";
import type { TargetOutcome } from "./useTarget";

interface MiniBrowserProps {
  entryPath: string;
  send: (request: TargetRequest) => Promise<TargetOutcome>;
  onOpenInRepeater: (path: string) => void;
}

export function MiniBrowser({ entryPath, send, onOpenInRepeater }: MiniBrowserProps) {
  const { t } = useI18n();
  const [path, setPath] = useState(entryPath);
  const [outcome, setOutcome] = useState<TargetOutcome | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function visit(event: FormEvent) {
    event.preventDefault();
    setIsSending(true);
    setOutcome(await send({ method: "GET", path, headers: [], body: "" }));
    setIsSending(false);
  }

  return (
    <div className="kit__panel">
      <form className="kit__bar" onSubmit={visit}>
        <label className="kit__field kit__field--grow">
          <span className="kit__label">{t.toolkit.path}</span>
          <input
            className="kit__input"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </label>
        <button type="submit" className="kit__button" disabled={isSending}>
          {isSending ? t.toolkit.sending : t.toolkit.send}
        </button>
      </form>
      <ResponseView outcome={outcome} />
      {outcome?.kind === "response" && (
        <button type="button" className="kit__link" onClick={() => onOpenInRepeater(path)}>
          {t.toolkit.toRepeater}
        </button>
      )}
    </div>
  );
}
