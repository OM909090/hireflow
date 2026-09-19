"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CornerDownLeft,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  ShieldQuestion,
  TriangleAlert,
  X,
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
  generateQuestion,
  newEventId,
  nowIso,
  type AgentEvaluation,
  type HelpAction,
} from "@/lib/agent";
import { useVerification } from "@/lib/verification-store";
import { HireFlowGlyph } from "./logo";
import { Eyebrow, IdTag } from "./kit";
import { StatusBadge } from "./status-badge";

const HELP_ITEMS: { action: HelpAction; label: string }[] = [
  { action: "why", label: "Why is this flagged?" },
  { action: "missing", label: "What evidence is missing?" },
  { action: "explain", label: "Explain this requirement" },
  { action: "followup", label: "Generate a follow-up" },
  { action: "next", label: "What should I ask next?" },
  { action: "summary", label: "Summarise candidate" },
  { action: "progress", label: "Review interview progress" },
];

/**
 * AI Interview Agent — an on-demand right-hand drawer.
 *
 * It is deliberately NOT always open: the evidence workspace gets the full width
 * until the recruiter asks for help, at which point the agent slides in from the
 * right with the candidate and requirement already in context.
 *
 * Responsibility split: the recruiter runs the conversation and records the
 * answer; the model judges the evidence; the server refuses any "met" promotion
 * whose quote it cannot locate in that answer. There is no manual verify control.
 */
export function AiAgentDrawer({
  open,
  onClose,
  candidate,
  jobTitle,
  requirements,
  findings,
  questions,
  recordedAnswers,
  focusReqId,
  onFocus,
}: {
  open: boolean;
  onClose: () => void;
  candidate: Candidate;
  jobTitle: string;
  requirements: Requirement[];
  findings: Finding[];
  questions: InterviewQuestion[];
  recordedAnswers: Record<string, string>;
  focusReqId: string;
  onFocus: (reqId: string) => void;
}) {
  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-foreground/10 transition-opacity duration-200 supports-backdrop-filter:backdrop-blur-[2px]",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`HireFlow AI interview assistant for ${candidate.name}`}
        aria-hidden={!open}
        className={cn(
          "fixed top-0 right-0 z-50 flex h-dvh w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-250 ease-out sm:w-[440px]",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        {open && (
          <AgentBody
            key={`${candidate.id}:${focusReqId}`}
            onClose={onClose}
            candidate={candidate}
            jobTitle={jobTitle}
            requirements={requirements}
            findings={findings}
            questions={questions}
            recordedAnswers={recordedAnswers}
            focusReqId={focusReqId}
            onFocus={onFocus}
          />
        )}
      </aside>
    </>
  );
}

function AgentBody({
  onClose,
  candidate,
  jobTitle,
  requirements,
  findings,
  questions,
  recordedAnswers,
  focusReqId,
  onFocus,
}: {
  onClose: () => void;
  candidate: Candidate;
  jobTitle: string;
  requirements: Requirement[];
  findings: Finding[];
  questions: InterviewQuestion[];
  recordedAnswers: Record<string, string>;
  focusReqId: string;
  onFocus: (reqId: string) => void;
}) {
  const { record, historyFor, eventsFor, isVerifiedLive } = useVerification();

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
  const [result, setResult] = useState<AgentEvaluation | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [question, setQuestion] = useState<string | null>(null);
  const [questionBusy, setQuestionBusy] = useState(false);

  const [help, setHelp] = useState<{
    title: string;
    body: string;
    model: string;
  } | null>(null);
  const [helpBusy, setHelpBusy] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [freeQuestion, setFreeQuestion] = useState("");

  const [health, setHealth] = useState<{
    configured: boolean;
    model: string | null;
  } | null>(null);

  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/agent/health")
      .then((r) => r.json())
      .then((d) => {
        if (alive)
          setHealth({ configured: !!d.configured, model: d.model ?? null });
      })
      .catch(() => {
        if (alive) setHealth({ configured: false, model: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  const liveStatuses = useMemo(() => {
    const m: Record<string, FindingStatus> = {};
    for (const f of findings) m[f.requirementId] = f.status;
    return m;
  }, [findings]);

  const interviewLog = useMemo(
    () =>
      eventsFor(candidate.id).map(
        (e) =>
          `${e.requirementId}: ${e.outcome === "verified" ? "verified from interview answer" : "answer insufficient"} — ${e.reason}`,
      ),
    [eventsFor, candidate.id],
  );

  const shownQuestion =
    question ??
    focusQuestion?.question ??
    (focusReq
      ? `Walk me through your hands-on experience with ${focusReq.text.toLowerCase()} — a specific system, what you personally did, and how it ran in production.`
      : "");

  function startTimer() {
    setElapsed(0);
    const t0 = Date.now();
    tick.current = setInterval(
      () => setElapsed(Math.round((Date.now() - t0) / 100) / 10),
      100,
    );
  }
  function stopTimer() {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }

  async function analyze() {
    if (!focusReq || !focusFinding || !answer.trim()) return;
    setPhase("analyzing");
    setResult(null);
    setAnalyzeError(null);
    startTimer();
    try {
      const evaluation = await analyzeInterviewAnswer({
        candidateId: candidate.id,
        requirementId: focusReqId,
        question: shownQuestion,
        answer,
      });
      record({
        id: newEventId(`VE-${candidate.id}-${focusReqId}`),
        candidateId: candidate.id,
        requirementId: focusReqId,
        priorStatus: evaluation.priorStatus,
        newStatus: evaluation.newStatus,
        outcome: evaluation.outcome,
        reason: evaluation.reason,
        evidenceQuote: evaluation.evidenceQuote ?? undefined,
        evidenceSource: evaluation.evidenceSource,
        answer,
        followUp: evaluation.followUp ?? undefined,
        at: nowIso(),
        verifiedBy: "HireFlow AI",
      });
      setResult(evaluation);
      setPhase("result");
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    } finally {
      stopTimer();
    }
  }

  async function regenerateQuestion() {
    if (!focusReq) return;
    setQuestionBusy(true);
    setHelpError(null);
    try {
      const q = await generateQuestion({
        candidateId: candidate.id,
        requirementId: focusReqId,
        alreadyAsked: [
          ...questions.map((x) => x.question),
          ...(question ? [question] : []),
        ],
      });
      setQuestion(q.question);
    } catch (e) {
      setHelpError(e instanceof Error ? e.message : String(e));
    } finally {
      setQuestionBusy(false);
    }
  }

  async function runHelp(action: HelpAction, userQuestion?: string) {
    setHelpBusy(true);
    setHelp(null);
    setHelpError(null);
    try {
      const res = await askAgent({
        candidateId: candidate.id,
        requirementId: focusReqId || undefined,
        intent: action,
        question: userQuestion,
        liveStatuses,
        interviewLog,
      });
      setHelp({ title: res.title, body: res.body, model: res.model });
    } catch (e) {
      setHelpError(e instanceof Error ? e.message : String(e));
    } finally {
      setHelpBusy(false);
    }
  }

  const focusStatus = focusFinding?.status ?? "absent";
  const verifiedLive = isVerifiedLive(candidate.id, focusReqId);
  const history = historyFor(candidate.id, focusReqId);

  const state: "checking" | "ready" | "unconfigured" | "error" =
    analyzeError || helpError
      ? "error"
      : health === null
        ? "checking"
        : health.configured
          ? "ready"
          : "unconfigured";

  return (
    <>
      {/* Sticky header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-gradient-to-br from-[var(--color-violet)]/10 to-transparent px-4 py-3">
        <HireFlowGlyph size={18} className="text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">HireFlow AI</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {candidate.name} · {jobTitle}
          </p>
        </div>
        <AgentStatusBadge state={state} model={health?.model ?? null} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close HireFlow AI"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
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
                  title={`${r.id} — ${r.text}`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[10px] font-bold transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                        ? "border-[var(--color-met-border)] bg-[var(--color-met-bg)] text-[var(--color-met)]"
                        : "border-border text-muted-foreground hover:bg-accent",
                  )}
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

        {focusReq && !verifiedLive && (
          <div className="rounded-2xl bg-accent p-3">
            <div className="flex items-center gap-1.5">
              <Eyebrow tone="brand" className="flex items-center gap-1.5">
                <ShieldQuestion className="size-3.5" aria-hidden />
                Suggested question
              </Eyebrow>
              <button
                type="button"
                onClick={regenerateQuestion}
                disabled={questionBusy}
                title="Ask the agent for a different question"
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-card disabled:opacity-50"
              >
                {questionBusy ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-3" aria-hidden />
                )}
                New
              </button>
            </div>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              {shownQuestion}
            </p>
          </div>
        )}

        {focusReq && (
          <div>
            <label
              htmlFor="agent-answer"
              className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase"
            >
              <span className="inline-flex items-center gap-1.5">
                <MessageSquareQuote className="size-3.5" aria-hidden />
                Candidate answer
              </span>
            </label>
            <textarea
              id="agent-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="Record or paste the candidate's answer…"
              className="mt-1 w-full resize-y rounded-xl border border-input bg-muted/40 p-3 text-sm text-foreground outline-none focus:border-ring"
            />
            {phase !== "analyzing" && (
              <button
                type="button"
                onClick={analyze}
                disabled={!answer.trim()}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full brand-gradient px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                <HireFlowGlyph size={14} />
                Analyse answer
              </button>
            )}
          </div>
        )}

        {phase === "analyzing" && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-xs">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            <span className="text-foreground">
              Evaluating the answer against {focusReqId}…
            </span>
            <span className="ml-auto font-mono tabular-nums text-muted-foreground">
              {elapsed.toFixed(1)}s
            </span>
          </div>
        )}

        {analyzeError && (
          <div className="flex items-start gap-2 rounded-2xl border border-[var(--color-absent-border)] bg-[var(--color-absent-bg)] p-3 text-xs">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-[var(--color-absent)]"
              aria-hidden
            />
            <div>
              <p className="font-semibold text-[var(--color-absent)]">
                Analysis failed
              </p>
              <p className="mt-0.5 leading-relaxed text-foreground/80">
                {analyzeError}
              </p>
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <div
            className={cn(
              "rounded-2xl border p-3",
              result.outcome === "verified"
                ? "border-[var(--color-met-border)] bg-[var(--color-met-bg)]"
                : "border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)]",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow>AI result</Eyebrow>
              <span className="ml-auto flex items-center gap-1.5">
                <StatusBadge status={result.priorStatus} />
                <ArrowRight
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
                <StatusBadge status={result.newStatus} />
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
                  quote located in the {result.evidenceSource.toLowerCase()}
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

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="font-mono">{result.model}</span>
              <span>{(result.elapsedMs / 1000).toFixed(1)}s</span>
              {open.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = open.find(
                      (f) => f.requirementId !== focusReqId,
                    );
                    if (next) onFocus(next.requirementId);
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Next open requirement
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <Eyebrow>Verification history · {focusReqId}</Eyebrow>
            <ol className="mt-2 space-y-2 border-l border-border pl-3">
              {history.map((e) => (
                <li key={e.id} className="relative text-xs">
                  <span
                    className={cn(
                      "absolute top-1 -left-[17px] size-2 rounded-full ring-2 ring-card",
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

        {/* Ask */}
        <div className="rounded-2xl border border-border p-3">
          <Eyebrow>Ask about this candidate</Eyebrow>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = freeQuestion.trim();
              if (q) {
                runHelp("free", q);
                setFreeQuestion("");
              }
            }}
            className="mt-2 flex items-center gap-1.5"
          >
            <input
              value={freeQuestion}
              onChange={(e) => setFreeQuestion(e.target.value)}
              placeholder="Ask anything…"
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-muted/40 px-2.5 text-xs outline-none focus:border-ring"
              aria-label="Ask HireFlow AI about this candidate"
            />
            <button
              type="submit"
              disabled={!freeQuestion.trim() || helpBusy}
              className="grid size-9 shrink-0 place-items-center rounded-lg brand-gradient text-white disabled:opacity-40"
              aria-label="Send question"
            >
              <CornerDownLeft className="size-3.5" aria-hidden />
            </button>
          </form>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {HELP_ITEMS.map((h) => (
              <button
                key={h.action}
                type="button"
                onClick={() => runHelp(h.action)}
                disabled={helpBusy}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent disabled:opacity-50"
              >
                {h.label}
              </button>
            ))}
          </div>

          {helpBusy && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              HireFlow AI is thinking…
            </div>
          )}

          {helpError && (
            <p className="mt-2 rounded-lg bg-[var(--color-absent-bg)] px-2.5 py-2 text-xs text-[var(--color-absent)]">
              {helpError}
            </p>
          )}

          {help && (
            <div className="mt-2 rounded-xl bg-muted/60 p-2.5">
              <p className="text-[11px] font-semibold text-primary">
                {help.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/85">
                {help.body}
              </p>
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                {help.model}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
        You run the conversation. HireFlow AI decides when the evidence verifies.
      </div>
    </>
  );
}

function AgentStatusBadge({
  state,
  model,
}: {
  state: "checking" | "ready" | "unconfigured" | "error";
  model: string | null;
}) {
  const meta = {
    checking: {
      dot: "bg-muted-foreground/50",
      cls: "bg-muted text-muted-foreground",
      label: "checking…",
    },
    ready: {
      dot: "bg-[var(--color-met)]",
      cls: "bg-[var(--color-met-bg)] text-[var(--color-met)]",
      label: model ?? "connected",
    },
    unconfigured: {
      dot: "bg-[var(--color-unverified)]",
      cls: "bg-[var(--color-unverified-bg)] text-[var(--color-unverified)]",
      label: "no model",
    },
    error: {
      dot: "bg-[var(--color-absent)]",
      cls: "bg-[var(--color-absent-bg)] text-[var(--color-absent)]",
      label: "model error",
    },
  }[state];

  return (
    <span
      className={cn(
        "ml-auto inline-flex max-w-[44%] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
        meta.cls,
      )}
      title={model ? `Agent model: ${model}` : undefined}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
      <span className="truncate font-mono">{meta.label}</span>
    </span>
  );
}
