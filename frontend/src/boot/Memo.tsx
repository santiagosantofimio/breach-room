import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageChoice } from "../i18n/LanguageChoice";

export function Memo({ isSettled }: { isSettled: boolean }) {
  const { t } = useI18n();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isSettled) {
      headingRef.current?.focus();
    }
  }, [isSettled]);

  return (
    <section className="memo-stage">
      <article className="memo">
        <header className="memo__head">
          <h2 ref={headingRef} className="memo__title" tabIndex={-1}>
            {t.memo.title}
          </h2>
          <LanguageChoice />
        </header>
        <dl className="fields fields--memo">
          {t.envelope.fields.map(({ label, value }) => (
            <div key={label} className="fields__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {t.memo.paragraphs.map((paragraph) => (
          <p key={paragraph} className="memo__paragraph">
            {paragraph}
          </p>
        ))}
        <p className="memo__closed">
          <span className="stamp" aria-hidden="true">
            {t.memo.closedStamp}
          </span>
          {t.memo.closed}
        </p>
      </article>
    </section>
  );
}
