import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/hireflow/app-shell";
import {
  CoverageLegend,
  coverageSegments,
} from "@/components/hireflow/coverage";
import { DecisionHero } from "@/components/hireflow/decision-bar";
import { FindingRow } from "@/components/hireflow/finding-row";
import {
  Avatar,
  Donut,
  Eyebrow,
  IdTag,
  Panel,
  PanelHead,
} from "@/components/hireflow/kit";
import { StatusBadge } from "@/components/hireflow/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  candidates,
  findingsFor,
  getCandidate,
  questionsFor,
  requirementById,
  requirements,
} from "@/lib/data";
import { needsValidation, summariseCoverage } from "@/lib/types";

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
  const summary = summariseCoverage(findings, requirements);
  const open = needsValidation(findings);
  const questionByReq = new Map(questions.map((q) => [q.requirementId, q]));

  return (
    <>
      <PageHeader
        eyebrow={`Candidate ${candidate.id}`}
        title={candidate.name}
        subtitle={candidate.headline}
        actions={
          <Link
            href="/candidates"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <ArrowLeft className="size-4" aria-hidden />
            All candidates
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ══ Left: the evidence ══ */}
        <div className="space-y-4 lg:col-span-2">
          {/* The confrontation */}
          {open.length > 0 && (
            <section className="overflow-hidden rounded-3xl border-2 border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)] card-lift">
              <div className="flex items-start gap-3 px-5 pt-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f59e0b] text-white">
                  <AlertTriangle className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--color-unverified)]">
                    {open.length} requirement{open.length === 1 ? "" : "s"} could
                    not be verified from the resume
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/75">
                    Related text exists, but nothing that establishes the
                    requirement. Rather than infer it, these are flagged for a
                    person and paired with a question.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 p-5">
                {open.map((f) => {
                  const r = requirementById(f.requirementId);
                  const q = questionByReq.get(f.requirementId);
                  return (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-[var(--color-unverified-border)] bg-card p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <IdTag>{f.requirementId}</IdTag>
                        <StatusBadge status={f.status} long />
                        <span className="text-sm font-medium">{r?.text}</span>
                      </div>

                      {f.missingDetail && (
                        <div className="mt-3 flex items-start gap-2 text-sm">
                          <ShieldAlert
                            className="mt-0.5 size-4 shrink-0 text-[var(--color-unverified)]"
                            aria-hidden
                          />
                          <span>
                            <span className="font-semibold text-[var(--color-unverified)]">
                              Missing:{" "}
                            </span>
                            <span className="text-foreground/85">
                              {f.missingDetail}
                            </span>
                          </span>
                        </div>
                      )}

                      {q && (
                        <div className="mt-3 rounded-2xl bg-accent p-3">
                          <Eyebrow tone="brand" className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5" aria-hidden />
                            Ask this in the interview
                          </Eyebrow>
                          <p className="mt-1.5 text-sm font-medium">
                            {q.question}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Requirement coverage */}
          <Panel>
            <PanelHead
              title="Requirement coverage"
              subtitle="Open any row to see the exact source text behind the verdict"
              right={
                <span className="text-xs text-muted-foreground">
                  {findings.length} findings
                </span>
              }
            />
            <div className="space-y-2.5 p-5">
              {findings.map((f) => {
                const r = requirementById(f.requirementId);
                if (!r) return null;
                return (
                  <FindingRow
                    key={f.id}
                    requirement={r}
                    finding={f}
                    question={questionByReq.get(f.requirementId)}
                    // Uncertainty opens by default — the user should not have to
                    // go hunting for what the system could not establish.
                    defaultOpen={f.status === "unverified"}
                  />
                );
              })}
            </div>
          </Panel>

          {/* Interview pack */}
          {questions.length > 0 && (
            <Panel>
              <PanelHead
                title="Interview pack"
                subtitle={`${questions.length} question${questions.length === 1 ? "" : "s"} written against the specific gaps above — not generic role questions`}
              />
              <div className="divide-y divide-border px-5 pb-1">
                {questions.map((q, i) => {
                  const r = requirementById(q.requirementId);
                  return (
                    <div key={q.id} className="py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-lg bg-accent font-mono text-[11px] font-bold text-accent-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <IdTag>{q.requirementId}</IdTag>
                        <span className="text-xs text-muted-foreground">
                          {r?.text}
                        </span>
                      </div>

                      <p className="mt-2.5 text-sm font-medium">{q.question}</p>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold">Why: </span>
                        {q.rationale}
                      </p>

                      {q.followUp && (
                        <div className="mt-3 rounded-xl border-l-2 border-primary/40 bg-muted/60 py-2 pr-3 pl-3">
                          <Eyebrow>If the answer is still unclear</Eyebrow>
                          <p className="mt-1 text-sm text-foreground/90">
                            {q.followUp}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>

        {/* ══ Right: profile, ring, verdict ══
            Sticky because the evidence list on the left is much taller — the
            verdict and the open-gap count should stay visible while scrolling. */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Avatar name={candidate.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight">
                  {candidate.name}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" aria-hidden />
                  {candidate.location}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {candidate.yearsExperience} years experience
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2">
              <FileText className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                {candidate.sourceDoc}
              </span>
            </div>
          </Panel>

          <Panel className="p-5">
            <Eyebrow>Evidence breakdown</Eyebrow>
            <div className="mt-3 flex items-center gap-4">
              <Donut
                segments={coverageSegments(summary)}
                centerTop="Evidenced"
                centerMain={`${summary.met}/${summary.total}`}
                centerSub="all requirements"
                size={150}
                thickness={15}
              />
              <CoverageLegend summary={summary} className="min-w-0 flex-1" />
            </div>
          </Panel>

          <Panel className="p-5">
            <Eyebrow tone="brand" className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden />
              AI summary
            </Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              {candidate.aiSummary}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Generated from {findings.length} findings. Every claim is
              individually inspectable on the left.
            </p>
          </Panel>

          <DecisionHero
            candidateName={candidate.name}
            summary={summary}
            openCount={open.length}
          />
        </div>
      </div>
    </>
  );
}
