"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Eyebrow, Panel } from "./kit";
import { STATUS_META } from "./status-badge";
import { candidates, findingsFor, requirements } from "@/lib/data";
import { summariseCoverage } from "@/lib/types";
import type { Finding, FindingStatus } from "@/lib/types";
import { useVerification } from "@/lib/verification-store";
import { cn } from "@/lib/utils";

const cellClass: Record<FindingStatus, string> = {
  met: "bg-[var(--color-met-bg)] text-[var(--color-met)]",
  partial: "bg-[var(--color-partial-bg)] text-[var(--color-partial)]",
  unverified: "bg-[var(--color-unverified-bg)] text-[var(--color-unverified)]",
  absent: "bg-[var(--color-absent-bg)] text-[var(--color-absent)]",
};

export function MatrixView() {
  const { statusFor } = useVerification();
  const [kind, setKind] = useState<"all" | "hard" | "soft">("all");
  const [status, setStatus] = useState<"all" | FindingStatus>("all");

  // Live-merged cell lookup.
  const cell = useMemo(() => {
    const m = new Map<string, Finding>();
    for (const c of candidates) {
      for (const f of findingsFor(c.id)) {
        const s = statusFor(c.id, f.requirementId, f.status);
        m.set(
          `${c.id}:${f.requirementId}`,
          s === f.status ? f : { ...f, status: s },
        );
      }
    }
    return m;
  }, [statusFor]);

  const cols = candidates.map((c) => ({
    candidate: c,
    summary: summariseCoverage(
      findingsFor(c.id).map((f) => {
        const s = statusFor(c.id, f.requirementId, f.status);
        return s === f.status ? f : { ...f, status: s };
      }),
      requirements,
    ),
  }));

  const rows = requirements.filter((r) => {
    if (kind !== "all" && r.kind !== kind) return false;
    if (status !== "all") {
      const any = candidates.some(
        (c) => cell.get(`${c.id}:${r.id}`)?.status === status,
      );
      if (!any) return false;
    }
    return true;
  });

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          label="Filter requirements by kind"
          value={kind}
          onChange={(v) => setKind(v as typeof kind)}
          options={[
            ["all", "All requirements"],
            ["hard", "Must-have only"],
            ["soft", "Nice-to-have only"],
          ]}
        />
        <Select
          label="Filter requirements by status"
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            ["all", "Any status"],
            ["met", "Any Met"],
            ["partial", "Any Partially met"],
            ["unverified", "Any Unverified"],
            ["absent", "Any No evidence found"],
          ]}
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {rows.length} of {requirements.length} requirements ×{" "}
          {candidates.length} candidates
        </span>
      </div>

      <Panel className="overflow-hidden p-0">
        {/* The table owns its own scrolling. Setting overflow-x alone makes this
            wrapper the sticky containing block while `main` does the actual
            scrolling, which leaves the header cells nothing to stick to — so it
            gets a bounded height and scrolls in both axes itself. */}
        <div className="max-h-[calc(100dvh-23rem)] min-h-[16rem] overflow-auto">
          {/* border-separate (not border-collapse): `position: sticky` does not
              work on cells of a border-collapse table in Chrome, and the header
              row must stay visible while the requirements scroll. */}
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 min-w-[280px] border-b border-border bg-card p-4 text-left align-bottom">
                  <Eyebrow>Requirement</Eyebrow>
                </th>
                {cols.map(({ candidate: c, summary }) => (
                  <th
                    key={c.id}
                    className="sticky top-0 z-10 border-b border-l border-border bg-card p-3 text-center align-bottom"
                  >
                    <Link
                      href={`/candidates/${c.id}`}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <span className="grid size-9 place-items-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                        {c.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className="max-w-[92px] truncate text-xs font-semibold group-hover:text-primary">
                        {c.name.split(" ")[0]}
                      </span>
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {summary.hardEvidenced}/{summary.hardTotal} must-have
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="group">
                  <th className="sticky left-0 z-10 border-b border-border bg-card p-4 text-left align-middle group-hover:bg-muted/40">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-secondary-foreground">
                        {r.id}
                      </span>
                      {r.kind === "soft" && (
                        <span className="rounded border border-border px-1 py-0.5 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                          nice
                        </span>
                      )}
                    </div>
                    <p className="mt-1 max-w-[240px] text-[13px] leading-snug font-medium text-foreground">
                      {r.text}
                    </p>
                  </th>

                  {cols.map(({ candidate: c }) => {
                    const f = cell.get(`${c.id}:${r.id}`);
                    if (!f) {
                      return (
                        <td
                          key={c.id}
                          className="border-b border-l border-border p-2 text-center text-muted-foreground group-hover:bg-muted/40"
                        >
                          —
                        </td>
                      );
                    }
                    const meta = STATUS_META[f.status];
                    const Icon = meta.icon;
                    return (
                      <td
                        key={c.id}
                        className="border-b border-l border-border p-2 text-center group-hover:bg-muted/40"
                      >
                        <Link
                          href={`/candidates/${c.id}`}
                          title={`${c.name} · ${r.id} · ${meta.label}\n${f.reason}`}
                          aria-label={`${c.name}, ${r.id} ${r.text}: ${meta.label}. ${f.reason}`}
                          className={cn(
                            "mx-auto flex size-9 items-center justify-center rounded-xl transition-transform hover:scale-110",
                            cellClass[f.status],
                          )}
                        >
                          <Icon className="size-4.5" aria-hidden />
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={candidates.length + 1}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    No requirements match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-muted/30 px-4 py-3">
          <Eyebrow>Legend</Eyebrow>
          {(["met", "partial", "unverified", "absent"] as FindingStatus[]).map(
            (s) => {
              const meta = STATUS_META[s];
              const Icon = meta.icon;
              return (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-md",
                      cellClass[s],
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                  </span>
                  {meta.label}
                </span>
              );
            },
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            live — updates as the AI verifies requirements in interviews
          </span>
        </div>
      </Panel>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        This is deliberately not a leaderboard of match percentages. A single
        score hides the one thing a hiring team needs — which specific
        requirements are evidenced, which are only claimed, and which are
        missing. The matrix keeps all of it visible and traceable.
      </p>
    </>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
