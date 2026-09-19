"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Loader2,
  SendHorizontal,
  ShieldQuestion,
  Sparkles,
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
} from "@/lib/agent";
import { useVerification } from "@/lib/verification-store";
import { HireFlowGlyph } from "./logo";
import { StatusBadge } from "./status-badge";

/**
 * AI Interview Agent — an on-demand right-side drawer, built as a single
 * conversation.
 *
 * One message thread (the only scroll region) and one composer. Both things the
 * agent does flow through that composer:
 *   • "Answer" mode  → the recorded answer is sent to the model, which decides
 *      whether it verifies the focused requirement (and the server refuses any
 *      "met" it cannot ground in the answer). Status updates live.
 *   • "Ask" mode     → a free question about the candidate, answered from the
 *      live per-candidate state.
 * No manual "mark verified" control; the recruiter runs the conversation.
 */
export function AiAgentPanel({
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Embedded, not an overlay: a sticky right-hand column that fits inside the
  // app card. It sticks to the top of the scrolling content and is capped to the
  // visible content height so the whole conversation stays on screen while the
  // workspace scrolls beside it.
  return (
    <aside
      aria-label={`HireFlow AI interview assistant for ${candidate.name}`}
      className="mt-4 lg:sticky lg:top-0 lg:mt-0 lg:self-start"
    >
      <div className="flex h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-card card-lift lg:h-[calc(100dvh-12.5rem)]">
        <AgentChat
          key={candidate.id}
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
      </div>
    </aside>
  );
}

/* ── conversation model ─────────────────────────────────────────────────── */

type Message =
  | { id: string; role: "user"; text: string; tag?: string }
  | { id: string; role: "ai"; kind: "text"; title?: string; body: string; model?: string }
  | {
      id: string;
      role: "ai";
      kind: "verdict";
      reqId: string;
      priorStatus: FindingStatus;
      newStatus: FindingStatus;
      outcome: "verified" | "insufficient";
      reason: string;
      evidenceQuote?: string | null;
      evidenceSource: string;
      followUp?: string | null;
      model: string;
      elapsedMs: number;
    }
  | { id: string; role: "ai"; kind: "pending"; label: string }
  | { id: string; role: "ai"; kind: "error"; body: string };

function AgentChat({
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
  const { record, isVerifiedLive } = useVerification();

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
  const focusOpen =
    !!focusFinding &&
    (focusFinding.status === "unverified" ||
      focusFinding.status === "absent" ||
      focusFinding.status === "partial");

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "seed",
      role: "ai",
      kind: "text",
      body: focusReq
        ? `I'm on ${focusReq.id} — “${focusReq.text}”, currently ${labelFor(focusFinding?.status ?? "absent")}. Paste ${candidate.name.split(" ")[0]}'s answer and I'll check whether it verifies, or switch to Ask and question me about this candidate.`
        : `Ask me anything about ${candidate.name}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"answer" | "ask">(focusOpen ? "answer" : "ask");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [health, setHealth] = useState<{
    configured: boolean;
    model: string | null;
  } | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

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
      .catch(() => alive && setHealth({ configured: false, model: null }));
    return () => {
      alive = false;
    };
  }, []);

  const liveStatuses = useMemo(() => {
    const m: Record<string, FindingStatus> = {};
    for (const f of findings) m[f.requirementId] = f.status;
    return m;
  }, [findings]);

  function push(...m: Message[]) {
    setMessages((prev) => [...prev, ...m]);
  }
  function replacePending(pendingId: string, msg: Message) {
    setMessages((prev) => prev.map((m) => (m.id === pendingId ? msg : m)));
  }

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

  /* ── send handlers ── */

  async function sendAnswer(text: string) {
    if (!focusReq || !focusFinding || !text.trim() || busy) return;
    const pendingId = newEventId("p");
    push(
      { id: newEventId("u"), role: "user", text, tag: `Answer · ${focusReq.id}` },
      { id: pendingId, role: "ai", kind: "pending", label: `Checking against ${focusReq.id}` },
    );
    setBusy(true);
    startTimer();
    try {
      const ev = await analyzeInterviewAnswer({
        candidateId: candidate.id,
        requirementId: focusReqId,
        question: questionByReq.get(focusReqId)?.question,
        answer: text,
      });
      record({
        id: newEventId(`VE-${candidate.id}-${focusReqId}`),
        candidateId: candidate.id,
        requirementId: focusReqId,
        priorStatus: ev.priorStatus,
        newStatus: ev.newStatus,
        outcome: ev.outcome,
        reason: ev.reason,
        evidenceQuote: ev.evidenceQuote ?? undefined,
        evidenceSource: ev.evidenceSource,
        answer: text,
        followUp: ev.followUp ?? undefined,
        at: nowIso(),
        verifiedBy: "HireFlow AI",
      });
      replacePending(pendingId, {
        id: pendingId,
        role: "ai",
        kind: "verdict",
        reqId: focusReqId,
        priorStatus: ev.priorStatus,
        newStatus: ev.newStatus,
        outcome: ev.outcome,
        reason: ev.reason,
        evidenceQuote: ev.evidenceQuote,
        evidenceSource: ev.evidenceSource,
        followUp: ev.followUp,
        model: ev.model,
        elapsedMs: ev.elapsedMs,
      });
    } catch (e) {
      replacePending(pendingId, {
        id: pendingId,
        role: "ai",
        kind: "error",
        body: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
      stopTimer();
    }
  }

  async function sendAsk(text: string, tag?: string) {
    if (!text.trim() || busy) return;
    const pendingId = newEventId("p");
    push(
      { id: newEventId("u"), role: "user", text, tag },
      { id: pendingId, role: "ai", kind: "pending", label: "Thinking" },
    );
    setBusy(true);
    try {
      const res = await askAgent({
        candidateId: candidate.id,
        requirementId: focusReqId || undefined,
        intent: "free",
        question: text,
        liveStatuses,
      });
      replacePending(pendingId, {
        id: pendingId,
        role: "ai",
        kind: "text",
        title: res.title,
        body: res.body,
        model: res.model,
      });
    } catch (e) {
      replacePending(pendingId, {
        id: pendingId,
        role: "ai",
        kind: "error",
        body: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function suggestQuestion() {
    if (!focusReq || busy) return;
    const pendingId = newEventId("p");
    push({ id: pendingId, role: "ai", kind: "pending", label: "Writing a question" });
    setBusy(true);
    try {
      const q = await generateQuestion({
        candidateId: candidate.id,
        requirementId: focusReqId,
      });
      replacePending(pendingId, {
        id: pendingId,
        role: "ai",
        kind: "text",
        title: `Suggested question · ${focusReq.id}`,
        body: q.question,
      });
    } catch (e) {
      replacePending(pendingId, {
        id: pendingId,
        role: "ai",
        kind: "error",
        body: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  function onSubmit() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (mode === "answer") sendAnswer(text);
    else sendAsk(text);
  }

  const verified = isVerifiedLive(candidate.id, focusReqId);
  const hasRecorded = !!recordedAnswers[focusReqId];

  const state: "checking" | "ready" | "unconfigured" | "error" =
    health === null ? "checking" : health.configured ? "ready" : "unconfigured";

  return (
    <>
      {/* Header */}
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

      {/* Focus context — one compact control, not a panel */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
        <span className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Focus
        </span>
        <select
          value={focusReqId}
          onChange={(e) => onFocus(e.target.value)}
          aria-label="Requirement in focus"
          className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium text-foreground/80"
        >
          {requirements.map((r) => {
            const st = findingByReq.get(r.id)?.status ?? "absent";
            return (
              <option key={r.id} value={r.id}>
                {r.id} — {r.text.length > 40 ? r.text.slice(0, 40) + "…" : r.text}{" "}
                ({labelFor(st)})
              </option>
            );
          })}
        </select>
        {focusFinding && <StatusBadge status={focusFinding.status} />}
      </div>

      {/* THE single scroll region — the conversation */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} elapsed={elapsed} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Suggestions (wrap, no scroll) */}
      <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-border px-4 pt-2.5">
        {mode === "answer" && hasRecorded && (
          <Chip
            onClick={() => setInput(recordedAnswers[focusReqId])}
            disabled={busy}
          >
            <Sparkles className="size-3" aria-hidden />
            Use recorded answer
          </Chip>
        )}
        {focusReq && !verified && (
          <Chip onClick={suggestQuestion} disabled={busy}>
            <ShieldQuestion className="size-3" aria-hidden />
            Suggest a question
          </Chip>
        )}
        {focusReq && !verified && (
          <Chip
            onClick={() =>
              sendAsk(`Why is ${focusReq.id} not verified yet?`, "Quick ask")
            }
            disabled={busy}
          >
            Why flagged?
          </Chip>
        )}
        <Chip
          onClick={() =>
            sendAsk(`What should I ask ${candidate.name.split(" ")[0]} next?`, "Quick ask")
          }
          disabled={busy}
        >
          What next?
        </Chip>
        <Chip
          onClick={() => sendAsk(`Summarise ${candidate.name} against this role.`, "Quick ask")}
          disabled={busy}
        >
          Summarise
        </Chip>
      </div>

      {/* Composer — one input, mode toggle */}
      <div className="shrink-0 border-t border-border bg-card p-3">
        <div className="mb-2 inline-flex rounded-full border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("answer")}
            className={cn(
              "rounded-full px-3 py-1 font-semibold transition-colors",
              mode === "answer"
                ? "bg-[var(--color-violet)] text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Candidate answer
          </button>
          <button
            type="button"
            onClick={() => setMode("ask")}
            className={cn(
              "rounded-full px-3 py-1 font-semibold transition-colors",
              mode === "ask"
                ? "bg-[var(--color-violet)] text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ask AI
          </button>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={mode === "answer" ? 3 : 1}
            disabled={busy}
            placeholder={
              mode === "answer"
                ? `Paste ${candidate.name.split(" ")[0]}'s answer to ${focusReqId}…`
                : `Ask about ${candidate.name.split(" ")[0]}…`
            }
            aria-label={
              mode === "answer"
                ? "Candidate's interview answer"
                : "Ask HireFlow AI about this candidate"
            }
            className="max-h-40 min-w-0 flex-1 resize-none rounded-xl border border-input bg-muted/40 p-2.5 text-sm outline-none focus:border-ring disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={!input.trim() || busy}
            aria-label={mode === "answer" ? "Analyse answer" : "Send question"}
            className="grid size-10 shrink-0 place-items-center rounded-xl brand-gradient text-white disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizontal className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {mode === "answer"
            ? "HireFlow AI decides if the answer verifies the requirement — you make the hiring call."
            : "Grounded in this candidate's evidence. Enter to send, Shift+Enter for a new line."}
        </p>
      </div>
    </>
  );
}

/* ── bubbles ────────────────────────────────────────────────────────────── */

function MessageBubble({ m, elapsed }: { m: Message; elapsed: number }) {
  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end">
        {m.tag && (
          <span className="mb-0.5 text-[10px] font-medium text-muted-foreground">
            {m.tag}
          </span>
        )}
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-violet)] px-3 py-2 text-sm text-white">
          {m.text}
        </div>
      </div>
    );
  }

  if (m.kind === "pending") {
    return (
      <AiRow>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
          {m.label}…
          <span className="font-mono tabular-nums">{elapsed.toFixed(1)}s</span>
        </div>
      </AiRow>
    );
  }

  if (m.kind === "error") {
    return (
      <AiRow tone="error">
        <div className="flex items-start gap-2">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-[var(--color-absent)]"
            aria-hidden
          />
          <div>
            <p className="text-xs font-semibold text-[var(--color-absent)]">
              The agent couldn&apos;t respond
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
              {m.body}
            </p>
          </div>
        </div>
      </AiRow>
    );
  }

  if (m.kind === "text") {
    return (
      <AiRow>
        {m.title && (
          <p className="mb-1 text-xs font-semibold text-primary">{m.title}</p>
        )}
        <p className="text-sm leading-relaxed text-foreground/90">{m.body}</p>
        {m.model && (
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
            {m.model}
          </p>
        )}
      </AiRow>
    );
  }

  // verdict
  const good = m.outcome === "verified";
  return (
    <AiRow tone={good ? "met" : "warn"}>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={m.priorStatus} />
        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
        <StatusBadge status={m.newStatus} />
        {good && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-met)]">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verified by HireFlow AI
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
        {m.reason}
      </p>
      {m.evidenceQuote && (
        <div className="mt-2">
          <blockquote className="evidence-quote rounded-lg border-l-2 border-[var(--color-met)] bg-card/80 py-1.5 pr-3 pl-3 text-foreground/85">
            {m.evidenceQuote}
          </blockquote>
          <p className="mt-1 flex items-center gap-1 pl-3 text-[11px] text-[var(--color-met)]">
            <BadgeCheck className="size-3.5" aria-hidden />
            quote located in the {m.evidenceSource.toLowerCase()}
          </p>
        </div>
      )}
      {!good && m.followUp && (
        <div className="mt-2 rounded-lg border-l-2 border-primary/40 bg-card/80 py-1.5 pr-3 pl-3">
          <p className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Ask this follow-up
          </p>
          <p className="mt-1 text-sm text-foreground/90">{m.followUp}</p>
        </div>
      )}
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        {m.model} · {(m.elapsedMs / 1000).toFixed(1)}s
      </p>
    </AiRow>
  );
}

function AiRow({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "met" | "warn" | "error";
}) {
  const toneCls = {
    default: "border-border bg-muted/50",
    met: "border-[var(--color-met-border)] bg-[var(--color-met-bg)]",
    warn: "border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)]",
    error: "border-[var(--color-absent-border)] bg-[var(--color-absent-bg)]",
  }[tone];
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full brand-gradient text-white">
        <HireFlowGlyph size={12} />
      </span>
      <div className={cn("max-w-[88%] rounded-2xl rounded-tl-sm border p-3", toneCls)}>
        {children}
      </div>
    </div>
  );
}

function Chip({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function labelFor(s: FindingStatus): string {
  return { met: "Met", partial: "Partial", unverified: "Unverified", absent: "No evidence" }[s];
}

function AgentStatusBadge({
  state,
  model,
}: {
  state: "checking" | "ready" | "unconfigured" | "error";
  model: string | null;
}) {
  const meta = {
    checking: { dot: "bg-muted-foreground/50", cls: "bg-muted text-muted-foreground", label: "checking…" },
    ready: { dot: "bg-[var(--color-met)]", cls: "bg-[var(--color-met-bg)] text-[var(--color-met)]", label: model ?? "connected" },
    unconfigured: { dot: "bg-[var(--color-unverified)]", cls: "bg-[var(--color-unverified-bg)] text-[var(--color-unverified)]", label: "no model" },
    error: { dot: "bg-[var(--color-absent)]", cls: "bg-[var(--color-absent-bg)] text-[var(--color-absent)]", label: "model error" },
  }[state];
  return (
    <span
      className={cn(
        "ml-auto inline-flex max-w-[42%] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
        meta.cls,
      )}
      title={model ? `Agent model: ${model}` : undefined}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
      <span className="truncate font-mono">{meta.label}</span>
    </span>
  );
}
