const FIGURE_EIGHT =
  "M26 118C3 118 6 90 26 66C46 42 49 14 26 14C3 14 6 42 26 66C46 90 49 118 26 118";
const SECOND_WINDING =
  "M24 115C7 113 11 88 27 66C43 44 45 19 28 17C8 16 9 42 25 66C41 90 43 114 24 115";

export function StringClosure() {
  return (
    <svg className="closure" viewBox="0 0 52 132" aria-hidden="true">
      <circle className="closure__disc" cx="26" cy="30" r="15" />
      <circle className="closure__eyelet" cx="26" cy="30" r="3.5" />
      <circle className="closure__disc" cx="26" cy="102" r="15" />
      <circle className="closure__eyelet" cx="26" cy="102" r="3.5" />
      <path className="closure__winding" d={FIGURE_EIGHT} pathLength={1} />
      <path className="closure__winding closure__winding--second" d={SECOND_WINDING} pathLength={1} />
    </svg>
  );
}
