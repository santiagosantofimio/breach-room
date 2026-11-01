import { useI18n } from "../i18n/I18nProvider";
import { revealedCount, STAMP_SECONDS, UNDELIVERABLE_AFTER_SECONDS } from "./mailroomTimeline";

const STAMP_PLACEMENTS = [
  { top: "6%", right: "3%", rotate: "-7deg" },
  { top: "24%", right: "16%", rotate: "5deg" },
  { top: "41%", right: "1%", rotate: "-3deg" },
  { top: "57%", right: "13%", rotate: "8deg" },
  { top: "70%", right: "2%", rotate: "-9deg" },
  { top: "12%", right: "24%", rotate: "3deg" },
];
const UNDELIVERABLE_PLACEMENT = { top: "34%", right: "5%", rotate: "-11deg" };

export function StampLayer({ elapsedSeconds }: { elapsedSeconds: number }) {
  const { t } = useI18n();
  const visibleStamps = t.mailroom.stamps.slice(0, revealedCount(STAMP_SECONDS, elapsedSeconds));

  return (
    <div className="stamps" aria-hidden="true">
      {visibleStamps.map((stamp, index) => {
        const { top, right, rotate } = STAMP_PLACEMENTS[index]!;
        return (
          <span key={index} className="stamp" style={{ top, right, rotate }}>
            {stamp}
          </span>
        );
      })}
      {elapsedSeconds >= UNDELIVERABLE_AFTER_SECONDS && (
        <span className="stamp stamp--large" style={UNDELIVERABLE_PLACEMENT}>
          {t.mailroom.undeliverableStamp}
        </span>
      )}
    </div>
  );
}
