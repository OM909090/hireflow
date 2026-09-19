"use client";

import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Loader2,
  MessageSquareQuote,
  Mic,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { InterviewItem } from "@/lib/types";
import { Eyebrow, IdTag, Panel } from "./kit";
import { StatusBadge } from "./status-badge";

/**
 * Interview Mode — the interactive close of the evidence chain.
 *
 * A resume gap became a question; here the interviewer records the answer and
 * HireFlow re-evaluates the requirement against it. The re-evaluation is the
 * recorded result from the pipeline (the model already mapped the answer back to
 * the requirement and the verifier checked the quote against the note). Clicking
 * "Analyse" reveals it — a strong answer flips the requirement to met, a vague
 * one stays short and yields a follow-up.
 */
export function InterviewPanel({
  items,
  reqText,
}: {
  items: InterviewItem[];
  reqText: Record<string, string>;
}) {
  return (
    <Panel>
      <div className="flex items-center gap-2 px-5 pt-5">
        <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary">
          <Mic className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Interview mode
          </h2>
          <p className="text-xs text-muted-foreground">
            Record the answer to a gap and HireFlow re-checks the requirement
            against it
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {items.map((item) => (
          <InterviewCard
            key={item.id}
            item={item}
            requirementText={reqText[item.requirementId] ?? item.requirementId}
          />
        ))}
      </div>
    </Panel>
  );
}

type Phase = "idle" | "analyzing" | "done";

function InterviewCard({
  item,
  requirementText,
}: {
  item: InterviewItem;
  requirementText: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [answer, setAnswer] = useState(item.answer);

  const flippedToMet = item.newStatus === "met";
  const ev = item.evidence.find((e) => e.verified);

  function analyze() {
    setPhase("analyzing");
    window.setTimeout(() => setPhase("done"), 1300);
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Target */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <IdTag>{item.requirementId}</IdTag>
        <span className="text-sm font-medium">{requirementText}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">from resume</span>
          <StatusBadge status={item.priorStatus} />
        </span>
      </div>

      <div className="space-y-3 p-4">
        {/* Question */}
        <div>
          <Eyebrow tone="brand" className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden />
            Validation question
          </Eyebrow>
          <p className="mt-1 text-sm text-foreground/90">{item.question}</p>
        </div>

        {/* Recorded answer */}
        <div>
          <Eyebrow className="flex items-center gap-1.5">
            <MessageSquareQuote className="size-3.5" aria-hidden />
            Recorded answer
          </Eyebrow>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-input bg-muted/40 p-3 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>

        {phase === "idle" && (
          <button
            type="button"
            onClick={analyze}
            className="inline-flex items-center gap-1.5 rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Analyse answer
          </button>
        )}

        {phase === "analyzing" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Mapping the answer back to {item.requirementId}…
          </div>
        )}

        {phase === "done" && (
          <div
            className={cn(
              "rounded-2xl border p-4",
              flippedToMet
                ? "border-[var(--color-met-border)] bg-[var(--color-met-bg)]"
                : "border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)]",
            )}
          >
            {/* Transition */}
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>Re-evaluation</Eyebrow>
              <span className="ml-auto flex items-center gap-2">
                <StatusBadge status={item.priorStatus} />
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                <StatusBadge status={item.newStatus} />
              </span>
            </div>

            <p className="mt-2.5 text-sm text-foreground/90">{item.reason}</p>

            {ev && (
              <div className="mt-3">
                <blockquote className="evidence-quote rounded-lg border-l-2 border-[var(--color-met)] bg-card/70 py-2 pr-3 pl-3 text-foreground/85">
                  {ev.quote}
                </blockquote>
                <p className="mt-1 flex items-center gap-1 pl-3 text-[11px] text-[var(--color-met)]">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  quote located in the interview note
                </p>
              </div>
            )}

            {item.followUp && (
              <div className="mt-3 rounded-lg border-l-2 border-primary/40 bg-card/70 py-2 pr-3 pl-3">
                <Eyebrow>Answer still insufficient — ask</Eyebrow>
                <p className="mt-1 text-sm text-foreground/90">{item.followUp}</p>
              </div>
            )}

            {flippedToMet && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--color-met)]">
                <BadgeCheck className="size-4" aria-hidden />
                {item.requirementId} is now evidenced through the interview.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
