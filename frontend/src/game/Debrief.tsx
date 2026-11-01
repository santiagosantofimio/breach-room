import { useI18n } from "../i18n/I18nProvider";
import { DEBRIEF_CODE } from "../rooms/debriefCode";
import type { RoomContent } from "../rooms/roomContent";
import type { RoomSlug } from "../rooms/rooms";

interface DebriefProps {
  slug: RoomSlug;
  content: RoomContent["debrief"];
  nextLabel: string;
  onNext: () => void;
}

export function Debrief({ slug, content, nextLabel, onNext }: DebriefProps) {
  const { t } = useI18n();
  const code = DEBRIEF_CODE[slug];

  return (
    <section className="debrief" aria-label={t.game.debriefHeading}>
      <h3 className="debrief__heading">{t.game.debriefHeading}</h3>
      <h4 className="debrief__label">{t.game.debriefHappened}</h4>
      <p>{content.happened}</p>
      <h4 className="debrief__label">{t.game.debriefWhy}</h4>
      <p>{content.why}</p>
      {code !== undefined && (
        <div className="code-pair">
          <figure>
            <figcaption>{t.game.debriefVulnerable}</figcaption>
            <pre tabIndex={0}>
              <code>{code.vulnerable}</code>
            </pre>
          </figure>
          <figure>
            <figcaption>{t.game.debriefCorrected}</figcaption>
            <pre tabIndex={0}>
              <code>{code.corrected}</code>
            </pre>
          </figure>
        </div>
      )}
      <h4 className="debrief__label">{t.game.debriefOwasp}</h4>
      <p>{content.owasp}</p>
      <h4 className="debrief__label">{t.game.debriefDetection}</h4>
      <p>{content.detection}</p>
      <button type="button" className="action" onClick={onNext}>
        {nextLabel}
      </button>
    </section>
  );
}
