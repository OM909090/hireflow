import { cn } from "@/lib/utils";

/**
 * HireFlow brand mark.
 *
 * A verification check whose tail flows up into a node — "evidence confirmed →
 * candidate advances". Deliberately geometric rather than a generic AI-robot or
 * sparkle: HireFlow's promise is evidence and flow, not novelty. Renders in
 * `currentColor` so it works on the brand gradient (white) and on light/dark.
 */
export function HireFlowGlyph({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* evidence check */}
      <path
        d="M3.4 12.6l4 4L13.6 8.6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* flow rising from the check into the advance node */}
      <path
        d="M13.6 8.6C16 6.6 18.4 7 20.5 4.6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="20.6" cy="4.5" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Full brand badge — gradient square + glyph. Reusable across rail, footer, 404. */
export function HireFlowMark({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <HireFlowGlyph size={Math.round(size * 0.5)} />
    </span>
  );
}
