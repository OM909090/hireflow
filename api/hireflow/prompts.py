"""
Prompts.

Two design rules run through all of these:

1. The model proposes evidence; it never adjudicates it. Every prompt asks for a
   quote *copied verbatim* from the source, because a copied quote is checkable
   and a paraphrase is not.
2. The four-state status policy is spelled out as rules. Left to its own
   judgement the model collapses "related evidence exists but doesn't prove it"
   into "absent", which loses precisely the distinction the product sells.
"""

STATUS_POLICY = """\
Status must be exactly one of these four values, chosen by these rules:

  "met"        Explicit text in the resume satisfies the whole requirement.
  "partial"    Explicit text satisfies PART of the requirement but not all of it.
  "unverified" Related or adjacent evidence exists, but it does not demonstrate
               the specific thing the requirement asks for. Use this when the
               resume gets close without proving it. Example: the requirement is
               production Kubernetes and the resume only shows Docker — Docker is
               related, so this is "unverified", NOT "absent".
  "absent"     No relevant evidence of any kind appears in the resume.

The distinction between "unverified" and "absent" matters and is often wrong.
If ANY adjacent or partially relevant text exists, prefer "unverified".
Reserve "absent" for genuine silence on the topic.

THREE RULES THAT OVERRIDE NAIVE KEYWORD MATCHING:

1. A SKILLS LIST IS A CLAIM, NOT EVIDENCE.
   If a technology appears only in a "Skills" or "Technologies" list and is NOT
   demonstrated anywhere in the Experience or Projects sections, the status is
   "unverified", never "met". Say so in the reason, e.g. "Kubernetes appears in
   the skills list but no experience or project demonstrates it." Real work
   beats a keyword every time.

2. "IN PRODUCTION" MEANS PRODUCTION.
   When a requirement asks for production experience, evidence from a university
   project, a personal project, a course, or local-only usage is at most
   "partial", and usually "unverified". A capstone project that "uses Spring
   Boot" does not satisfy "production experience with Spring Boot".

3. JUDGE THE REQUIREMENT AS STATED, NOT OVERALL STRENGTH.
   A candidate who is excellent in a different stack does not satisfy a
   requirement they lack. Years in one language do NOT count toward a
   requirement for a different language. If the role requires Java and the
   candidate has one year of Java on a legacy service but seven years of Python,
   the Java requirement is "partial" (thin, real) or "absent" — not "met" —
   regardless of how strong they are overall. Do not reward adjacent strength."""

EVIDENCE_RULE = """\
evidence_quote must be a span of text COPIED CHARACTER-FOR-CHARACTER from the
RESUME above. Do not paraphrase, summarise, reflow or correct it. Do not invent
a quote. It must be at least 4 words long.
If no suitable span exists, set evidence_quote to null.
Prefer a quote from the Experience or Projects sections over one from a Skills
list. If the only mention of the skill is in a Skills list, you may quote that
list, but the status must then be "unverified" per rule 1 above, and
location_hint must say "Skills list".
A separate program will check your quote against the source document and will
reject your finding if the quote cannot be located, so copying exactly is in
your interest."""


REQUIREMENTS_PROMPT = """\
You are decomposing a job description into individually addressable requirements.

JOB DESCRIPTION:
---
{jd_text}
---

Extract requirements ONLY from the explicit requirement lists — sections titled
Requirements, Must have, Preferred, Nice to have, Qualifications, or similar
bulleted lists. IGNORE the mission statement, company/team description, and the
narrative "you will…" responsibilities in the intro paragraph. A sentence like
"You will design APIs and operate what you ship" is describing the job, not a
screenable requirement, so do not extract it.

Take one requirement per bullet, keeping the job's own grouping — if a single
bullet says "schema design and query optimisation", that is ONE requirement.
Do not atomise and do not invent requirements the lists do not contain.

For each requirement return:
  text         A single clear requirement, phrased as a capability.
  kind         "hard" if required, "soft" if listed as nice to have / preferred.
  source_quote A span copied verbatim from the JOB DESCRIPTION that this
               requirement came from.

Return ONLY this JSON:
{{"requirements": [{{"text": "...", "kind": "hard", "source_quote": "..."}}]}}"""


REVIEW_PROMPT = """\
You are screening one candidate against a fixed list of job requirements.

RESUME ({source_doc}):
---
{resume_text}
---

REQUIREMENTS:
{requirements_block}

For EVERY requirement id listed above, produce one finding. Do not skip any.

{status_policy}

{evidence_rule}

Also return, about the candidate overall:
  headline          Their current role and domain, e.g. "Senior Backend Engineer · Fintech"
  location          As stated in the resume
  years_experience  Integer. Total years of professional experience evidenced.
  summary           2-3 sentences for a recruiter. State plainly what is evidenced
                    and what is not. Do not flatter. Do not recommend a decision.

For each finding return:
  requirement_id   Exactly as given above (e.g. "REQ-03")
  status           Per the policy above
  reason           One or two sentences explaining the verdict, referring to what
                   the resume does and does not show.
  missing_detail   If status is not "met": precisely what is missing. Otherwise null.
  confidence       0.0 to 1.0
  evidence_quote   Verbatim span from the RESUME, or null
  location_hint    Where in the resume it came from, e.g. "Experience — Kaleidofin"

Return ONLY this JSON:
{{"headline": "...", "location": "...", "years_experience": 0, "summary": "...",
  "findings": [{{"requirement_id": "REQ-01", "status": "met", "reason": "...",
  "missing_detail": null, "confidence": 0.9, "evidence_quote": "...",
  "location_hint": "..."}}]}}"""


INTERVIEW_PROMPT = """\
You are re-evaluating ONE requirement for a candidate after an interview.

REQUIREMENT: {requirement_text}

STATUS FROM RESUME: {prior_status}
WHY (from resume): {prior_reason}

INTERVIEW QUESTION THAT WAS ASKED:
{question}

CANDIDATE'S RECORDED ANSWER:
---
{answer}
---

Re-evaluate the requirement using the recorded answer as new evidence.

{status_policy}

Rules specific to interview evidence:
- The answer is recorded testimony from the interview. Treat CONCRETE, SPECIFIC
  claims as strong evidence: named tools, actions the candidate personally
  performed, systems they operated, incidents they resolved, outcomes. If the
  answer establishes the requirement with that kind of specificity, status
  becomes "met".
- Treat a VAGUE confirmation as insufficient. "Yes, I've used it" or "I'm
  familiar with it" does not establish the requirement — that stays "unverified"
  and you MUST provide a follow_up question that asks for the specific missing
  detail.
- evidence_quote must be copied CHARACTER-FOR-CHARACTER from the CANDIDATE'S
  RECORDED ANSWER above (not from the resume). A program verifies it.

Return ONLY this JSON:
{{"new_status": "met", "reason": "...", "evidence_quote": "...",
  "missing_detail": null, "follow_up": null}}"""


QUESTIONS_PROMPT = """\
You are writing interview questions to close specific evidence gaps for one
candidate. These are not generic role questions — each one exists to resolve a
requirement the resume failed to establish.

CANDIDATE: {name}

OPEN REQUIREMENTS:
{gaps_block}

For each open requirement write a question that:
  - references the specific thing the resume DID show, where relevant, so the
    candidate can respond concretely rather than being tested
  - asks directly about the missing detail
  - is open enough that a strong candidate can demonstrate depth
  - does not lead the candidate toward the answer you want

Also write follow_up: the question to ask if the first answer still leaves the
requirement unproven. Set it to null only if no sensible follow-up exists.

rationale: one sentence, for the recruiter, explaining why this question exists.

Return ONLY this JSON:
{{"questions": [{{"requirement_id": "REQ-03", "question": "...",
  "rationale": "...", "follow_up": "..."}}]}}"""
