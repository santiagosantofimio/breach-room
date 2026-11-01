export function InkFilters() {
  return (
    <svg className="ink-filters" aria-hidden="true">
      <filter id="stamp-ink">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="1.6" />
      </filter>
    </svg>
  );
}
