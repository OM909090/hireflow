import type { FindingStatus } from "./types";

/**
 * HireFlow AI agent — client for the agent's server routes.
 *
 * HireFlow is an agentic product. Every function here is a real call to the
 * connected model (`HIREFLOW_MODEL`, currently Muse Spark 1.3) through the
 * route handlers in `src/app/api/agent/*`, which hold the prompts and the API
 * key. Nothing here decides anything itself.
 *
 * Division of responsibility, enforced server-side:
 *   - the MODEL reads the interview answer and proposes a status + a quote
 *   - our CODE refuses the promotion unless that quote can be located in the
 *     answer, so "Verified by HireFlow AI" always has grounded evidence
 *   - the RECRUITER makes the hiring decision
 */

export class AgentError extends Error {}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AgentError(
      `Could not reach the agent service. ${e instanceof Error ? e.message : ""}`.trim(),
    );
  }

  const payload = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!res.ok || !payload) {
    throw new AgentError(payload?.error ?? `Agent request failed (${res.status}).`);
  }
  return payload;
}

/* ── Interview answer analysis (the verification decision) ─────────────────── */

export interface AgentEvaluation {
  outcome: "verified" | "insufficient";
  newStatus: FindingStatus;
  priorStatus: FindingStatus;
  reason: string;
  evidenceQuote: string | null;
  evidenceSource: string;
  quoteGrounded: boolean;
  missingDetail: string | null;
  followUp: string | null;
  model: string;
  elapsedMs: number;
}

export function analyzeInterviewAnswer(input: {
  candidateId: string;
  requirementId: string;
  question?: string;
  answer: string;
}): Promise<AgentEvaluation> {
  return postJson<AgentEvaluation>("/api/agent/analyze", input);
}

/* ── Question generation ──────────────────────────────────────────────────── */

export interface AgentQuestion {
  question: string;
  rationale: string;
  followUp: string | null;
  model: string;
  elapsedMs: number;
}

export function generateQuestion(input: {
  candidateId: string;
  requirementId: string;
  alreadyAsked?: string[];
}): Promise<AgentQuestion> {
  return postJson<AgentQuestion>("/api/agent/question", input);
}

/* ── Recruiter Q&A ────────────────────────────────────────────────────────── */

export type HelpAction =
  | "why"
  | "missing"
  | "explain"
  | "followup"
  | "summary"
  | "progress"
  | "next"
  | "free";

export interface AgentAnswer {
  title: string;
  body: string;
  model: string;
  elapsedMs: number;
}

export function askAgent(input: {
  candidateId: string;
  requirementId?: string;
  intent: HelpAction;
  question?: string;
  liveStatuses?: Record<string, FindingStatus>;
  interviewLog?: string[];
}): Promise<AgentAnswer> {
  return postJson<AgentAnswer>("/api/agent/ask", input);
}

/* ── Runtime helpers (kept out of component render for purity) ─────────────── */

export function newEventId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
