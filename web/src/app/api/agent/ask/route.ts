import { NextResponse } from "next/server";

import { completeJson, LlmError } from "@/lib/llm";
import { askPrompt, ASK_INTENTS, type AskIntent } from "@/lib/prompts";
import {
  findingsFor,
  getCandidate,
  job,
  questionsFor,
  requirementById,
  requirements,
} from "@/lib/data";
import type { FindingStatus } from "@/lib/types";

export const maxDuration = 300;

interface RawAnswer {
  title: string;
  body: string;
}

function validate(v: unknown): RawAnswer {
  if (typeof v !== "object" || v === null) throw new Error("not an object");
  const o = v as Record<string, unknown>;
  if (typeof o.body !== "string" || o.body.trim().length < 3) {
    throw new Error("body must be a non-empty string");
  }
  return {
    title: typeof o.title === "string" && o.title.trim() ? o.title.trim() : "HireFlow AI",
    body: o.body.trim(),
  };
}

export async function POST(request: Request) {
  let body: {
    candidateId?: string;
    requirementId?: string;
    intent?: string;
    question?: string;
    /** Live statuses from the client, so the agent sees interview verifications. */
    liveStatuses?: Record<string, FindingStatus>;
    interviewLog?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intent = (body.intent ?? "free") as AskIntent;
  if (!(intent in ASK_INTENTS)) {
    return NextResponse.json({ error: "Unknown intent" }, { status: 400 });
  }
  if (!body.candidateId) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const candidate = getCandidate(body.candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Unknown candidate" }, { status: 404 });
  }

  // Context is assembled for THIS candidate only.
  const live = body.liveStatuses ?? {};
  const findings = findingsFor(candidate.id).map((f) => ({
    ...f,
    status: live[f.requirementId] ?? f.status,
  }));
  const statusByReq = new Map(findings.map((f) => [f.requirementId, f]));

  const requirementLines = requirements.map((r) => {
    const f = statusByReq.get(r.id);
    return `${r.id} | ${r.kind === "hard" ? "must-have" : "nice-to-have"} | ${f?.status ?? "absent"} | ${r.text}`;
  });

  const focusReq = body.requirementId ? requirementById(body.requirementId) : undefined;
  const focusFinding = body.requirementId
    ? statusByReq.get(body.requirementId)
    : undefined;

  const prompt = askPrompt({
    intent,
    userQuestion: body.question,
    candidateName: candidate.name,
    candidateHeadline: candidate.headline,
    candidateYears: candidate.yearsExperience,
    candidateSummary: candidate.aiSummary,
    jobTitle: job.title,
    focusRequirement:
      focusReq && focusFinding
        ? {
            id: focusReq.id,
            text: focusReq.text,
            kind: focusReq.kind === "hard" ? "must-have" : "nice-to-have",
            status: focusFinding.status,
            reason: focusFinding.reason,
            missingDetail: focusFinding.missingDetail,
          }
        : undefined,
    requirementLines,
    askedQuestions: questionsFor(candidate.id).map(
      (q) => `${q.requirementId}: ${q.question}`,
    ),
    interviewLog: body.interviewLog ?? [],
  });

  const startedAt = Date.now();
  try {
    const { value, model } = await completeJson(prompt, validate, {
      maxTokens: 700,
      label: `ask ${candidate.id}/${intent}`,
    });
    return NextResponse.json({
      title: value.title,
      body: value.body,
      model,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (e) {
    const message = e instanceof LlmError ? e.message : String(e);
    return NextResponse.json(
      { error: `Agent could not answer: ${message}` },
      { status: 502 },
    );
  }
}
