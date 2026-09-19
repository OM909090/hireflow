/**
 * HireFlow core data model.
 *
 * This file is the single contract shared by the Next.js UI and the LangGraph
 * backend. It is deliberately the FIRST thing built (block B0) because
 * capability 13 (audit trail) and capability 4 (missing information) are not
 * features that can be added later — they are properties of this schema.
 *
 * Design rule that everything else follows:
 *   The LLM proposes evidence. Our code validates it.
 *
 * An extracted claim is either backed by a quote we located in the source
 * document, or it is explicitly marked unverified. There is no third state.
 */

/** Requirement hardness. Soft requirements never block, they only inform. */
export type RequirementKind = "hard" | "soft";

/**
 * A single addressable requirement parsed out of the job description.
 *
 * Stable IDs (REQ-01, REQ-02 …) are the keystone of the whole system: findings,
 * interview questions, evaluation reports and the audit trail all reference
 * these and nothing else.
 */
export interface Requirement {
  id: string; // "REQ-03"
  text: string;
  kind: RequirementKind;
  /** Verbatim slice of the JD this requirement was derived from. */
  sourceQuote: string;
}

/**
 * A pointer back to the exact text that supports a claim.
 *
 * `verified` is set by our own verifier, never by the model. If the model
 * returns a quote we cannot locate in the source document, verified is false
 * and the dependent finding degrades to "unverified".
 */
export interface EvidenceSpan {
  quote: string;
  sourceDoc: string; // "priya-sharma.md"
  locationHint: string; // "Experience — Fintech Platform"
  /** Result of the programmatic substring/token check. Model cannot set this. */
  verified: boolean;
}

/**
 * How well a candidate satisfies one requirement.
 *
 * The four states are defined by explicit rule rather than model judgement,
 * because "worked with cloud infrastructure" against "AWS Lambda production
 * experience" is otherwise genuinely ambiguous:
 *
 *  met        — explicit evidence satisfies the requirement
 *  partial    — explicit evidence satisfies part of the requirement
 *  unverified — related evidence exists, required detail not demonstrated
 *  absent     — no relevant evidence found at all
 */
export type FindingStatus = "met" | "partial" | "unverified" | "absent";

export interface Finding {
  id: string; // "F-C01-REQ03"
  candidateId: string;
  requirementId: string;
  status: FindingStatus;
  /** Plain-language justification shown to the recruiter. */
  reason: string;
  /** What specifically is missing. Consumed directly by question generation. */
  missingDetail?: string;
  confidence: number; // 0..1
  evidence: EvidenceSpan[];
  /** Provenance — minimal, not a compliance platform. */
  model: string;
  generatedAt: string; // ISO
}

/** An interview question generated to close a specific evidence gap. */
export interface InterviewQuestion {
  id: string;
  requirementId: string;
  candidateId: string;
  question: string;
  /** Why this question exists — ties back to the finding that produced it. */
  rationale: string;
  /** Asked only if the first answer still leaves the requirement unproven. */
  followUp?: string;
}

/** Recruiter's decision. The AI never sets this. */
export type Decision = "shortlist" | "review" | "reject" | null;

export interface Candidate {
  id: string; // "C-01"
  name: string;
  headline: string;
  location: string;
  yearsExperience: number;
  sourceDoc: string;
  /** Short generated overview. Always accompanied by inspectable findings. */
  aiSummary: string;
  decision: Decision;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  location: string;
  sourceDoc: string;
  rawText: string;
}

/** One line in the agent's reasoning stream. */
export type ActivityKind = "agent" | "verifier" | "tool" | "warn";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  at: string;
}

/** Everything the UI needs for one screening run. Mirrors the graph state. */
export interface ScreeningRun {
  job: JobDescription;
  requirements: Requirement[];
  candidates: Candidate[];
  findings: Finding[];
  questions: InterviewQuestion[];
  activity: ActivityEvent[];
}

/* ── Derived helpers ──────────────────────────────────────────────────────── */

export const STATUS_ORDER: FindingStatus[] = [
  "unverified",
  "absent",
  "partial",
  "met",
];

export interface CoverageSummary {
  met: number;
  partial: number;
  unverified: number;
  absent: number;
  total: number;
  /** Hard requirements with located, verified evidence. The honest headline. */
  hardEvidenced: number;
  hardTotal: number;
}

export function summariseCoverage(
  findings: Finding[],
  requirements: Requirement[],
): CoverageSummary {
  const byId = new Map(requirements.map((r) => [r.id, r]));
  const s: CoverageSummary = {
    met: 0,
    partial: 0,
    unverified: 0,
    absent: 0,
    total: findings.length,
    hardEvidenced: 0,
    hardTotal: requirements.filter((r) => r.kind === "hard").length,
  };
  for (const f of findings) {
    s[f.status] += 1;
    if (byId.get(f.requirementId)?.kind === "hard" && f.status === "met") {
      s.hardEvidenced += 1;
    }
  }
  return s;
}

/**
 * Requirements needing human validation, most urgent first.
 * This ordering is what makes the uncertainty impossible to miss in the UI.
 */
export function needsValidation(findings: Finding[]): Finding[] {
  const rank: Record<FindingStatus, number> = {
    unverified: 0,
    absent: 1,
    partial: 2,
    met: 3,
  };
  return findings
    .filter((f) => f.status === "unverified" || f.status === "absent")
    .sort((a, b) => rank[a.status] - rank[b.status]);
}
