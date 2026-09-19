"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  HelpCircle,
  Loader2,
  MessageSquareQuote,
  Mic,
  ShieldQuestion,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  Candidate,
  Finding,
  FindingStatus,
  InterviewQuestion,
  Requirement,
} from "@/lib/types";
import {
  analyzeInterviewAnswer,
  askAgent,
  newEventId,
  nowIso,
  type HelpAction,
} from "@/lib/agent";
import type { AnswerEvaluation } from "@/lib/interview-eval";
import { useVerification } from "@/lib/verification-store";
import { HireFlowGlyph } from "./logo";
import { Eyebrow, IdTag } from "./kit";
import { StatusBadge } from "./status-badge";

const HELP_ITEMS: { action: HelpAction; label: string }[] = [
  { action: "why", label: "Why is this unverified?" },
  { action: "missing", label: "What evidence is missing?" },
  { action: "explain", label: "Explain this requirement" },
  { action: "followup", label: "Generate a follow-up" },
  { action: "summary", label: "Summarise candidate" },
  { action: "progress", label: "Review interview progress" },
];

const STEPS = [
  "Reading the recorded answer",
  "Matching evidence to the requirement",
  "Checking sufficiency",
  "Recording verification",
];

/**
 * AI Interview Agent — the recruiter's interview copilot.
 *
 * It is candidate-aware (everything is scoped to the candidate + requirement it
 * is focused on) and it owns the verification decision: the recruiter conducts
 * the conversation and records the answer, the agent decides whether the
 * evidence is sufficient and only then promotes the requirement to met. There
 * is deliberately no manual "mark verified" control.
 */
export function AiInterviewAgent({
  candidate,
  jobTitle,
  requirements,
  findings,
  questions,
  recordedAnswers,
  focusReqId,
  onFocus,
}: {
  candidate: Candidate;
  jobTitle: string;
  requirements: Requirement[];
  findings: Finding[];
  questions: InterviewQuestion[];
  recordedAnswers: Record<string, string>;
  focusReqId: string;
  onFocus: (reqId: string) => void;
}) {
  const { record, historyFor, isVerifiedLive } = useVerification();

  const reqById = useMemo(
    () => new Map(requirements.map((r) => [r.id, r])),
    [requirements],
  );
  const findingByReq = useMemo(
    () => new Map(findings.map((f) => [f.requirementId, f])),
    [findings],
  );
  const questionByReq = useMemo(
    () => new Map(questions.map((q) => [q.requirementId, q])),
    [questions],
  );

  const focusReq = reqById.get(focusReqId);
  const focusFinding = findingByReq.get(focusReqId);
  const focusQuestion = questionByReq.get(focusReqId);

  const open = findings.filter(
    (f) => f.status === "unverified" || f.status === "absent",
  );

  const [answer, setAnswer] = useState(() => recordedAnswers[focusReqId] ?? "");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "result">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnswerEvaluation | null>(null);
  const [priorAtAnalyze, setPriorAtAnalyze] = useState<FindingStatus | null>(
    null,
  );
  const [help, setHelp] = useState<{ title: string; body: string } | null>(null);
  const [helpBusy, setHelpBusy] = useState(false);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interaction state is reset by remounting on focus change (keyed in the
  // parent). That is what guarantees no context leaks between requirements or
  // candidates. Here we only clean up the step timer on unmount.
  useEffect(() => {
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current);
    };
  }, []);

  async function analyze() {
    if (!focusReq || !focusFinding || !answer.trim()) return;
    setPriorAtAnalyze(focusFinding.status);
    setPhase("analyzing");
    setStep(0);
    stepTimer.current = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      230,
    );

    const evaluation = await analyzeInterviewAnswer({
      requirement: focusReq,
      finding: focusFinding,
      answer,
      fallbackFollowUp: focusQuestion?.followUp,
    });

    if (stepTimer.current) clearInterval(stepTimer.current);

    record({
      id: newEventId(`VE-${candidate.id}-${focusReqId}`),
      candidateId: candidate.id,
      requirementId: focusReqId,
      priorStatus: focusFinding.status,
      newStatus: evaluation.newStatus,
      outcome: evaluation.outcome,
      reason: evaluation.reason,
      evidenceQuote: evaluation.evidenceQuote,
      evidenceSource: evaluation.evidenceSource,
      answer,
      followUp: evaluation.followUp,
      at: nowIso(),
      verifiedBy: "HireFlow AI",
    });

    setResult(evaluation);
    setPhase("result");
  }

  async function runHelp(action: HelpAction) {
    setHelpBusy(true);
    setHelp(null);
    const res = await askAgent(action, {
      candidate,
      requirement: focusReq,
      finding: focusFinding,
      findings,
      requirements,
      questions,
    });
    setHelp(res);
    setHelpBusy(false);
  }

  const focusStatus = focusFinding?.status ?? "absent";
  const verifiedLive = isVerifiedLive(candidate.id, focusReqId);
  const history = historyFor(candidate.id, focusReqId);

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card lg:sticky lg:top-4 lg:max-h-[calc(100dvh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-gradient-to-br from-[var(--color-violet)]/10 to-transparent px-4 py-3">
        <HireFlowGlyph size={18} className="text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">HireFlow AI</p>
          <p className="text-[11px] text-muted-foreground">Interview assistant</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--color-met-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-met)]">
          <span className="size-1.5 rounded-full bg-[var(--color-met)]" />
          connected
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {/* Candidate context */}
        <div>
          <Eyebrow>Current candidate</Eyebrow>
          <p className="mt-0.5 text-sm font-semibold">{candidate.name}</p>
          <p className="text-xs text-muted-foreground">{jobTitle}</p>
        </div>

        {/* Focus selector */}
        <div>
          <Eyebrow>Focus requirement</Eyebrow>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {requirements.map((r) => {
              const st = findingByReq.get(r.id)?.status ?? "absent";
              const active = r.id === focusReqId;
              const done = st === "met";
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onFocus(r.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] font-bold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                        ? "border-[var(--color-met-border)] bg-[var(--color-met-bg)] text-[var(--color-met)]"
                        : "border-border text-muted-foreground hover:bg-accent",
                  )}
                  title={r.text}
                >
                  {done && <BadgeCheck className="size-3" aria-hidden />}
                  {r.id}
                </button>
              );
            })}
          </div>
        </div>

        {focusReq && (
          <div className="rounded-2xl border border-border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <IdTag>{focusReq.id}</IdTag>
              <StatusBadge status={focusStatus} />
            </div>
            <p className="mt-2 text-sm font-medium">{focusReq.text}</p>
            {focusFinding && !verifiedLive && (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground/70">
                  Why flagged:{" "}
                </span>
                {focusFinding.missingDetail ?? focusFinding.reason}
              </p>
            )}
          </div>
        )}

        {/* Suggested question */}
        {focusReq && !verifiedLive && (
          <div className="rounded-2xl bg-accent p-3">
            <Eyebrow tone="brand" className="flex items-center gap-1.5">
              <ShieldQuestion className="size-3.5" aria-hidden />
              Suggested question
            </Eyebrow>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              {focusQuestion?.question ??
                `Walk me through your hands-on experience with ${focusReq.text.toLowerCase()} — a specific system, what you personally did, and how it ran in production.`}
            </p>
          </div>
        )}

        {/* Answer + analyze */}
        {focusReq && (
          <div>
            <Eyebrow className="flex items-center gap-1.5">
              <MessageSquareQuote className="size-3.5" aria-hidden />
              Candidate answer
            </Eyebrow>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="Record or paste the candidate's answer…"
              className="mt-1 w-full resize-none rounded-xl border border-input bg-muted/40 p-3 text-sm text-foreground outline-none focus:border-ring"
            />
            {phase !== "analyzing" && (
              <button
                type="button"
                onClick={analyze}
                disabled={!answer.trim()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                <HireFlowGlyph size={14} />
                Analyse answer
              </button>
            )}
          </div>
        )}

        {/* Analyzing */}
        {phase === "analyzing" && (
          <div className="space-y-1.5 rounded-2xl border border-border bg-muted/40 p-3">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  i <= step ? "text-foreground" : "text-muted-foreground/50",
                )}
              >
                {i < step ? (
                  <BadgeCheck
                    className="size-3.5 text-[var(--color-met)]"
                    aria-hidden
                  />
                ) : i === step ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <span className="size-3.5" />
                )}
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {phase === "result" && result && focusFinding && (
          <div
            className={cn(
              "rounded-2xl border p-3",
              result.outcome === "verified"
                ? "border-[var(--color-met-border)] bg-[var(--color-met-bg)]"
                : "border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)]",
            )}
          >
            <div className="flex items-center gap-2">
              <Eyebrow>AI result</Eyebrow>
              <span className="ml-auto flex items-center gap-1.5">
                {priorAtAnalyze && <StatusBadge status={priorAtAnalyze} />}
                <ArrowRight
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
                <StatusBadge
                  status={
                    result.outcome === "verified"
                      ? "met"
                      : (priorAtAnalyze ?? focusFinding.status)
                  }
                />
              </span>
            </div>
            {result.outcome === "verified" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-met)]">
                <BadgeCheck className="size-3.5" aria-hidden />
                Verified by HireFlow AI
              </p>
            )}
            <p className="mt-2 text-sm text-foreground/90">{result.reason}</p>

            {result.evidenceQuote && (
              <div className="mt-2.5">
                <blockquote className="evidence-quote rounded-lg border-l-2 border-[var(--color-met)] bg-card/70 py-1.5 pr-3 pl-3 text-foreground/85">
                  {result.evidenceQuote}
                </blockquote>
                <p className="mt-1 flex items-center gap-1 pl-3 text-[11px] text-[var(--color-met)]">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  {result.evidenceSource}
                </p>
              </div>
            )}

            {result.outcome === "insufficient" && result.followUp && (
              <div className="mt-2.5 rounded-lg border-l-2 border-primary/40 bg-card/70 py-1.5 pr-3 pl-3">
                <Eyebrow>Ask this follow-up</Eyebrow>
                <p className="mt-1 text-sm text-foreground/90">
                  {result.followUp}
                </p>
              </div>
            )}

            {open.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = open.find((f) => f.requirementId !== focusReqId);
                  if (next) onFocus(next.requirementId);
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Next open requirement
                <ArrowRight className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}

        {/* Verification history */}
        {history.length > 0 && (
          <div>
            <Eyebrow>Verification history · {focusReqId}</Eyebrow>
            <ol className="mt-2 space-y-2 border-l border-border pl-3">
              {history.map((e) => (
                <li key={e.id} className="relative text-xs">
                  <span
                    className={cn(
                      "absolute -left-[17px] top-1 size-2 rounded-full ring-2 ring-card",
                      e.outcome === "verified"
                        ? "bg-[var(--color-met)]"
                        : "bg-[var(--color-unverified)]",
                    )}
                  />
                  <span className="font-medium">
                    {e.outcome === "verified"
                      ? "Verified by HireFlow AI"
                      : "Answer insufficient"}
                  </span>
                  <span className="ml-1.5 text-muted-foreground">
                    {new Date(e.at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Ask HireFlow AI */}
        <div className="rounded-2xl border border-border p-3">
          <Eyebrow className="flex items-center gap-1.5">
            <HelpCircle className="size-3.5" aria-hidden />
            Ask HireFlow AI
          </Eyebrow>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HELP_ITEMS.map((h) => (
              <button
                key={h.action}
                type="button"
                onClick={() => runHelp(h.action)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                {h.label}
                <ChevronRight className="size-3" aria-hidden />
              </button>
            ))}
          </div>
          {helpBusy && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Thinking…
            </div>
          )}
          {help && (
            <div className="mt-2 rounded-xl bg-muted/60 p-2.5">
              <p className="text-[11px] font-semibold text-primary">
                {help.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/85">
                {help.body}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
        <Mic className="size-3" aria-hidden />
        You run the conversation. HireFlow AI decides when the evidence verifies.
      </div>
    </div>
  );
}
