"""
The HireFlow LangGraph pipeline.

    ingest → parse_requirements → review_candidates → verify_evidence
                                                          │
                                              evidence_sufficient?
                                                     │        │
                                              (gaps) │        │ (none)
                                                     ▼        ▼
                                            generate_questions → finalise

Deliberately flat. The one conditional edge — `evidence_sufficient?` — is the
agentic decision that matters: it routes on whether our own verifier could stand
up the model's claims, not on anything the model asserted about itself.

`verify_evidence` contains no LLM call. That is the point of the architecture:
the model proposes, code adjudicates, and a claim that cannot be located in the
source degrades to `unverified` rather than being accepted.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Any, TypedDict

from langgraph.graph import END, StateGraph

from .config import FIXTURES, Settings
from .llm import LLMClient, LLMError
from .prompts import (
    EVIDENCE_RULE,
    QUESTIONS_PROMPT,
    REQUIREMENTS_PROMPT,
    REVIEW_PROMPT,
    STATUS_POLICY,
)
from .schema import (
    ActivityEvent,
    Candidate,
    EvidenceSpan,
    Finding,
    InterviewQuestion,
    JobDescription,
    ProposedCandidateReview,
    ProposedQuestions,
    ProposedRequirements,
    Requirement,
    ScreeningRun,
)
from .verify import verify_quote

log = logging.getLogger("hireflow.graph")


def _merge(a: list, b: list) -> list:
    return a + b


class GraphState(TypedDict, total=False):
    job: JobDescription
    candidates: list[Candidate]
    requirements: list[Requirement]
    findings: list[Finding]
    questions: list[InterviewQuestion]
    activity: Annotated[list[ActivityEvent], _merge]
    client: Any
    settings: Any
    errors: Annotated[list[str], _merge]


_seq = 0


def ev(kind: str, message: str) -> ActivityEvent:
    global _seq
    _seq += 1
    return ActivityEvent(
        id=f"a{_seq:03d}",
        kind=kind,  # type: ignore[arg-type]
        message=message,
        at=datetime.now(timezone.utc).strftime("%H:%M:%S"),
    )


# ── 1. ingest ─────────────────────────────────────────────────────────────────


def load_documents(
    jd_path: Path, resume_paths: list[Path]
) -> tuple[JobDescription, list[Candidate]]:
    jd_text = jd_path.read_text(encoding="utf-8")

    title, company, location = "Open role", "", ""
    for line in jd_text.splitlines():
        s = line.strip()
        if s.startswith("# ") and title == "Open role":
            title = s[2:].strip()
        elif s.startswith("**") and not company:
            bits = s.replace("**", "").split("—")
            company = bits[0].strip()
            if len(bits) > 1:
                location = bits[1].strip()

    job = JobDescription(
        title=title,
        company=company or "Unknown",
        location=location,
        source_doc=jd_path.name,
        raw_text=jd_text,
    )

    candidates: list[Candidate] = []
    for i, p in enumerate(sorted(resume_paths), start=1):
        text = p.read_text(encoding="utf-8")
        name = p.stem.replace("-", " ").title()
        for line in text.splitlines():
            if line.strip().startswith("# "):
                name = line.strip()[2:].strip()
                break
        candidates.append(
            Candidate(
                id=f"C-{i:02d}",
                name=name,
                source_doc=p.name,
                raw_text=text,
            )
        )
    return job, candidates


async def ingest(state: GraphState) -> dict:
    job = state["job"]
    cands = state["candidates"]
    return {
        "activity": [
            ev("agent", f"Run started · {job.id} · {job.title}"),
            ev("tool", f"Loaded {job.source_doc} ({len(job.raw_text):,} chars)"),
            ev("tool", f"Loaded {len(cands)} candidate documents"),
        ]
    }


# ── 2. parse requirements ─────────────────────────────────────────────────────


async def parse_requirements(state: GraphState) -> dict:
    client: LLMClient = state["client"]
    job = state["job"]

    proposed = await client.complete_model(
        REQUIREMENTS_PROMPT.format(jd_text=job.raw_text),
        ProposedRequirements,
        max_tokens=3000,
        label="requirements",
    )

    reqs: list[Requirement] = []
    acts: list[ActivityEvent] = []
    for i, p in enumerate(proposed.requirements, start=1):
        rid = f"REQ-{i:02d}"
        # A requirement's own source quote is verified too — if the model
        # invented a requirement the JD never stated, we want to know.
        res = verify_quote(p.source_quote, job.raw_text)
        if not res.verified:
            acts.append(
                ev("warn", f"{rid} · source quote not found in job description")
            )
        reqs.append(
            Requirement(
                id=rid,
                text=p.text,
                kind=p.kind,
                source_quote=p.source_quote,
            )
        )

    hard = sum(1 for r in reqs if r.kind == "hard")
    return {
        "requirements": reqs,
        "activity": [
            ev(
                "agent",
                f"Parsed job description → {len(reqs)} requirements "
                f"({hard} hard, {len(reqs) - hard} soft)",
            ),
            *acts,
        ],
    }


# ── 3. review candidates (concurrent) ─────────────────────────────────────────


def _requirements_block(reqs: list[Requirement]) -> str:
    return "\n".join(
        f"{r.id} [{'must have' if r.kind == 'hard' else 'nice to have'}]: {r.text}"
        for r in reqs
    )


async def review_candidates(state: GraphState) -> dict:
    client: LLMClient = state["client"]
    reqs = state["requirements"]
    block = _requirements_block(reqs)
    valid_ids = {r.id for r in reqs}

    async def one(c: Candidate) -> tuple[Candidate, ProposedCandidateReview | None, str]:
        prompt = REVIEW_PROMPT.format(
            source_doc=c.source_doc,
            resume_text=c.raw_text,
            requirements_block=block,
            status_policy=STATUS_POLICY,
            evidence_rule=EVIDENCE_RULE,
        )
        try:
            r = await client.complete_model(
                prompt,
                ProposedCandidateReview,
                max_tokens=6000,
                label=f"review {c.id}",
            )
            return c, r, ""
        except LLMError as exc:
            log.error("review failed for %s: %s", c.id, exc)
            return c, None, str(exc)

    results = await asyncio.gather(*(one(c) for c in state["candidates"]))

    candidates: list[Candidate] = []
    findings: list[Finding] = []
    acts: list[ActivityEvent] = []
    errors: list[str] = []
    now = datetime.now(timezone.utc).isoformat()
    model = state["settings"].model

    for c, review, err in results:
        if review is None:
            errors.append(f"{c.id}: {err}")
            acts.append(ev("warn", f"{c.id} {c.name} · review failed, skipped"))
            candidates.append(c)
            continue

        c = c.model_copy(
            update={
                "headline": review.headline or c.headline,
                "location": review.location or c.location,
                "years_experience": review.years_experience,
                "ai_summary": review.summary,
            }
        )
        candidates.append(c)

        seen: set[str] = set()
        for p in review.findings:
            if p.requirement_id not in valid_ids or p.requirement_id in seen:
                continue  # drop hallucinated or duplicated requirement ids
            seen.add(p.requirement_id)

            evidence: list[EvidenceSpan] = []
            if p.evidence_quote:
                evidence.append(
                    EvidenceSpan(
                        quote=p.evidence_quote,
                        source_doc=c.source_doc,
                        location_hint=p.location_hint or "Resume",
                        verified=False,  # verify_evidence decides this
                    )
                )

            findings.append(
                Finding(
                    id=f"F-{c.id.replace('-', '')}-{p.requirement_id.replace('-', '')}",
                    candidate_id=c.id,
                    requirement_id=p.requirement_id,
                    status=p.status,
                    reason=p.reason,
                    missing_detail=p.missing_detail,
                    confidence=max(0.0, min(1.0, p.confidence)),
                    evidence=evidence,
                    model=model,
                    generated_at=now,
                )
            )

        missing = valid_ids - seen
        for rid in sorted(missing):
            findings.append(
                Finding(
                    id=f"F-{c.id.replace('-', '')}-{rid.replace('-', '')}",
                    candidate_id=c.id,
                    requirement_id=rid,
                    status="absent",
                    reason="The model returned no finding for this requirement, so it is recorded as unevidenced rather than assumed.",
                    missing_detail="A judgement on this requirement",
                    confidence=0.0,
                    evidence=[],
                    model=model,
                    generated_at=now,
                )
            )
        if missing:
            acts.append(
                ev("warn", f"{c.id} · {len(missing)} requirement(s) not addressed")
            )

        acts.append(
            ev("agent", f"{c.id} {c.name} · proposed evidence for {len(seen)} requirements")
        )

    return {
        "candidates": candidates,
        "findings": findings,
        "activity": acts,
        "errors": errors,
    }


# ── 4. verify evidence — PURE CODE, no LLM ────────────────────────────────────


async def verify_evidence(state: GraphState) -> dict:
    """
    Adjudicate every proposed quote against its source document.

    This is where the product's central claim is enforced. A `met` or `partial`
    finding whose quote cannot be located does not stay `met` — it degrades to
    `unverified`, because we have no evidence for it, only an assertion.
    """
    docs = {c.source_doc: c.raw_text for c in state["candidates"]}
    out: list[Finding] = []
    acts: list[ActivityEvent] = []

    for f in state["findings"]:
        doc = docs.get(f.evidence[0].source_doc if f.evidence else "", "")
        checked: list[EvidenceSpan] = []
        any_verified = False

        for span in f.evidence:
            res = verify_quote(span.quote, docs.get(span.source_doc, doc))
            checked.append(
                span.model_copy(
                    update={
                        "verified": res.verified,
                        "method": res.method.value,
                        "detail": res.detail,
                    }
                )
            )
            any_verified = any_verified or res.verified

            short = span.quote[:52] + ("…" if len(span.quote) > 52 else "")
            if res.verified:
                acts.append(
                    ev(
                        "verifier",
                        f"{f.candidate_id} {f.requirement_id} · quote located in "
                        f"{span.source_doc} ({res.method.value}) → verified",
                    )
                )
            else:
                acts.append(
                    ev(
                        "warn",
                        f"{f.candidate_id} {f.requirement_id} · quote NOT located "
                        f'in {span.source_doc} — "{short}" → claim refused',
                    )
                )

        status = f.status
        reason = f.reason
        missing = f.missing_detail

        if status in ("met", "partial") and not any_verified:
            # The model asserted this but could not evidence it.
            status = "unverified"
            if f.evidence:
                reason = (
                    f"{f.reason} The supporting quote could not be located in "
                    f"{f.evidence[0].source_doc}, so this requirement is not treated as satisfied."
                )
                missing = missing or "Verifiable evidence for this requirement"
            else:
                reason = (
                    f"{f.reason} No supporting quote was supplied, so this "
                    "requirement is not treated as satisfied."
                )
                missing = missing or "A citation from the resume"
            acts.append(
                ev(
                    "agent",
                    f"{f.candidate_id} {f.requirement_id} · downgraded "
                    f"{f.status} → unverified (unevidenced)",
                )
            )

        out.append(
            f.model_copy(
                update={
                    "evidence": checked,
                    "status": status,
                    "reason": reason,
                    "missing_detail": missing,
                }
            )
        )

    refused = sum(1 for a in acts if a.kind == "warn")
    verified = sum(1 for a in acts if a.kind == "verifier")
    acts.append(
        ev(
            "agent",
            f"Verification complete · {verified} quotes located, {refused} claims refused",
        )
    )
    return {"findings": out, "activity": acts}


# ── conditional edge ──────────────────────────────────────────────────────────


def evidence_sufficient(state: GraphState) -> str:
    """
    The one real branch in the graph.

    Routes on our verifier's conclusions, not the model's self-report. If any
    requirement is left unproven, the run must produce questions to close it.
    """
    gaps = [
        f for f in state["findings"] if f.status in ("unverified", "absent")
    ]
    return "generate_questions" if gaps else "finalise"


# ── 5. generate questions ─────────────────────────────────────────────────────


async def generate_questions(state: GraphState) -> dict:
    client: LLMClient = state["client"]
    reqs = {r.id: r for r in state["requirements"]}
    by_cand: dict[str, list[Finding]] = {}

    for f in state["findings"]:
        if f.status in ("unverified", "absent"):
            by_cand.setdefault(f.candidate_id, []).append(f)

    cands = {c.id: c for c in state["candidates"]}

    async def one(cid: str, gaps: list[Finding]):
        c = cands[cid]
        block = "\n".join(
            f"- {g.requirement_id}: {reqs[g.requirement_id].text}\n"
            f"  status: {g.status}\n"
            f"  what the resume showed: {g.reason}\n"
            f"  missing: {g.missing_detail or 'unclear'}"
            for g in gaps
            if g.requirement_id in reqs
        )
        try:
            r = await client.complete_model(
                QUESTIONS_PROMPT.format(name=c.name, gaps_block=block),
                ProposedQuestions,
                max_tokens=3000,
                label=f"questions {cid}",
            )
            return cid, r, ""
        except LLMError as exc:
            log.error("questions failed for %s: %s", cid, exc)
            return cid, None, str(exc)

    results = await asyncio.gather(*(one(k, v) for k, v in by_cand.items()))

    questions: list[InterviewQuestion] = []
    acts: list[ActivityEvent] = []
    errors: list[str] = []

    for cid, r, err in results:
        if r is None:
            errors.append(f"questions {cid}: {err}")
            acts.append(ev("warn", f"{cid} · question generation failed"))
            continue
        for q in r.questions:
            if q.requirement_id not in reqs:
                continue
            questions.append(
                InterviewQuestion(
                    id=f"Q-{cid.replace('-', '')}-{q.requirement_id.replace('-', '')}",
                    candidate_id=cid,
                    requirement_id=q.requirement_id,
                    question=q.question,
                    rationale=q.rationale,
                    follow_up=q.follow_up,
                )
            )
        acts.append(
            ev("agent", f"{cid} · wrote {len(r.questions)} validation question(s)")
        )

    return {"questions": questions, "activity": acts, "errors": errors}


# ── 6. finalise ───────────────────────────────────────────────────────────────


async def finalise(state: GraphState) -> dict:
    open_count = sum(
        1 for f in state["findings"] if f.status in ("unverified", "absent")
    )
    return {
        "activity": [
            ev(
                "agent",
                f"Run complete · {len(state['findings'])} findings · "
                f"{open_count} require human validation",
            )
        ]
    }


# ── assembly ──────────────────────────────────────────────────────────────────


def build_graph():
    g = StateGraph(GraphState)
    g.add_node("ingest", ingest)
    g.add_node("parse_requirements", parse_requirements)
    g.add_node("review_candidates", review_candidates)
    g.add_node("verify_evidence", verify_evidence)
    g.add_node("generate_questions", generate_questions)
    g.add_node("finalise", finalise)

    g.set_entry_point("ingest")
    g.add_edge("ingest", "parse_requirements")
    g.add_edge("parse_requirements", "review_candidates")
    g.add_edge("review_candidates", "verify_evidence")
    g.add_conditional_edges(
        "verify_evidence",
        evidence_sufficient,
        {"generate_questions": "generate_questions", "finalise": "finalise"},
    )
    g.add_edge("generate_questions", "finalise")
    g.add_edge("finalise", END)
    return g.compile()


async def run_screening(
    settings: Settings,
    jd_path: Path | None = None,
    resume_paths: list[Path] | None = None,
) -> ScreeningRun:
    global _seq
    _seq = 0

    jd_path = jd_path or (FIXTURES / "northwind-senior-backend-engineer.md")
    if resume_paths is None:
        resume_paths = [
            p for p in sorted(FIXTURES.glob("*.md")) if p.name != jd_path.name
        ]

    job, candidates = load_documents(jd_path, resume_paths)
    graph = build_graph()

    async with LLMClient(settings) as client:
        final = await graph.ainvoke(
            {
                "job": job,
                "candidates": candidates,
                "client": client,
                "settings": settings,
                "activity": [],
                "errors": [],
            }
        )

    if final.get("errors"):
        for e in final["errors"]:
            log.warning("run error: %s", e)

    return ScreeningRun(
        job=final["job"],
        requirements=final.get("requirements", []),
        candidates=final.get("candidates", []),
        findings=final.get("findings", []),
        questions=final.get("questions", []),
        activity=final.get("activity", []),
    )
