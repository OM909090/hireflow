"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CoverageSummary, Decision } from "@/lib/types";

/**
 * The human decision boundary, rendered as the reference's deep-violet hero card.
 *
 * Two deliberate departures from that reference:
 *  1. The headline figure is a count of must-have requirements with located
 *     evidence, not an opaque match percentage. The number is inspectable.
 *  2. HireFlow never pre-selects a decision. The stated goal of the problem is
 *     "keeping human hiring decisions at the center", so the agent presents
 *     evidence and open gaps, then stops.
 */
export function DecisionHero({
  candidateName,
  summary,
  openCount,
}: {
  candidateName: string;
  summary: CoverageSummary;
  openCount: number;
}) {
  const [decision, setDecision] = useState<Decision>(null);

  const options: {
    value: Exclude<Decision, null>;
    label: string;
    icon: typeof ThumbsUp;
    active: string;
  }[] = [
    {
      value: "shortlist",
      label: "Shortlist",
      icon: ThumbsUp,
      active: "bg-white text-[var(--color-violet)]",
    },
    {
      value: "review",
      label: "Needs review",
      icon: Timer,
      active: "bg-[#f59e0b] text-white",
    },
    {
      value: "reject",
      label: "Reject",
      icon: ThumbsDown,
      active: "bg-[#f43f5e] text-white",
    },
  ];

  const chosen = options.find((o) => o.value === decision);

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 text-white violet-gradient card-lift">
      <div
        className="pointer-events-none absolute -top-20 -right-12 size-52 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-[10px] font-bold tracking-[0.08em] text-white/60 uppercase">
            Evidence coverage
          </p>
          {openCount > 0 && (
            <span className="rounded-full bg-[#f59e0b] px-2.5 py-1 text-[11px] font-bold text-white">
              {openCount} need{openCount === 1 ? "s" : ""} validation
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-3">
          <span className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            {summary.hardEvidenced}
            <span className="text-white/45">/{summary.hardTotal}</span>
          </span>
          <p className="pb-1 text-sm leading-tight text-white/70">
            must-have requirements
            <br />
            with located evidence
          </p>
        </div>

        <p className="mt-3 max-w-md text-xs leading-relaxed text-white/70">
          {openCount > 0
            ? `${openCount} requirement${openCount === 1 ? "" : "s"} could not be verified from ${candidateName.split(" ")[0]}'s resume. HireFlow has written questions to close ${openCount === 1 ? "it" : "them"}, but it will not decide on your behalf.`
            : `Every must-have requirement has located evidence. The decision is still yours.`}
        </p>

        <div className="mt-4 border-t border-white/15 pt-4">
          <p className="text-[10px] font-bold tracking-[0.08em] text-white/60 uppercase">
            Move forward?
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {options.map((o) => {
              const Icon = o.icon;
              const isActive = decision === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setDecision(isActive ? null : o.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? o.active
                      : "bg-white/10 text-white/85 hover:bg-white/20",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/55">
            {chosen
              ? `Recorded: ${candidateName} — ${chosen.label}.`
              : "No decision recorded yet."}
          </p>
        </div>
      </div>
    </div>
  );
}
