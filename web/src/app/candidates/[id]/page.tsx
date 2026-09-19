import { notFound } from "next/navigation";

import { CandidateWorkspace } from "@/components/hireflow/candidate-workspace";
import {
  candidates,
  findingsFor,
  getCandidate,
  interviewsFor,
  job,
  questionsFor,
  requirements,
} from "@/lib/data";

export function generateStaticParams() {
  return candidates.map((c) => ({ id: c.id }));
}

export default async function CandidatePage({
  params,
}: PageProps<"/candidates/[id]">) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) notFound();

  const findings = findingsFor(id);
  const questions = questionsFor(id);

  // Recorded answers pre-fill the agent panel so a demo has content to analyse.
  // They are suggestions only — nothing is verified until the agent analyses.
  const recordedAnswers: Record<string, string> = Object.fromEntries(
    interviewsFor(id).map((i) => [i.requirementId, i.answer]),
  );

  return (
    <CandidateWorkspace
      candidate={candidate}
      jobTitle={job.title}
      requirements={requirements}
      findings={findings}
      questions={questions}
      recordedAnswers={recordedAnswers}
    />
  );
}
