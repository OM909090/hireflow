import { cn } from "@/lib/utils";

/* ── Card ─────────────────────────────────────────────────────────────────── */

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-card card-soft",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  subtitle,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 pt-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

/** Small uppercase label used above groups of content. */
export function Eyebrow({
  children,
  className,
  tone = "muted",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "muted" | "brand" | "warn";
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-bold tracking-[0.08em] uppercase",
        tone === "muted" && "text-muted-foreground",
        tone === "brand" && "text-primary",
        tone === "warn" && "text-[var(--color-unverified)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

/* ── Hero stat card (the reference's deep-violet panel) ───────────────────── */

export function HeroCard({
  label,
  value,
  caption,
  note,
  footer,
  className,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  note?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 text-white violet-gradient card-lift",
        className,
      )}
    >
      {/* soft light bloom, top-right */}
      <div
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div className="relative">
        <p className="text-[10px] font-bold tracking-[0.08em] text-white/60 uppercase">
          {label}
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            {value}
          </div>
          {caption && (
            <p className="pb-1 text-sm leading-tight text-white/70">
              {caption}
            </p>
          )}
        </div>
        {note && (
          <p className="mt-3 text-xs leading-relaxed text-white/70">{note}</p>
        )}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Donut ────────────────────────────────────────────────────────────────── */

export type DonutSegment = { value: number; color: string; label: string };

/**
 * Multi-segment ring, as in the reference's Workmap Score.
 * Rendered from real finding counts — no invented metrics.
 */
export function Donut({
  segments,
  size = 168,
  thickness = 16,
  centerTop,
  centerMain,
  centerSub,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerMain?: React.ReactNode;
  centerSub?: string;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = 3;

  // Arc geometry is precomputed rather than accumulated inside the render map,
  // so nothing is mutated while rendering.
  const arcs = segments.reduce<
    { seg: DonutSegment; dash: number; offset: number }[]
  >((acc, seg) => {
    const start = acc.reduce((n, a) => n + (a.seg.value / total) * c, 0);
    const len = (seg.value / total) * c;
    acc.push({ seg, dash: Math.max(len - gap, 1), offset: start });
    return acc;
  }, []);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={thickness}
        />
        {arcs.map(({ seg, dash, offset }, i) =>
          seg.value ? (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          ) : null,
        )}
      </svg>

      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div>
          {centerTop && (
            <p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
              {centerTop}
            </p>
          )}
          {centerMain && (
            <div className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
              {centerMain}
            </div>
          )}
          {centerSub && (
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
              {centerSub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Misc ─────────────────────────────────────────────────────────────────── */

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function IdTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold text-secondary-foreground">
      {children}
    </span>
  );
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground",
        size === "sm" && "size-8 text-[11px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-14 text-base",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
