import { useI18n } from "../i18n/I18nProvider";
import type { CookieJar } from "./roomCookies";

const NEW_COOKIE_NAME = "cookie";

interface CookieJarPanelProps {
  cookies: CookieJar;
  onChange: (cookies: CookieJar) => void;
  onOpenInDecoder: (value: string) => void;
}

export function CookieJarPanel({ cookies, onChange, onOpenInDecoder }: CookieJarPanelProps) {
  const { t } = useI18n();
  const entries = Object.entries(cookies);

  function rename(oldName: string, newName: string) {
    onChange(Object.fromEntries(entries.map(([name, value]) => [name === oldName ? newName : name, value])));
  }

  function remove(target: string) {
    onChange(Object.fromEntries(entries.filter(([name]) => name !== target)));
  }

  return (
    <div className="kit__panel">
      {entries.length === 0 && <p className="kit__empty">{t.toolkit.cookiesEmpty}</p>}
      {entries.map(([name, value], index) => (
        <div key={index} className="cookie">
          <label className="kit__field">
            <span className="kit__label">{t.toolkit.cookieName}</span>
            <input
              className="kit__input"
              value={name}
              onChange={(event) => rename(name, event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
          <label className="kit__field">
            <span className="kit__label">{t.toolkit.cookieValue}</span>
            <textarea
              className="kit__input"
              rows={2}
              value={value}
              onChange={(event) => onChange({ ...cookies, [name]: event.target.value })}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
          <div className="cookie__actions">
            <button type="button" className="kit__link" onClick={() => onOpenInDecoder(value)}>
              {t.toolkit.toDecoder}
            </button>
            <button type="button" className="kit__link" onClick={() => remove(name)}>
              {t.toolkit.cookieRemove}
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="kit__link"
        onClick={() => onChange({ ...cookies, [`${NEW_COOKIE_NAME}${entries.length + 1}`]: "" })}
      >
        {t.toolkit.cookieAdd}
      </button>
    </div>
  );
}
