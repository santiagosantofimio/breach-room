import { useI18n } from "../i18n/I18nProvider";
import type { TargetOutcome } from "./useTarget";

export function ResponseView({ outcome }: { outcome: TargetOutcome | null }) {
  const { t } = useI18n();

  if (outcome === null) {
    return (
      <div className="response--blank">
        <p className="kit__empty">{t.toolkit.noResponse}</p>
      </div>
    );
  }
  if (outcome.kind !== "response") {
    return (
      <p className="kit__error" role="alert">
        {outcome.kind === "outside" ? t.toolkit.outsideTarget : t.toolkit.unreachable}
      </p>
    );
  }

  const { status, headers, body } = outcome.response;

  return (
    <div className="response" role="status">
      <p className="response__status">
        <span>{t.toolkit.status}</span>
        <strong>{status}</strong>
      </p>
      <h3 className="kit__label">{t.toolkit.responseBody}</h3>
      {body === "" ? <p className="kit__empty">{t.toolkit.emptyBody}</p> : <pre className="kit__code">{body}</pre>}
      <h3 className="kit__label">{t.toolkit.responseHeaders}</h3>
      <dl className="response__headers">
        {headers.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
