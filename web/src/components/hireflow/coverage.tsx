import { cn } from "@/lib/utils";
import type { CoverageSummary, FindingStatus } from "@/lib/types";
import { STATUS_META } from "./status-badge";
import type { DonutSegment } from "./kit";

const SEGMENTS: FindingStatus[] = ["met", "partial", "unverified", "absent"];

export const STATUS_HEX: Record<FindingStatus, string> = {
  met: "#10b981",
  partial: "#3b82f6",
  unverified: "#f59e0b",
  absent: "#f43f5e",
};

const FILL: Record<FindingStatus, string> = {
  met: "bg-[#10b981]",
  partial: "bg-[#3b82f6]",
  unverified: "bg-[#f59e0b]",
  absent: "bg-[#f43f5e]",
};

/** Ring segments built from real finding counts. */
export function coverageSegments(summary: CoverageSummary): DonutSegment[] {
  return SEGMENTS.map((s) => ({
    value: summary[s],
    color: STATUS_HEX[s],
    label: STATUS_META[s].label,
  }));
}

/**
 * Thin segmented bar.
 *
 * Deliberately not a match percentage — a single score hides which requirements
 * are actually evidenced and which were assumed, and reads as an automated
 * ranker. The counts stay visible instead.
 */
export function CoverageBar({
  summary,
  className,
  showLegend = true,
}: {
  summary: CoverageSummary;
  className?: string;
  showLegend?: boolean;
}) {
  const total = summary.total || 1;

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
        {SEGMENTS.map((s) => {
          const n = summary[s];
          if (!n) return null;
          return (
            <div
              key={s}
              className={cn("rounded-full", FILL[s])}
              style={{ width: `${(n / total) * 100}%` }}
              title={`${STATUS_META[s].label}: ${n}`}
            />
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SEGMENTS.map((s) => {
            const n = summary[s];
            if (!n) return null;
            return (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={cn("size-2 rounded-full", FILL[s])}
                  aria-hidden
                />
                {n} {STATUS_META[s].label.toLowerCase()}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Legend rendered as rows, for use beside a donut. */
export function CoverageLegend({
  summary,
  className,
}: {
  summary: CoverageSummary;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {SEGMENTS.map((s) => {
        const n = summary[s];
        if (!n) return null;
        return (
          <li key={s} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn("size-2.5 shrink-0 rounded-full", FILL[s])}
              aria-hidden
            />
            <span className="text-muted-foreground">
              {STATUS_META[s].label}
            </span>
            <span className="ml-auto font-semibold tabular-nums">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
