import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { RoomSlug } from "../rooms/rooms";
import { submitFlag } from "../toolkit/useTarget";

type FilingState = "idle" | "filing" | "rejected" | "failed";

interface FlagFormProps {
  slug: RoomSlug;
  onSolved: () => void;
}

export function FlagForm({ slug, onSolved }: FlagFormProps) {
  const { t } = useI18n();
  const [flag, setFlag] = useState("");
  const [state, setState] = useState<FilingState>("idle");

  async function file(event: FormEvent) {
    event.preventDefault();
    setState("filing");
    try {
      if (await submitFlag(slug, flag.trim())) {
        onSolved();
      } else {
        setState("rejected");
      }
    } catch {
      setState("failed");
    }
  }

  return (
    <form className="flag" onSubmit={file}>
      <label className="flag__field">
        <span className="kit__label">{t.game.flagLabel}</span>
        <input
          className="kit__input"
          value={flag}
          onChange={(event) => setFlag(event.target.value)}
          placeholder={t.game.flagPlaceholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          required
        />
      </label>
      <button type="submit" className="action" disabled={state === "filing"}>
        {state === "filing" ? t.game.flagChecking : t.game.flagSubmit}
      </button>
      {state === "rejected" && (
        <p className="flag__outcome" role="alert">
          <span className="stamp" aria-hidden="true">
            {t.game.flagRejectedStamp}
          </span>
          {t.game.flagRejected}
        </p>
      )}
      {state === "failed" && (
        <p className="flag__outcome" role="alert">
          {t.game.flagFailed}
        </p>
      )}
    </form>
  );
}
