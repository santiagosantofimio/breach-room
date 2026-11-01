import { useId } from "react";
import { LANGUAGES, useI18n } from "./I18nProvider";

export function LanguageChoice() {
  const { language, setLanguage, t } = useI18n();
  const groupName = useId();

  return (
    <fieldset className="language">
      <legend className="visually-hidden">{t.language.legend}</legend>
      {LANGUAGES.map((option) => (
        <label key={option} className="language__option">
          <input
            type="radio"
            name={groupName}
            value={option}
            checked={language === option}
            onChange={() => setLanguage(option)}
          />
          <span className="language__box" aria-hidden="true" />
          <span lang={option}>{t.language[option]}</span>
        </label>
      ))}
    </fieldset>
  );
}
