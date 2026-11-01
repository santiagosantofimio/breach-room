import { useEffect, useState } from "react";
import { LanguageChoice } from "../i18n/LanguageChoice";
import { useI18n } from "../i18n/I18nProvider";
import { MailroomSlip } from "./MailroomSlip";
import { Memo } from "./Memo";
import { RouteGrid } from "./RouteGrid";
import { StampLayer } from "./StampLayer";
import { StringClosure } from "./StringClosure";
import { useBootSequence } from "./useBootSequence";

type EnvelopeState = "sealed" | "opening" | "open";

const OPENING_SEQUENCE_MS = 1_700;

function openingDuration(): number {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : OPENING_SEQUENCE_MS;
}

interface BootScreenProps {
  hasStarted: boolean;
  onBegin: () => void;
}

export function BootScreen({ hasStarted, onBegin }: BootScreenProps) {
  const { t } = useI18n();
  const { status, elapsedSeconds, retry } = useBootSequence();
  const [envelopeState, setEnvelopeState] = useState<EnvelopeState>("sealed");

  useEffect(() => {
    if (envelopeState !== "opening") {
      return;
    }
    const timer = setTimeout(() => setEnvelopeState("open"), openingDuration());
    return () => clearTimeout(timer);
  }, [envelopeState]);

  if (envelopeState === "open") {
    return <Memo isSettled hasStarted={hasStarted} onBegin={onBegin} />;
  }

  return (
    <main className="envelope" data-state={envelopeState}>
      <header className="flap">
        <div className="flap__brand">
          <p className="flap__company">{t.envelope.company}</p>
          <p className="flap__tagline">{t.envelope.tagline}</p>
        </div>
        <LanguageChoice />
      </header>

      <StringClosure />

      <div className="body">
        <span className="thread" aria-hidden="true" />
        <h1 className="title">{t.envelope.title}</h1>

        <div className="brief">
          <p className="brief__intro">{t.envelope.intro}</p>
          <dl className="fields">
            <div className="fields__row fields__row--struck" aria-hidden="true">
              <dt>{t.envelope.fields[0]?.label}</dt>
              <dd>{t.envelope.previousRecipient}</dd>
            </div>
            {t.envelope.fields.map(({ label, value }) => (
              <div key={label} className="fields__row">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <RouteGrid>
          <StampLayer elapsedSeconds={elapsedSeconds} />
        </RouteGrid>

        <MailroomSlip
          status={status}
          elapsedSeconds={elapsedSeconds}
          onOpen={() => {
            window.scrollTo({ top: 0, behavior: "instant" });
            setEnvelopeState("opening");
          }}
          onRetry={retry}
        />

        <footer className="fine-print">
          <p className="fine-print__handling">{t.envelope.handling}</p>
          <p>
            {t.footer.fiction}{" "}
            <a href="https://santofimiodev.pages.dev" rel="noopener">
              {t.footer.author}
            </a>
            .
          </p>
        </footer>
      </div>

      {envelopeState === "opening" && <Memo isSettled={false} hasStarted={hasStarted} onBegin={onBegin} />}
    </main>
  );
}
