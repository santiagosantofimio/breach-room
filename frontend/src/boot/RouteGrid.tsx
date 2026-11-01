import type { ReactNode } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { ROOM_SLUGS } from "../rooms/rooms";

export function RouteGrid({ children }: { children?: ReactNode }) {
  const { t } = useI18n();

  return (
    <section className="route" aria-label={t.route.label}>
      <div className="route__head" aria-hidden="true">
        <span>{t.route.department}</span>
        <span className="route__head-received">{t.route.received}</span>
      </div>
      <ol className="route__stops">
        {ROOM_SLUGS.map((slug, index) => (
          <li key={slug} className="stop" data-state={index === 0 ? "current" : "pending"}>
            <span className="stop__hole" aria-hidden="true" />
            <span className="stop__number" aria-hidden="true">
              {index + 1}
            </span>
            <span className="stop__name">{t.route.rooms[slug]}</span>
          </li>
        ))}
      </ol>
      {children}
      <p className="route__note">{t.envelope.holesNote}</p>
    </section>
  );
}
