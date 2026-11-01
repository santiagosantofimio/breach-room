import { useId } from "react";
import { useI18n } from "../i18n/I18nProvider";

const POINTS = 32;
const OUTER_RADIUS = 58;
const INNER_RADIUS = 52;
const CENTER = 60;
const RIM_TEXT_RADIUS = 40;

function serratedEdge(): string {
  return Array.from({ length: POINTS * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? OUTER_RADIUS : INNER_RADIUS;
    const angle = (Math.PI * index) / POINTS;
    return `${(CENTER + radius * Math.cos(angle)).toFixed(2)},${(CENTER + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

function rimPath(): string {
  const start = CENTER - RIM_TEXT_RADIUS;
  const diameter = RIM_TEXT_RADIUS * 2;
  return `M${start} ${CENTER}a${RIM_TEXT_RADIUS} ${RIM_TEXT_RADIUS} 0 1 1 ${diameter} 0a${RIM_TEXT_RADIUS} ${RIM_TEXT_RADIUS} 0 1 1 -${diameter} 0`;
}

export function FoilSeal({ label }: { label: string }) {
  const { t } = useI18n();
  const id = useId();
  const foil = `foil-${id}`;
  const light = `light-${id}`;
  const rim = `rim-${id}`;

  return (
    <svg className="seal" viewBox="0 0 120 120" role="img" aria-label={label}>
      <defs>
        <radialGradient id={foil} cx="0.34" cy="0.26" r="0.92">
          <stop offset="0" stopColor="#fff3bd" />
          <stop offset="0.28" stopColor="#e7c25c" />
          <stop offset="0.62" stopColor="#b48a26" />
          <stop offset="0.84" stopColor="#dcb54c" />
          <stop offset="1" stopColor="#8f6b16" />
        </radialGradient>
        <filter id={light} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="8" result="crumple" />
          <feSpecularLighting
            in="crumple"
            surfaceScale="3.2"
            specularConstant="0.85"
            specularExponent="24"
            lightingColor="#fff6cf"
            result="shine"
          >
            <fePointLight x="34" y="16" z="62" />
          </feSpecularLighting>
          <feComposite in="shine" in2="SourceAlpha" operator="in" result="crumpledShine" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="crumpledShine" />
          </feMerge>
        </filter>
        <path id={rim} d={rimPath()} />
      </defs>
      <g filter={`url(#${light})`}>
        <polygon points={serratedEdge()} fill={`url(#${foil})`} />
      </g>
      <circle cx={CENTER} cy={CENTER} r="47" className="seal__ring" />
      <circle cx={CENTER} cy={CENTER} r="31" className="seal__ring" />
      <text className="seal__rim">
        <textPath href={`#${rim}`} textLength="248">
          {t.game.sealRim}
        </textPath>
      </text>
      <text className="seal__mark" x={CENTER} y="70" textAnchor="middle">
        {t.game.sealMark}
      </text>
    </svg>
  );
}
