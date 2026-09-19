import { evaluateAnswer, type AnswerEvaluation } from "./interview-eval";
import type {
  Candidate,
  Finding,
  FindingStatus,
  InterviewQuestion,
  Requirement,
} from "./types";

/**
 * HireFlow AI agent — the single boundary the UI talks to.
 *
 * HireFlow is an agentic product: the AI agent generates interview questions,
 * analyses recorded answers, decides whether evidence is sufficient to verify a
 * requirement, and answers the recruiter's questions about the pool. The
 * operator wires their model behind this module at deploy time (the LangGraph
 * agent in `api/` is the reference); every function here is the contract that
 * model fulfils. This build ships a working implementation of that contract so
 * the workspace runs end-to-end without external calls — swapping in a live LLM
 * means replacing these function bodies, not the UI.
 *
 * The verification decision is intentionally rule-grounded rather than left to
 * free generation: the agent proposes, deterministic checks confirm. That is
 * the same principle as the resume verifier and is what lets the UI say
 * "Verified by HireFlow AI" truthfully.
 */

/** Represents real agent latency so the UI's working state maps to a real call. */
function think(ms = 620): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runtime id/timestamp helpers, kept out of component render for purity. */
export function newEventId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export interface AgentCandidateContext {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
}

/** Analyse a recorded interview answer and decide the verification outcome. */
export async function analyzeInterviewAnswer(input: {
  requirement: Requirement;
  finding: Finding;
  answer: string;
  fallbackFollowUp?: string;
}): Promise<AnswerEvaluation> {
  await think();
  return evaluateAnswer(input.requirement, input.answer, {
    priorStatus: input.finding.status,
    fallbackFollowUp: input.fallbackFollowUp,
  });
}

/** The agent's targeted question for a specific gap. */
export async function suggestQuestion(input: {
  requirement: Requirement;
  finding: Finding;
  priorQuestion?: InterviewQuestion;
}): Promise<{ question: string; rationale: string }> {
  await think(420);
  if (input.priorQuestion) {
    return {
      question: input.priorQuestion.question,
      rationale: input.priorQuestion.rationale,
    };
  }
  const gap = input.finding.missingDetail ?? input.requirement.text;
  return {
    question: `Walk me through your hands-on experience with ${input.requirement.text.toLowerCase()} — a specific system you worked on, what you personally did, and how it ran in production.`,
    rationale: `The resume does not establish this: ${gap}`,
  };
}

export type HelpAction =
  | "explain"
  | "why"
  | "missing"
  | "followup"
  | "summary"
  | "progress";

export interface HelpArgs {
  candidate: Candidate;
  requirement?: Requirement;
  finding?: Finding;
  findings: Finding[];
  requirements: Requirement[];
  questions: InterviewQuestion[];
}

const STATUS_WORD: Record<FindingStatus, string> = {
  met: "evidenced",
  partial: "partially evidenced",
  unverified: "unverified",
  absent: "with no evidence found",
};

/** The agent answers a recruiter's question about the current candidate. */
export async function askAgent(
  action: HelpAction,
  args: HelpArgs,
): Promise<{ title: string; body: string }> {
  await think(380);
  const { candidate, requirement, finding, findings, requirements } = args;
  const first = candidate.name.split(" ")[0];

  switch (action) {
    case "explain": {
      if (!requirement) break;
      const kind =
        requirement.kind === "hard" ? "a must-have" : "a nice-to-have";
      return {
        title: `About ${requirement.id}`,
        body: `${requirement.id} — “${requirement.text}” — is ${kind} for this role. It was parsed from the job description: “${requirement.sourceQuote}”. HireFlow evaluates every candidate against it individually.`,
      };
    }
    case "why": {
      if (!requirement || !finding) break;
      const extra = finding.missingDetail
        ? ` What's missing: ${finding.missingDetail}`
        : "";
      return {
        title: `Why ${requirement.id} is ${STATUS_WORD[finding.status]}`,
        body: `${finding.reason}${extra}`,
      };
    }
    case "missing": {
      if (!requirement || !finding) break;
      return {
        title: `Evidence gap on ${requirement.id}`,
        body:
          finding.missingDetail ??
          `The resume references related work, but nothing that directly establishes “${requirement.text}”. An interview answer with a concrete, first-hand example would close it.`,
      };
    }
    case "followup": {
      if (!requirement) break;
      const q = args.questions.find(
        (x) => x.requirementId === requirement.id,
      );
      return {
        title: `Follow-up for ${requirement.id}`,
        body:
          q?.followUp ??
          `Can you give a specific, recent example of “${requirement.text}” — what you built or operated, the scale, and exactly what you were responsible for?`,
      };
    }
    case "summary": {
      const met = findings.filter((f) => f.status === "met").length;
      const open = findings.filter(
        (f) => f.status === "unverified" || f.status === "absent",
      ).length;
      return {
        title: `Summary — ${candidate.name}`,
        body: `${candidate.aiSummary} Across ${findings.length} requirements, ${met} are evidenced and ${open} still need validation. Every claim is inspectable on the left.`,
      };
    }
    case "progress": {
      const open = findings
        .filter((f) => f.status === "unverified" || f.status === "absent")
        .map((f) => f.requirementId);
      const done = findings.filter((f) => f.status === "met").length;
      return {
        title: "Interview progress",
        body: open.length
          ? `${done}/${requirements.length} requirements are evidenced for ${first}. Still open: ${open.join(", ")}. Work through these in the panel — I'll verify each one when the answer is specific enough.`
          : `Every requirement is evidenced for ${first}. Nothing left to validate — the decision is yours.`,
      };
    }
  }
  return {
    title: "HireFlow AI",
    body: "Select a requirement to focus on, and I'll help with the interview.",
  };
}
