import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageChoice } from "../i18n/LanguageChoice";

interface MemoProps {
  isSettled: boolean;
  hasStarted: boolean;
  onBegin: () => void;
}

export function Memo({ isSettled, hasStarted, onBegin }: MemoProps) {
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
        <button type="button" className="action memo__begin" onClick={onBegin}>
          {hasStarted ? t.memo.resume : t.memo.begin}
        </button>
      </article>
    </section>
  );
}
