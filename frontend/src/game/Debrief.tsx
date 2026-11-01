import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { DEBRIEF_CODE } from "../rooms/debriefCode";
import { CodeBlock } from "./CodeBlock";
import type { RoomContent } from "../rooms/roomContent";
import type { RoomSlug } from "../rooms/rooms";

interface DebriefProps {
  slug: RoomSlug;
  content: RoomContent["debrief"];
  nextLabel: string;
  onNext: () => void;
  takesFocus: boolean;
}

export function Debrief({ slug, content, nextLabel, onNext, takesFocus }: DebriefProps) {
  const { t } = useI18n();
  const code = DEBRIEF_CODE[slug];
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (takesFocus) {
      heading.current?.focus();
    }
  }, [takesFocus]);

  return (
    <section className="debrief" aria-label={t.game.debriefHeading}>
      <h2 ref={heading} className="debrief__heading" tabIndex={-1}>
        {t.game.debriefHeading}
      </h2>
      <h3 className="debrief__label">{t.game.debriefHappened}</h3>
      <p>{content.happened}</p>
      <h3 className="debrief__label">{t.game.debriefWhy}</h3>
      <p>{content.why}</p>
      {code !== undefined && (
        <div className="code-pair">
          <CodeBlock
            label={t.game.debriefVulnerable}
            code={code.vulnerable}
            comparedTo={code.corrected}
            ChangedLine="del"
          />
          <CodeBlock
            label={t.game.debriefCorrected}
            code={code.corrected}
            comparedTo={code.vulnerable}
            ChangedLine="ins"
          />
        </div>
      )}
      <h3 className="debrief__label">{t.game.debriefOwasp}</h3>
      <p>{content.owasp}</p>
      <h3 className="debrief__label">{t.game.debriefDetection}</h3>
      <p>{content.detection}</p>
      <button type="button" className="action" onClick={onNext}>
        {nextLabel}
      </button>
    </section>
  );
}
