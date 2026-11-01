import { useId } from "react";

const POINTS = 28;
const OUTER_RADIUS = 48;
const INNER_RADIUS = 42;
const CENTER = 50;

function serratedEdge(): string {
  return Array.from({ length: POINTS * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? OUTER_RADIUS : INNER_RADIUS;
    const angle = (Math.PI * index) / POINTS;
    return `${(CENTER + radius * Math.cos(angle)).toFixed(2)},${(CENTER + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

export function FoilSeal({ label }: { label: string }) {
  const gradientId = useId();

  return (
    <svg className="seal" viewBox="0 0 100 100" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e29c" />
          <stop offset="0.45" stopColor="#c99a2e" />
          <stop offset="0.7" stopColor="#f0d67e" />
          <stop offset="1" stopColor="#a67c1c" />
        </linearGradient>
      </defs>
      <polygon points={serratedEdge()} fill={`url(#${gradientId})`} />
      <circle cx={CENTER} cy={CENTER} r="33" fill="none" stroke="#7a5a12" strokeWidth="1.5" />
      <path d="M33 51l12 12 22-26" fill="none" stroke="#5e4409" strokeWidth="6" strokeLinecap="square" />
    </svg>
  );
}
