import type {
  Candidate,
  CoverageSummary,
  Finding,
  FindingStatus,
  Requirement,
} from "./types";
import { summariseCoverage } from "./types";

/**
 * Natural-language query over the candidate pool (capability 12).
 *
 * This is intentionally NOT a call to an LLM. It runs instantly in the browser
 * over the already-verified findings, and every answer is grounded in the same
 * evidence the rest of the product shows — a query can never surface a claim the
 * verifier did not stand up. Keeping it deterministic also means the demo's
 * query box responds in a frame rather than in the ~30 s the proxy would take.
 *
 * It resolves two things from the text: an intent (which finding statuses the
 * user is asking about) and a topic (which requirements they mean), then returns
 * grounded rows or a ranking.
 */

export type AskKind = "findings" | "ranking" | "empty";

export interface AskRow {
  candidate: Candidate;
  requirement: Requirement;
  finding: Finding;
}

export interface RankRow {
  candidate: Candidate;
  summary: CoverageSummary;
}

export interface AskResult {
  kind: AskKind;
  /** One-line, human answer shown above the results. */
  summary: string;
  statuses: FindingStatus[];
  matchedRequirements: Requirement[];
  rows: AskRow[];
  ranking: RankRow[];
}

const STOP = new Set([
  "a","an","the","of","in","on","for","to","with","and","or","is","are","do",
  "does","who","which","what","show","me","find","list","all","any","have","has",
  "having","that","this","candidates","candidate","people","person","requirement",
  "requirements","their","them","by","evidence","experience","exp",
]);

/** Common aliases so "k8s" finds "Kubernetes", etc. Domain-agnostic extras. */
const ALIASES: Record<string, string[]> = {
  k8s: ["kubernetes"],
  kube: ["kubernetes"],
  pg: ["postgresql", "postgres"],
  postgres: ["postgresql"],
  js: ["javascript"],
  ml: ["machine", "learning"],
  db: ["database"],
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

function expand(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) for (const a of ALIASES[t] ?? []) out.add(a);
  return [...out];
}

// ── intent ────────────────────────────────────────────────────────────────

const GAP_WORDS = [
  "unverified","missing","without","lacks","lacking","lack","no","gap","gaps",
  "unproven","weak","cannot","cant","unclear","validate","validation","risk",
];
const MET_WORDS = ["met","meets","strong","proven","evidenced","confirmed","verified","solid"];
const PARTIAL_WORDS = ["partial","partially","some","somewhat"];
const RANK_WORDS = ["strongest","best","top","rank","ranking","shortlist","leading","fit"];

function detectStatuses(tokens: string[]): FindingStatus[] {
  const has = (list: string[]) => tokens.some((t) => list.includes(t));
  if (has(PARTIAL_WORDS)) return ["partial"];
  if (has(GAP_WORDS)) return ["unverified", "absent"];
  if (has(MET_WORDS)) return ["met"];
  return ["met", "partial", "unverified", "absent"];
}

// ── topic ─────────────────────────────────────────────────────────────────

/** Score how strongly a requirement matches the query's topic tokens. */
function requirementScore(req: Requirement, qTokens: string[]): number {
  const reqTokens = new Set(tokenize(req.text + " " + req.sourceQuote));
  let score = 0;
  for (const t of qTokens) {
    if (reqTokens.has(t)) score += 2;
    // Fuzzy fallback, but only for tokens long enough that a substring match is
    // meaningful — otherwise short words like "at" spuriously match "matches".
    else if (
      [...reqTokens].some(
        (r) =>
          (t.length >= 4 && r.includes(t)) || (r.length >= 4 && t.includes(r)),
      )
    )
      score += 1;
  }
  return score;
}

const STATUS_RANK: Record<FindingStatus, number> = {
  unverified: 0,
  absent: 1,
  partial: 2,
  met: 3,
};

function statusPhrase(statuses: FindingStatus[]): string {
  if (statuses.length === 4) return "any status";
  if (statuses.length === 2) return "not yet verified";
  return { met: "evidenced", partial: "partially met", unverified: "unverified", absent: "with no evidence" }[
    statuses[0]
  ];
}

export function runQuery(
  query: string,
  data: {
    candidates: Candidate[];
    requirements: Requirement[];
    findings: Finding[];
  },
): AskResult {
  const raw = tokenize(query);
  const qTokens = expand(raw);
  const statuses = detectStatuses(raw);

  const candidateById = new Map(data.candidates.map((c) => [c.id, c]));
  const reqById = new Map(data.requirements.map((r) => [r.id, r]));

  // Ranking intent — "strongest candidates", "who should we shortlist"
  if (raw.some((t) => RANK_WORDS.includes(t))) {
    const ranking: RankRow[] = data.candidates
      .map((c) => ({
        candidate: c,
        summary: summariseCoverage(
          data.findings.filter((f) => f.candidateId === c.id),
          data.requirements,
        ),
      }))
      .sort((a, b) => b.summary.hardEvidenced - a.summary.hardEvidenced);

    const top = ranking[0];
    return {
      kind: "ranking",
      summary: `Ranked ${ranking.length} candidates by must-have requirements with located evidence. ${top.candidate.name} leads with ${top.summary.hardEvidenced}/${top.summary.hardTotal}.`,
      statuses,
      matchedRequirements: [],
      rows: [],
      ranking,
    };
  }

  // Topic — which requirements does the query mention?
  const scored = data.requirements
    .map((r) => ({ r, s: requirementScore(r, qTokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const matchedRequirements = scored.map((x) => x.r);
  const reqFilter = matchedRequirements.length
    ? new Set(matchedRequirements.map((r) => r.id))
    : null; // null = all requirements

  const rows: AskRow[] = data.findings
    .filter((f) => statuses.includes(f.status))
    .filter((f) => (reqFilter ? reqFilter.has(f.requirementId) : true))
    .map((f) => ({
      candidate: candidateById.get(f.candidateId)!,
      requirement: reqById.get(f.requirementId)!,
      finding: f,
    }))
    .filter((r) => r.candidate && r.requirement)
    .sort(
      (a, b) =>
        STATUS_RANK[a.finding.status] - STATUS_RANK[b.finding.status] ||
        a.candidate.name.localeCompare(b.candidate.name),
    );

  const topicPhrase = matchedRequirements.length
    ? `“${matchedRequirements[0].text}”`
    : "all requirements";

  if (!rows.length) {
    return {
      kind: "empty",
      summary: `No candidates match ${statusPhrase(statuses)} for ${topicPhrase}.`,
      statuses,
      matchedRequirements,
      rows: [],
      ranking: [],
    };
  }

  const people = new Set(rows.map((r) => r.candidate.id)).size;
  return {
    kind: "findings",
    summary: `${rows.length} finding${rows.length === 1 ? "" : "s"} across ${people} candidate${people === 1 ? "" : "s"} — ${statusPhrase(statuses)}${matchedRequirements.length ? ` for ${topicPhrase}` : ""}.`,
    statuses,
    matchedRequirements,
    rows,
    ranking: [],
  };
}

/** Suggested queries shown as chips — each is designed to return something real. */
export const EXAMPLE_QUERIES = [
  "Who lacks Kubernetes evidence?",
  "Which requirements are unverified?",
  "Who has Spring Boot experience?",
  "Strongest candidates",
  "Who is missing Kafka experience?",
  "Show partial evidence",
];


/* ── Candidate-pool query (capability 12, over structured candidate state) ──── */

/** Human-readable skill label for a requirement, for interpretation chips. */
const SKILL_LABELS = [
  "Java",
  "Spring Boot",
  "REST",
  "PostgreSQL",
  "Docker",
  "Kubernetes",
  "AWS",
  "Kafka",
  "CI/CD",
];

function reqShortLabel(req: Requirement): string {
  const text = req.text.toLowerCase();
  for (const label of SKILL_LABELS) {
    if (text.includes(label.toLowerCase())) return label;
  }
  if (text.includes("year")) return "Experience";
  return req.id;
}

type ReqState = "verified" | "gap" | "partial" | "present";

function stateLabel(s: ReqState): string {
  return {
    verified: "Verified",
    gap: "Unverified / missing",
    partial: "Partial",
    present: "Present",
  }[s];
}

function segmentState(segment: string): ReqState {
  const toks = segment.toLowerCase();
  if (GAP_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(toks))) return "gap";
  if (/\bverified\b/.test(toks)) return "verified";
  if (/\bpartial(ly)?\b/.test(toks)) return "partial";
  return "present";
}

function statusSatisfies(status: FindingStatus, want: ReqState): boolean {
  switch (want) {
    case "verified":
      return status === "met";
    case "gap":
      return status === "unverified" || status === "absent";
    case "partial":
      return status === "partial";
    case "present":
      return status === "met" || status === "partial";
  }
}

export interface CandidateQueryChip {
  label: string;
  value: string;
}

export interface CandidateQueryResult {
  chips: CandidateQueryChip[];
  /** null = no constraints parsed (caller shows everything). */
  matchIds: string[] | null;
  empty: boolean;
  /** False when the query could not be interpreted at all. */
  understood: boolean;
}

/**
 * Turn a plain-language pool query into a structured filter over candidate
 * state. Reads the findings it is given — pass MERGED findings so that
 * "verified Kubernetes" reflects interview verifications, not just the resume.
 */
export function queryCandidates(
  query: string,
  data: {
    candidates: Candidate[];
    requirements: Requirement[];
    findings: Finding[];
  },
): CandidateQueryResult {
  const q = query.trim().toLowerCase();
  if (!q) return { chips: [], matchIds: null, empty: false, understood: true };

  const statusMap = new Map(
    data.findings.map((f) => [`${f.candidateId}:${f.requirementId}`, f.status]),
  );

  const chips: CandidateQueryChip[] = [];

  // Experience
  let experienceMin: number | null = null;
  const expMatch = q.match(
    /(?:more than|over|at least|greater than|above)\s*(\d{1,2})|\b(\d{1,2})\s*\+?\s*years?/,
  );
  if (expMatch) {
    const n = Number(expMatch[1] ?? expMatch[2]);
    experienceMin = /more than|over|above|greater than/.test(q) ? n + 1 : n;
    chips.push({ label: "Experience", value: `${experienceMin}+ years` });
  }

  // Name
  let nameId: string | null = null;
  for (const c of data.candidates) {
    const first = c.name.split(" ")[0].toLowerCase();
    if (q.includes(c.name.toLowerCase()) || new RegExp(`\\b${first}\\b`).test(q)) {
      nameId = c.id;
      chips.push({ label: "Name", value: c.name });
      break;
    }
  }

  // All must-haves verified
  const allVerified =
    /\ball\b/.test(q) &&
    /(verified|must-have|mandatory|requirement)/.test(q);
  if (allVerified) {
    chips.push({ label: "Coverage", value: "all must-haves verified" });
  }

  // Requirement-state conditions, per clause
  const segments = q.split(/,|\bwith\b|\bbut\b|\bhaving\b|\band\b/);
  const conditions = new Map<string, ReqState>();
  for (const seg of segments) {
    const toks = tokenize(seg);
    if (!toks.length) continue;
    const state = segmentState(seg);
    for (const r of data.requirements) {
      if (requirementScore(r, toks) >= 2) conditions.set(r.id, state);
    }
  }
  for (const [rid, state] of conditions) {
    const r = data.requirements.find((x) => x.id === rid);
    if (r) chips.push({ label: reqShortLabel(r), value: stateLabel(state) });
  }

  const hasConstraint =
    experienceMin != null ||
    nameId != null ||
    allVerified ||
    conditions.size > 0;

  const hardIds = new Set(
    data.requirements.filter((r) => r.kind === "hard").map((r) => r.id),
  );

  const matches = data.candidates.filter((c) => {
    if (nameId && c.id !== nameId) return false;
    if (experienceMin != null && c.yearsExperience < experienceMin) return false;
    if (allVerified) {
      const allHardMet = [...hardIds].every(
        (rid) => statusMap.get(`${c.id}:${rid}`) === "met",
      );
      if (!allHardMet) return false;
    }
    for (const [rid, state] of conditions) {
      const st = statusMap.get(`${c.id}:${rid}`) ?? "absent";
      if (!statusSatisfies(st, state)) return false;
    }
    return true;
  });

  // Fallback: free-text search on name/headline when nothing structured parsed.
  if (!hasConstraint) {
    const textMatches = data.candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.id.toLowerCase() === q,
    );
    if (textMatches.length) {
      return {
        chips: [{ label: "Search", value: query.trim() }],
        matchIds: textMatches.map((c) => c.id),
        empty: false,
        understood: true,
      };
    }
    // Nothing parsed and nothing matched: say so rather than silently returning
    // the whole pool as if it were a result set.
    return { chips: [], matchIds: [], empty: true, understood: false };
  }

  return {
    chips,
    matchIds: matches.map((c) => c.id),
    empty: matches.length === 0,
    understood: true,
  };
}
