"""
Pydantic models mirroring `web/src/lib/types.ts`.

The TypeScript file is the canonical contract; this is its Python counterpart.
`ScreeningRun.to_ui()` emits exactly the shape the Next.js app consumes, so the
frontend needs no adapter layer.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

RequirementKind = Literal["hard", "soft"]
FindingStatus = Literal["met", "partial", "unverified", "absent"]


class Requirement(BaseModel):
    id: str
    text: str
    kind: RequirementKind
    source_quote: str

    def to_ui(self) -> dict:
        return {
            "id": self.id,
            "text": self.text,
            "kind": self.kind,
            "sourceQuote": self.source_quote,
        }


class EvidenceSpan(BaseModel):
    quote: str
    source_doc: str
    location_hint: str
    #: Set by our verifier, never by the model.
    verified: bool = False
    #: How the match was made — exact, subsequence, coverage, or why it failed.
    method: str = "not_found"
    detail: str = ""

    def to_ui(self) -> dict:
        return {
            "quote": self.quote,
            "sourceDoc": self.source_doc,
            "locationHint": self.location_hint,
            "verified": self.verified,
        }


class Finding(BaseModel):
    id: str
    candidate_id: str
    requirement_id: str
    status: FindingStatus
    reason: str
    missing_detail: str | None = None
    confidence: float = 0.0
    evidence: list[EvidenceSpan] = Field(default_factory=list)
    model: str = ""
    generated_at: str = ""

    def to_ui(self) -> dict:
        return {
            "id": self.id,
            "candidateId": self.candidate_id,
            "requirementId": self.requirement_id,
            "status": self.status,
            "reason": self.reason,
            "missingDetail": self.missing_detail,
            "confidence": self.confidence,
            "evidence": [e.to_ui() for e in self.evidence],
            "model": self.model,
            "generatedAt": self.generated_at,
        }


class InterviewQuestion(BaseModel):
    id: str
    candidate_id: str
    requirement_id: str
    question: str
    rationale: str
    follow_up: str | None = None

    def to_ui(self) -> dict:
        return {
            "id": self.id,
            "candidateId": self.candidate_id,
            "requirementId": self.requirement_id,
            "question": self.question,
            "rationale": self.rationale,
            "followUp": self.follow_up,
        }


class InterviewItem(BaseModel):
    """
    One requirement re-evaluated after the interviewer recorded an answer.

    This closes the evidence chain: a resume gap becomes a question, the question
    gets an answer, and the answer is mapped back to the requirement as new
    evidence. The answer is treated as the source document — the same verifier
    checks that any quoted span actually appears in what the interviewer typed.
    """

    id: str
    candidate_id: str
    requirement_id: str
    question: str
    answer: str
    prior_status: FindingStatus
    new_status: FindingStatus
    reason: str
    missing_detail: str | None = None
    follow_up: str | None = None
    evidence: list[EvidenceSpan] = Field(default_factory=list)
    model: str = ""

    def to_ui(self) -> dict:
        return {
            "id": self.id,
            "candidateId": self.candidate_id,
            "requirementId": self.requirement_id,
            "question": self.question,
            "answer": self.answer,
            "priorStatus": self.prior_status,
            "newStatus": self.new_status,
            "reason": self.reason,
            "missingDetail": self.missing_detail,
            "followUp": self.follow_up,
            "evidence": [e.to_ui() for e in self.evidence],
            "model": self.model,
        }


class Candidate(BaseModel):
    id: str
    name: str
    headline: str = ""
    location: str = ""
    years_experience: int = 0
    source_doc: str
    raw_text: str = ""
    ai_summary: str = ""

    def to_ui(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "headline": self.headline,
            "location": self.location,
            "yearsExperience": self.years_experience,
            "sourceDoc": self.source_doc,
            "aiSummary": self.ai_summary,
            "decision": None,
        }


class JobDescription(BaseModel):
    id: str = "JOB-001"
    title: str
    company: str
    location: str
    source_doc: str
    raw_text: str

    def to_ui(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "sourceDoc": self.source_doc,
            "rawText": self.raw_text,
        }


ActivityKind = Literal["agent", "verifier", "tool", "warn"]


class ActivityEvent(BaseModel):
    id: str
    kind: ActivityKind
    message: str
    at: str

    def to_ui(self) -> dict:
        return {"id": self.id, "kind": self.kind, "message": self.message, "at": self.at}


class ScreeningRun(BaseModel):
    job: JobDescription
    requirements: list[Requirement] = Field(default_factory=list)
    candidates: list[Candidate] = Field(default_factory=list)
    findings: list[Finding] = Field(default_factory=list)
    questions: list[InterviewQuestion] = Field(default_factory=list)
    interviews: list[InterviewItem] = Field(default_factory=list)
    activity: list[ActivityEvent] = Field(default_factory=list)

    def to_ui(self) -> dict:
        return {
            "job": self.job.to_ui(),
            "requirements": [r.to_ui() for r in self.requirements],
            "candidates": [c.to_ui() for c in self.candidates],
            "findings": [f.to_ui() for f in self.findings],
            "questions": [q.to_ui() for q in self.questions],
            "interviews": [i.to_ui() for i in self.interviews],
            "activity": [a.to_ui() for a in self.activity],
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }


# ── Raw model output shapes (what the LLM is asked to return) ────────────────
# Kept separate from the domain models above: these are untrusted, pre-validation
# and pre-verification. Nothing from here reaches the UI without passing through
# the verifier first.


class ProposedRequirement(BaseModel):
    text: str
    kind: RequirementKind = "hard"
    source_quote: str = ""


class ProposedRequirements(BaseModel):
    requirements: list[ProposedRequirement] = Field(default_factory=list)


class ProposedFinding(BaseModel):
    requirement_id: str
    status: FindingStatus = "absent"
    reason: str = ""
    missing_detail: str | None = None
    confidence: float = 0.5
    evidence_quote: str | None = None
    location_hint: str = ""


class ProposedCandidateReview(BaseModel):
    headline: str = ""
    location: str = ""
    years_experience: int = 0
    summary: str = ""
    findings: list[ProposedFinding] = Field(default_factory=list)


class ProposedQuestion(BaseModel):
    requirement_id: str
    question: str
    rationale: str = ""
    follow_up: str | None = None


class ProposedQuestions(BaseModel):
    questions: list[ProposedQuestion] = Field(default_factory=list)


class ProposedInterviewEval(BaseModel):
    new_status: FindingStatus = "unverified"
    reason: str = ""
    evidence_quote: str | None = None
    missing_detail: str | None = None
    follow_up: str | None = None
