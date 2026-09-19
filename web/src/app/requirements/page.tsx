import Link from "next/link";
import { ArrowRight, FileText, Quote } from "lucide-react";

import { PageHeader } from "@/components/hireflow/app-shell";
import {
  Eyebrow,
  HeroCard,
  IdTag,
  Panel,
  PanelHead,
} from "@/components/hireflow/kit";
import { StatusBadge } from "@/components/hireflow/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { candidates, findings, job, requirements } from "@/lib/data";
import type { FindingStatus } from "@/lib/types";

const ORDER: FindingStatus[] = ["unverified", "absent", "partial", "met"];

export default function RequirementsPage() {
  const hard = requirements.filter((r) => r.kind === "hard").length;
  const contested = requirements.filter((r) =>
    findings.some(
      (f) =>
        f.requirementId === r.id &&
        (f.status === "unverified" || f.status === "absent"),
    ),
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Step 2 — Requirements"
        title="What the role actually asks for"
        subtitle={`${job.title} was decomposed into ${requirements.length} individually addressable requirements. Every finding, question and audit entry in HireFlow references one of these IDs and nothing else.`}
        actions={
          <Link href="/candidates" className={buttonVariants({ size: "lg" })}>
            See candidates
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <HeroCard
          label="Requirements parsed"
          value={requirements.length}
          caption={`${hard} must-have · ${requirements.length - hard} nice-to-have`}
          note="Each one carries a stable ID and a verbatim quote from the job description it was derived from."
        />
        <Panel className="p-5">
          <Eyebrow>Requirements with open gaps</Eyebrow>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {contested}
            <span className="text-muted-foreground">
              /{requirements.length}
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            At least one candidate could not be evidenced against these. They are
            the requirements worth designing your interviews around.
          </p>
        </Panel>
        <Panel className="p-5">
          <Eyebrow>Evidence checks run</Eyebrow>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {findings.length}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {requirements.length} requirements × {candidates.length} candidates.
            Each produced a cited quote or an explicit gap.
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {requirements.map((r, i) => {
            const rf = findings.filter((f) => f.requirementId === r.id);
            const counts = ORDER.map((s) => ({
              s,
              n: rf.filter((f) => f.status === s).length,
            })).filter((x) => x.n > 0);

            return (
              <Panel key={r.id} className="p-5">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent font-mono text-sm font-bold text-accent-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <IdTag>{r.id}</IdTag>
                      {r.kind === "hard" ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
                          must have
                        </span>
                      ) : (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                          nice to have
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-base leading-snug font-medium">
                      {r.text}
                    </h2>

                    <div className="mt-3 rounded-2xl border-l-2 border-primary/30 bg-muted/60 py-2 pr-3 pl-3">
                      <Eyebrow className="flex items-center gap-1.5">
                        <Quote className="size-3" aria-hidden />
                        Derived from the job description
                      </Eyebrow>
                      <p className="evidence-quote mt-1 text-foreground/85">
                        {r.sourceQuote}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Across {candidates.length} candidates
                      </span>
                      {counts.map(({ s, n }) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1"
                        >
                          <StatusBadge status={s} showIcon={false} />
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            ×{n}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>

        <Panel className="lg:sticky lg:top-4 lg:self-start">
          <PanelHead
            title="Source document"
            subtitle={job.sourceDoc}
            right={
              <span className="grid size-8 place-items-center rounded-xl bg-muted">
                <FileText
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              </span>
            }
          />
          <div className="p-5">
            <pre className="evidence-quote max-h-[540px] overflow-auto rounded-2xl bg-muted/60 p-4 whitespace-pre-wrap text-foreground/80">
              {job.rawText}
            </pre>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Requirements are only ever derived from this text. Nothing is
              inferred from job titles, seniority conventions or industry norms.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
