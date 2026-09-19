import { NextResponse } from "next/server";

import { completeJson, LlmError } from "@/lib/llm";
import { questionPrompt } from "@/lib/prompts";
import {
  findingsFor,
  getCandidate,
  job,
  questionsFor,
  requirementById,
} from "@/lib/data";

export const maxDuration = 300;

interface RawQuestion {
  question: string;
  rationale: string;
  follow_up?: string | null;
}

function validate(v: unknown): RawQuestion {
  if (typeof v !== "object" || v === null) throw new Error("not an object");
  const o = v as Record<string, unknown>;
  if (typeof o.question !== "string" || o.question.trim().length < 8) {
    throw new Error("question must be a non-empty string");
  }
  return {
    question: o.question.trim(),
    rationale:
      typeof o.rationale === "string" && o.rationale.trim()
        ? o.rationale.trim()
        : "Targets the missing evidence for this requirement.",
    follow_up: typeof o.follow_up === "string" ? o.follow_up.trim() : null,
  };
}

export async function POST(request: Request) {
  let body: {
    candidateId?: string;
    requirementId?: string;
    alreadyAsked?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { candidateId, requirementId } = body;
  if (!candidateId || !requirementId) {
    return NextResponse.json(
      { error: "candidateId and requirementId are required" },
      { status: 400 },
    );
  }

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

  const asked =
    body.alreadyAsked?.length
      ? body.alreadyAsked
      : questionsFor(candidateId).map((q) => q.question);

  const prompt = questionPrompt({
    candidateName: candidate.name,
    jobTitle: job.title,
    requirementId: requirement.id,
    requirementText: requirement.text,
    priorStatus: finding.status,
    priorReason: finding.reason,
    missingDetail: finding.missingDetail,
    alreadyAsked: asked,
  });

  const startedAt = Date.now();
  try {
    const { value, model } = await completeJson(prompt, validate, {
      maxTokens: 700,
      label: `question ${candidateId}/${requirementId}`,
    });
    return NextResponse.json({
      question: value.question,
      rationale: value.rationale,
      followUp: value.follow_up ?? null,
      model,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (e) {
    const message = e instanceof LlmError ? e.message : String(e);
    return NextResponse.json(
      { error: `Agent could not generate a question: ${message}` },
      { status: 502 },
    );
  }
}
