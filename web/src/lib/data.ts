import runJson from "@/data/run.json";

import type {
  ActivityEvent,
  Candidate,
  Finding,
  InterviewItem,
  InterviewQuestion,
  JobDescription,
  Requirement,
  ScreeningRun,
} from "./types";

/**
 * Real screening output.
 *
 * `src/data/run.json` is written by the LangGraph pipeline in `api/`:
 *
 *     cd api && uv run python -m hireflow.run
 *
 * It is genuine model output passed through the evidence verifier — not
 * fixtures. It is committed and read statically rather than fetched live
 * because each model call on this endpoint costs ~25-35 s, so a live call would
 * make the UI unusable and the demo impossible. The shape is guaranteed by
 * `ScreeningRun` in types.ts, which the Python side mirrors and emits.
 */

interface RunFile extends ScreeningRun {
  generatedAt?: string;
}

const run = runJson as unknown as RunFile;

export const job: JobDescription = run.job;
export const requirements: Requirement[] = run.requirements;
export const candidates: Candidate[] = run.candidates;
export const findings: Finding[] = run.findings;
export const questions: InterviewQuestion[] = run.questions;
export const interviews: InterviewItem[] = run.interviews ?? [];
export const activity: ActivityEvent[] = run.activity;
export const generatedAt: string | undefined = run.generatedAt;

/** Model that produced the findings, for display in the audit trail. */
export const model: string = findings[0]?.model ?? "unknown";

/* ── Lookups ──────────────────────────────────────────────────────────────── */

export function getCandidate(id: string): Candidate | undefined {
  return candidates.find((c) => c.id === id);
}

const REQ_ORDER = new Map(requirements.map((r, i) => [r.id, i]));

export function findingsFor(candidateId: string): Finding[] {
  return findings
    .filter((f) => f.candidateId === candidateId)
    .sort(
      (a, b) =>
        (REQ_ORDER.get(a.requirementId) ?? 0) -
        (REQ_ORDER.get(b.requirementId) ?? 0),
    );
}

export function questionsFor(candidateId: string): InterviewQuestion[] {
  return questions
    .filter((q) => q.candidateId === candidateId)
    .sort(
      (a, b) =>
        (REQ_ORDER.get(a.requirementId) ?? 0) -
        (REQ_ORDER.get(b.requirementId) ?? 0),
    );
}

export function requirementById(id: string): Requirement | undefined {
  return requirements.find((r) => r.id === id);
}

export function interviewsFor(candidateId: string): InterviewItem[] {
  return interviews
    .filter((i) => i.candidateId === candidateId)
    .sort(
      (a, b) =>
        (REQ_ORDER.get(a.requirementId) ?? 0) -
        (REQ_ORDER.get(b.requirementId) ?? 0),
    );
}

/** Candidates that have recorded interview answers. */
export const interviewedCandidateIds: string[] = [
  ...new Set(interviews.map((i) => i.candidateId)),
];
