/**
 * Prompts for the HireFlow AI agent (interview-time).
 *
 * These mirror the screening prompts in `api/hireflow/prompts.py` so the agent
 * judges interview evidence by exactly the same policy the resume screening
 * used. Two rules run through all of them:
 *
 *   1. The model proposes evidence; it never adjudicates it. Quotes must be
 *      copied verbatim so a program can check them.
 *   2. The four-state status policy is spelled out, because left to its own
 *      judgement the model collapses "related evidence exists but doesn't prove
 *      it" into "absent" — which loses the distinction the product sells.
 */

export const STATUS_POLICY = `Status must be exactly one of these four values, chosen by these rules:

  "met"        Explicit evidence satisfies the whole requirement.
  "partial"    Explicit evidence satisfies PART of the requirement but not all of it.
  "unverified" Related or adjacent evidence exists, but it does not demonstrate
               the specific thing the requirement asks for.
  "absent"     No relevant evidence of any kind.

If ANY adjacent or partially relevant evidence exists, prefer "unverified" over
"absent". Reserve "absent" for genuine silence on the topic.

RULES THAT OVERRIDE NAIVE KEYWORD MATCHING:
  - Naming a technology is a CLAIM, not evidence. Demonstrated work beats a keyword.
  - "In production" means production. A university or personal project is at most
    "partial", usually "unverified", for a requirement asking for production use.
  - Judge the requirement AS STATED, not the candidate's overall strength.
    Adjacent strength in another stack does not satisfy a requirement they lack.`;

/**
 * Re-evaluate one requirement against a recorded interview answer.
 * This is the call that can promote a requirement to "met".
 */
export function interviewPrompt(input: {
  candidateName: string;
  jobTitle: string;
  requirementId: string;
  requirementText: string;
  requirementKind: string;
  priorStatus: string;
  priorReason: string;
  missingDetail?: string | null;
  question: string;
  answer: string;
}): string {
  return `You are re-evaluating ONE job requirement for a candidate after an interview answer.

CANDIDATE: ${input.candidateName}
ROLE: ${input.jobTitle}

REQUIREMENT ${input.requirementId} (${input.requirementKind}): ${input.requirementText}

STATUS FROM RESUME: ${input.priorStatus}
WHY (from resume screening): ${input.priorReason}
WHAT WAS MISSING: ${input.missingDetail ?? "not specified"}

INTERVIEW QUESTION THAT WAS ASKED:
${input.question}

CANDIDATE'S RECORDED ANSWER:
---
${input.answer}
---

Re-evaluate the requirement using the recorded answer as new evidence.

${STATUS_POLICY}

Rules specific to interview evidence:
- The answer is recorded testimony. Treat CONCRETE, SPECIFIC claims as strong
  evidence: named tools, actions the candidate personally performed, systems they
  operated, incidents they resolved, scale, outcomes. If the answer establishes
  the requirement with that kind of specificity, new_status becomes "met".
- Treat a VAGUE confirmation as insufficient. "Yes, I've used it", "I'm familiar
  with it", "a bit" does NOT establish the requirement. Keep the prior status and
  you MUST return a follow_up asking for the specific missing detail.
- If the answer is off-topic or does not address the requirement, keep the prior
  status and return a follow_up.
- evidence_quote must be copied CHARACTER-FOR-CHARACTER from the CANDIDATE'S
  RECORDED ANSWER above — not from the resume, not paraphrased, at least 4 words.
  A program verifies it against the answer text and will reject a quote it cannot
  locate. If nothing suitable exists, use null.

Return ONLY this JSON:
{"new_status": "met|partial|unverified|absent", "sufficient": true,
 "reason": "one or two sentences for the recruiter explaining the decision",
 "evidence_quote": "verbatim span from the answer, or null",
 "missing_detail": "what is still missing, or null",
 "follow_up": "the next question to ask, or null"}`;
}

/** Generate a targeted validation question for one open requirement. */
export function questionPrompt(input: {
  candidateName: string;
  jobTitle: string;
  requirementId: string;
  requirementText: string;
  priorStatus: string;
  priorReason: string;
  missingDetail?: string | null;
  alreadyAsked: string[];
}): string {
  const asked = input.alreadyAsked.length
    ? input.alreadyAsked.map((q) => `- ${q}`).join("\n")
    : "- (none yet)";

  return `You are writing ONE interview question to close a specific evidence gap.
This is not a generic role question — it exists to resolve a requirement the
resume failed to establish.

CANDIDATE: ${input.candidateName}
ROLE: ${input.jobTitle}

REQUIREMENT ${input.requirementId}: ${input.requirementText}
CURRENT STATUS: ${input.priorStatus}
WHY: ${input.priorReason}
WHAT IS MISSING: ${input.missingDetail ?? "not specified"}

QUESTIONS ALREADY ASKED (do not repeat or closely paraphrase these):
${asked}

Write a question that:
  - references what the resume DID show, where relevant, so the candidate can
    respond concretely rather than feeling tested
  - asks directly about the missing detail
  - is open enough that a strong candidate can demonstrate depth
  - does not lead the candidate toward the answer you want

Also write follow_up: the question to ask if the first answer still leaves the
requirement unproven. Use null only if no sensible follow-up exists.
rationale: one sentence for the recruiter explaining why this question exists.

Return ONLY this JSON:
{"question": "...", "rationale": "...", "follow_up": "..."}`;
}

/**
 * Recruiter Q&A about the active candidate.
 *
 * The recruiter can ask anything; these are the intents the UI offers as
 * shortcuts. The agent gets the full screening + interview state for ONE
 * candidate so its answer is grounded and cannot drift to another candidate.
 */
export const ASK_INTENTS = {
  why: "Explain why the focused requirement currently has the status it has.",
  missing:
    "State precisely what evidence is missing to establish the focused requirement.",
  explain:
    "Explain what the focused requirement is asking for and why it matters for this role.",
  followup:
    "Give the single best next question to ask about the focused requirement.",
  summary:
    "Summarise this candidate against the role: what is evidenced, what is not.",
  progress:
    "Review interview progress: what is now verified, what is still open, and what to do next.",
  next: "Recommend the single most useful next question to ask this candidate, considering everything already asked and answered.",
  free: "Answer the recruiter's question.",
} as const;

export type AskIntent = keyof typeof ASK_INTENTS;

export function askPrompt(input: {
  intent: AskIntent;
  userQuestion?: string;
  candidateName: string;
  candidateHeadline: string;
  candidateYears: number;
  candidateSummary: string;
  jobTitle: string;
  focusRequirement?: {
    id: string;
    text: string;
    kind: string;
    status: string;
    reason: string;
    missingDetail?: string | null;
  };
  requirementLines: string[];
  askedQuestions: string[];
  interviewLog: string[];
}): string {
  const focus = input.focusRequirement
    ? `FOCUSED REQUIREMENT ${input.focusRequirement.id} (${input.focusRequirement.kind}): ${input.focusRequirement.text}
  current status: ${input.focusRequirement.status}
  reason: ${input.focusRequirement.reason}
  missing: ${input.focusRequirement.missingDetail ?? "not specified"}`
    : "FOCUSED REQUIREMENT: none selected";

  const task =
    input.intent === "free" && input.userQuestion
      ? `THE RECRUITER ASKS: "${input.userQuestion}"`
      : `TASK: ${ASK_INTENTS[input.intent]}`;

  return `You are HireFlow AI, an interview assistant helping a recruiter evaluate ONE
candidate. Answer only about the candidate below, using only the state given.

ROLE: ${input.jobTitle}

CANDIDATE: ${input.candidateName} — ${input.candidateHeadline} (${input.candidateYears} years)
SCREENING SUMMARY: ${input.candidateSummary}

REQUIREMENT STATE (id | kind | status | requirement):
${input.requirementLines.map((l) => `  ${l}`).join("\n")}

${focus}

QUESTIONS ALREADY ASKED:
${input.askedQuestions.length ? input.askedQuestions.map((q) => `  - ${q}`).join("\n") : "  - (none yet)"}

INTERVIEW ACTIVITY SO FAR:
${input.interviewLog.length ? input.interviewLog.map((l) => `  - ${l}`).join("\n") : "  - (no answers analysed yet)"}

${task}

Rules:
- Be specific and grounded in the state above. Never invent evidence, employers,
  projects or numbers that are not present.
- Refer to requirements by their id (e.g. REQ-07) where relevant.
- Do not recommend a hiring decision — that belongs to the recruiter.
- Never change a requirement's status here. This is an explanation, not a verdict.
- 1–4 sentences. Plain, direct, no flattery, no bullet lists.

Return ONLY this JSON:
{"title": "a short label, at most 6 words", "body": "your answer"}`;
}
