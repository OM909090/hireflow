import Link from "next/link";
import { AlertTriangle, ArrowUpRight, MapPin, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/hireflow/app-shell";
import {
  CoverageBar,
  CoverageLegend,
  coverageSegments,
} from "@/components/hireflow/coverage";
import {
  Avatar,
  Donut,
  Eyebrow,
  HeroCard,
  IdTag,
  Panel,
} from "@/components/hireflow/kit";
import { StatusBadge } from "@/components/hireflow/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  candidates,
  findingsFor,
  requirementById,
  requirements,
} from "@/lib/data";
import { needsValidation, summariseCoverage } from "@/lib/types";
import type { CoverageSummary } from "@/lib/types";

export default function CandidatesPage() {
  const rows = candidates
    .map((c) => {
      const f = findingsFor(c.id);
      return {
        candidate: c,
        findings: f,
        summary: summariseCoverage(f, requirements),
        open: needsValidation(f),
      };
    })
    // Transparent sort: count of must-have requirements with located evidence.
    // The number being sorted on is printed on every card, so the ordering can
    // always be checked — unlike an opaque match score.
    .sort((a, b) => b.summary.hardEvidenced - a.summary.hardEvidenced);

  const totalOpen = rows.reduce((n, r) => n + r.open.length, 0);

  const pool: CoverageSummary = rows.reduce<CoverageSummary>(
    (acc, r) => ({
      met: acc.met + r.summary.met,
      partial: acc.partial + r.summary.partial,
      unverified: acc.unverified + r.summary.unverified,
      absent: acc.absent + r.summary.absent,
      total: acc.total + r.summary.total,
      hardEvidenced: acc.hardEvidenced + r.summary.hardEvidenced,
      hardTotal: acc.hardTotal + r.summary.hardTotal,
    }),
    {
      met: 0,
      partial: 0,
      unverified: 0,
      absent: 0,
      total: 0,
      hardEvidenced: 0,
      hardTotal: 0,
    },
  );

  // Must-have coverage only. A missing nice-to-have (e.g. a formal degree the
  // job description already treats as optional) must not disqualify a candidate
  // from this count, or the figure contradicts its own label.
  const fullyEvidenced = rows.filter(
    (r) => r.summary.hardEvidenced === r.summary.hardTotal,
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Step 3 — Candidates"
        title="Candidate pool"
        subtitle={`${candidates.length} candidates screened against ${requirements.length} requirements. Ordered by how many must-have requirements have located evidence — the same figure printed on each card.`}
      />

      {/* ── Pool summary ── */}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <HeroCard
          className="lg:col-span-1"
          label="Needs human validation"
          value={totalOpen}
          caption={`across ${rows.filter((r) => r.open.length > 0).length} of ${rows.length} candidates`}
          note="Each one is a requirement where related text exists but the requirement itself was never established. HireFlow has written a question for every one."
        />

        <Panel className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              segments={coverageSegments(pool)}
              centerTop="Findings"
              centerMain={pool.total}
              centerSub="across the pool"
              size={158}
              thickness={16}
            />
            <div className="min-w-[180px] flex-1">
              <Eyebrow>Pool breakdown</Eyebrow>
              <CoverageLegend summary={pool} className="mt-3" />
            </div>
            <div className="min-w-[150px] space-y-3">
              <div>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {fullyEvidenced}
                  <span className="text-muted-foreground">/{rows.length}</span>
                </p>
                <p className="text-xs leading-tight text-muted-foreground">
                  candidates with every
                  <br />
                  must-have evidenced
                </p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {requirements.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  requirements per candidate
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Candidate cards ── */}
      <div className="space-y-4">
        {rows.map(({ candidate: c, findings: f, summary, open }) => {
          const met = f.filter((x) => x.status === "met");

          return (
            <Panel key={c.id} className="overflow-hidden">
              <div className="flex flex-wrap items-start gap-4 p-5">
                <Avatar name={c.name} size="lg" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {c.name}
                    </h2>
                    <IdTag>{c.id}</IdTag>
                    {open.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-unverified-bg)] px-2.5 py-1 text-xs font-bold text-[var(--color-unverified)]">
                        <AlertTriangle className="size-3.5" aria-hidden />
                        {open.length} to validate
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                    <span>{c.headline}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden />
                      {c.location}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{c.yearsExperience} yrs</span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {summary.hardEvidenced}
                      <span className="text-muted-foreground">
                        /{summary.hardTotal}
                      </span>
                    </span>
                    <span className="text-xs leading-tight text-muted-foreground">
                      must-have requirements
                      <br />
                      with located evidence
                    </span>
                  </div>

                  <CoverageBar summary={summary} className="mt-3 max-w-md" />
                </div>

                <Link
                  href={`/candidates/${c.id}`}
                  className={buttonVariants({
                    size: "lg",
                    className: "shrink-0",
                  })}
                >
                  View evidence
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>

              {/* Gaps first — they are the reason to open the profile */}
              {open.length > 0 && (
                <div className="border-t border-border bg-[var(--color-unverified-bg)]/60 px-5 py-4">
                  <Eyebrow tone="warn">Needs validation</Eyebrow>
                  <div className="mt-2 space-y-1.5">
                    {open.map((x) => (
                      <div
                        key={x.id}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <StatusBadge status={x.status} />
                        <IdTag>{x.requirementId}</IdTag>
                        <span className="text-foreground/85">
                          {requirementById(x.requirementId)?.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidenced requirements, kept deliberately quiet */}
              {met.length > 0 && (
                <div className="border-t border-border px-5 py-4">
                  <Eyebrow>Evidenced</Eyebrow>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {met.map((x) => (
                      <span
                        key={x.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-met-border)] bg-[var(--color-met-bg)] px-2.5 py-1 text-xs text-[var(--color-met)]"
                      >
                        <span className="font-mono text-[10px] opacity-70">
                          {x.requirementId}
                        </span>
                        {requirementById(x.requirementId)?.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border bg-muted/50 px-5 py-4">
                <Eyebrow tone="brand" className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5" aria-hidden />
                  AI summary
                </Eyebrow>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                  {c.aiSummary}
                </p>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
