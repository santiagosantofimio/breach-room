import { useEffect, useRef, useState, type FormEvent } from "react";
import { API_ORIGIN } from "../api/client";
import { useI18n } from "../i18n/I18nProvider";
import { requestScriptProof } from "../toolkit/useTarget";

const INBOX_PATH = "/api/rooms/xss/inbox";
const PROOF_MESSAGE_TYPE = "breach-proof";

type ProofState = { kind: "waiting" } | { kind: "proven"; flag: string } | { kind: "failed" };

export function MailboxViewer() {
  const { t } = useI18n();
  const frame = useRef<HTMLIFrameElement>(null);
  const [draft, setDraft] = useState("quarterly review");
  const [subject, setSubject] = useState(draft);
  const [proof, setProof] = useState<ProofState>({ kind: "waiting" });

  useEffect(() => {
    function onFrameMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== PROOF_MESSAGE_TYPE) {
        return;
      }
      requestScriptProof()
        .then((flag) => setProof({ kind: "proven", flag }))
        .catch(() => setProof({ kind: "failed" }));
    }

    window.addEventListener("message", onFrameMessage);
    return () => window.removeEventListener("message", onFrameMessage);
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    setSubject(draft);
  }

  return (
    <section className="mailbox">
      <form className="kit__bar" onSubmit={search}>
        <label className="kit__field kit__field--grow">
          <span className="kit__label">{t.game.mailboxSearch}</span>
          <input
            className="kit__input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </label>
        <button type="submit" className="kit__button">
          {t.game.mailboxOpen}
        </button>
      </form>
      <iframe
        ref={frame}
        className="mailbox__frame"
        title={t.game.mailboxFrame}
        sandbox="allow-scripts"
        src={`${API_ORIGIN}${INBOX_PATH}?subject=${encodeURIComponent(subject)}`}
      />
      {proof.kind === "proven" && (
        <div className="mailbox__proof" role="status">
          <p>{t.game.mailboxProven}</p>
          <pre className="kit__code">{proof.flag}</pre>
        </div>
      )}
      {proof.kind === "failed" && (
        <p className="kit__error" role="alert">
          {t.game.mailboxFailed}
        </p>
      )}
    </section>
  );
}
