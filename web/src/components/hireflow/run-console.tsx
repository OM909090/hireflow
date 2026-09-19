"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  Check,
  FastForward,
  Loader2,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActivityEvent, ActivityKind } from "@/lib/types";
import { Eyebrow } from "./kit";

/**
 * Replays a recorded screening run, event by event.
 *
 * The events are the real trace from the LangGraph pipeline (see api/). We
 * replay rather than call the model live because the model endpoint is a
 * localhost proxy that a deployed site cannot reach, and because each call takes
 * ~30 s. Replaying the genuine trace keeps the run honest while making the agent
 * visibly do its work — including the verifier refusing claims it cannot ground.
 */

const KIND: Record<ActivityKind, { icon: typeof Bot; badge: string }> = {
  agent: { icon: Bot, badge: "bg-accent text-accent-foreground" },
  verifier: {
    icon: BadgeCheck,
    badge: "bg-[var(--color-met-bg)] text-[var(--color-met)]",
  },
  tool: { icon: Wrench, badge: "bg-muted text-muted-foreground" },
  warn: { icon: AlertTriangle, badge: "bg-[#f59e0b] text-white" },
};

const STEPS = ["Ingest", "Requirements", "Review", "Verify", "Questions"];

function phaseOf(message: string): number {
  const m = message.toLowerCase();
  if (m.includes("parsed job")) return 1;
  if (m.includes("proposed evidence") || m.includes("review")) return 2;
  if (
    m.includes("located") ||
    m.includes("verification") ||
    m.includes("downgraded") ||
    m.includes("refused")
  )
    return 3;
  if (m.includes("question")) return 4;
  if (m.includes("run complete")) return 4;
  return 0;
}

export function RunConsole({
  events,
  onDone,
}: {
  events: ActivityEvent[];
  onDone: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const skipped = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let i = 0;

    function tick() {
      if (cancelled) return;
      i += 1;
      setShown(i);
      if (i >= events.length) {
        setDone(true);
        window.setTimeout(() => !cancelled && onDone(), 700);
        return;
      }
      // Warn/verifier lines linger a touch longer so the eye catches them.
      const next = events[i];
      const delay = next && (next.kind === "warn" || next.kind === "verifier") ? 260 : 170;
      timer = window.setTimeout(tick, delay);
    }

    let timer = window.setTimeout(tick, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [shown]);

  function skip() {
    skipped.current = true;
    setShown(events.length);
    setDone(true);
    window.setTimeout(onDone, 250);
  }

  const visible = events.slice(0, shown);
  const currentPhase = visible.length ? phaseOf(visible[visible.length - 1].message) : 0;
  const pct = Math.round((shown / events.length) * 100);
  const refused = visible.filter((e) => e.kind === "warn").length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-border bg-card card-lift">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          {done ? (
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--color-met-bg)] text-[var(--color-met)]">
              <Check className="size-5" aria-hidden />
            </span>
          ) : (
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {done ? "Screening complete" : "Screening in progress"}
            </p>
            <p className="text-xs text-muted-foreground">
              {done
                ? "Replayed the recorded agent run"
                : "Replaying the recorded agent run · the agent proposes, the verifier decides"}
            </p>
          </div>
          {!done && (
            <button
              type="button"
              onClick={skip}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-accent"
            >
              <FastForward className="size-3.5" aria-hidden />
              Skip
            </button>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {STEPS.map((s, i) => {
            const state =
              i < currentPhase || done ? "done" : i === currentPhase ? "active" : "todo";
            return (
              <div key={s} className="flex flex-1 items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full text-[10px] font-bold transition-colors",
                      state === "done" && "bg-[var(--color-met)] text-white",
                      state === "active" && "bg-primary text-white",
                      state === "todo" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "done" ? <Check className="size-3" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[11px] font-medium sm:inline",
                      state === "todo" ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "h-px flex-1",
                      i < currentPhase || done ? "bg-[var(--color-met)]" : "bg-border",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full brand-gradient transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Event stream */}
        <div
          ref={scroller}
          className="h-72 space-y-1 overflow-y-auto px-5 py-4"
          aria-live="polite"
        >
          {visible.map((e) => {
            const k = KIND[e.kind];
            const Icon = k.icon;
            const loud = e.kind === "warn";
            return (
              <div
                key={e.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2 py-1.5",
                  loud && "bg-[var(--color-unverified-bg)]",
                )}
              >
                <span className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {e.at}
                </span>
                <span
                  className={cn(
                    "mt-px inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                    k.badge,
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                  {e.kind === "warn" ? "verifier" : e.kind}
                </span>
                <span
                  className={cn(
                    "evidence-quote min-w-0 flex-1",
                    loud
                      ? "font-semibold text-[var(--color-unverified)]"
                      : "text-foreground/85",
                  )}
                >
                  {e.message}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <Eyebrow>
            {shown} / {events.length} events
          </Eyebrow>
          {refused > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-unverified)]">
              <AlertTriangle className="size-3.5" aria-hidden />
              {refused} claim{refused === 1 ? "" : "s"} refused by the verifier
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
