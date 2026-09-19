import { NextResponse } from "next/server";

import { completeJson, LlmError } from "@/lib/llm";
import { interviewPrompt } from "@/lib/prompts";
import { findingsFor, job, requirementById } from "@/lib/data";
import { getCandidate } from "@/lib/data";
import type { FindingStatus } from "@/lib/types";

/** Long model calls — allow well past the default serverless budget. */
export const maxDuration = 300;

const STATUSES: FindingStatus[] = ["met", "partial", "unverified", "absent"];

interface RawEval {
  new_status: string;
  sufficient?: boolean;
  reason: string;
  evidence_quote?: string | null;
  missing_detail?: string | null;
  follow_up?: string | null;
}

function validate(v: unknown): RawEval {
  if (typeof v !== "object" || v === null) throw new Error("not an object");
  const o = v as Record<string, unknown>;
  if (typeof o.new_status !== "string" || !STATUSES.includes(o.new_status as FindingStatus)) {
    throw new Error(`new_status must be one of ${STATUSES.join("|")}`);
  }
  if (typeof o.reason !== "string" || o.reason.trim().length < 3) {
    throw new Error("reason must be a non-empty string");
  }
  return o as unknown as RawEval;
}

/** Normalised containment — the same grounding rule the resume verifier uses. */
function locate(quote: string, source: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").replace(/\s+/g, " ").trim();
  const q = norm(quote);
  if (q.split(" ").length < 4) return false;
  return norm(source).includes(q);
}

export async function POST(request: Request) {
  let body: {
    candidateId?: string;
    requirementId?: string;
    answer?: string;
    question?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { candidateId, requirementId, answer, question } = body;
  if (!candidateId || !requirementId || !answer?.trim()) {
    return NextResponse.json(
      { error: "candidateId, requirementId and answer are required" },
      { status: 400 },
    );
  }

  // Scope everything by the ids we were given. This is what prevents one
  // candidate's evidence from ever being used to judge another.
  const candidate = getCandidate(candidateId);
  const requirement = requirementById(requirementId);
  const finding = findingsFor(candidateId).find(
    (f) => f.requirementId === requirementId,
  );
  if (!candidate || !requirement || !finding) {
    return NextResponse.json(
      { error: "Unknown candidate or requirement" },
      { status: 404 },
    );
  }

  const prompt = interviewPrompt({
    candidateName: candidate.name,
    jobTitle: job.title,
    requirementId: requirement.id,
    requirementText: requirement.text,
    requirementKind: requirement.kind === "hard" ? "must-have" : "nice-to-have",
    priorStatus: finding.status,
    priorReason: finding.reason,
    missingDetail: finding.missingDetail,
    question: question?.trim() || "(no question recorded)",
    answer: answer.trim(),
  });

  const startedAt = Date.now();
  try {
    const { value, model } = await completeJson(prompt, validate, {
      maxTokens: 900,
      label: `analyze ${candidateId}/${requirementId}`,
    });

    // ── Our code adjudicates the model's proposal ──────────────────────────
    // The model proposes a status and a quote; we only accept a promotion to
    // "met" when the quote it cites can actually be located in the answer.
    const proposed = value.new_status as FindingStatus;
    const quote = value.evidence_quote?.trim() || null;
    const grounded = quote ? locate(quote, answer) : false;

    let outcome: "verified" | "insufficient";
    let newStatus: FindingStatus;
    let reason = value.reason.trim();

    if (proposed === "met" && grounded) {
      outcome = "verified";
      newStatus = "met";
    } else if (proposed === "met" && !grounded) {
      // Refused: the model claimed sufficiency but its quote is not in the answer.
      outcome = "insufficient";
      newStatus = finding.status;
      reason =
        `${reason} (Verification refused: the supporting quote could not be located ` +
        `in the recorded answer, so the requirement stays ${finding.status}.)`;
    } else {
      outcome = "insufficient";
      newStatus = finding.status;
    }

    return NextResponse.json({
      outcome,
      newStatus,
      priorStatus: finding.status,
      reason,
      evidenceQuote: outcome === "verified" ? quote : null,
      evidenceSource: "Interview answer",
      quoteGrounded: grounded,
      missingDetail: value.missing_detail ?? null,
      followUp: outcome === "insufficient" ? (value.follow_up ?? null) : null,
      model,
      elapsedMs: Date.now() - startedAt,
      verifiedBy: "HireFlow AI",
    });
  } catch (e) {
    const message = e instanceof LlmError ? e.message : String(e);
    return NextResponse.json(
      { error: `Agent could not complete the analysis: ${message}` },
      { status: 502 },
    );
  }
}
