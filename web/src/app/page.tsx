"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  FileText,
  MapPin,
  Play,
  RotateCcw,
  Upload,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/hireflow/app-shell";
import { RunConsole } from "@/components/hireflow/run-console";
import {
  Avatar,
  Chip,
  Eyebrow,
  HeroCard,
  Panel,
  PanelHead,
} from "@/components/hireflow/kit";
import { buttonVariants } from "@/components/ui/button";
import { activity, candidates, findings, job, questions, requirements } from "@/lib/data";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    t: "Requirements",
    d: "The job description is split into individually addressable requirements with stable IDs.",
  },
  {
    n: "02",
    t: "Evidence proposal",
    d: "For each requirement the agent proposes a supporting quote from the resume. It does not decide truth.",
  },
  {
    n: "03",
    t: "Verification",
    d: "Plain code checks the quote genuinely appears in the source. If it cannot be located, the claim is refused.",
  },
  {
    n: "04",
    t: "Human decision",
    d: "Verified evidence, open gaps and targeted questions are handed to you. You decide.",
  },
];

type Phase = "idle" | "running" | "done";

export default function IntakePage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const hard = requirements.filter((r) => r.kind === "hard").length;

  const stats = useMemo(() => {
    const counts = { met: 0, partial: 0, unverified: 0, absent: 0 };
    let verified = 0;
    let refused = 0;
    for (const f of findings) {
      counts[f.status] += 1;
      for (const e of f.evidence) {
        if (e.verified) verified += 1;
        else refused += 1;
      }
    }
    return {
      counts,
      verified,
      refused,
      open: counts.unverified + counts.absent,
      questions: questions.length,
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Step 1 — Intake"
        title="Screen a role"
        subtitle="Load one job description and the resumes to screen against it. HireFlow parses the role into numbered requirements, then evaluates every candidate against each one individually."
        actions={
          phase === "idle" ? (
            <button
              type="button"
              onClick={() => setPhase("running")}
              className={buttonVariants({ size: "lg" })}
            >
              <Play className="size-4" aria-hidden />
              Run screening
            </button>
          ) : phase === "done" ? (
            <button
              type="button"
              onClick={() => setPhase("running")}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <RotateCcw className="size-4" aria-hidden />
              Run again
            </button>
          ) : null
        }
      />

      {phase === "running" && (
        <RunConsole events={activity} onDone={() => setPhase("done")} />
      )}

      {phase === "done" && (
        <ResultsSummary stats={stats} />
      )}

      {phase === "idle" && (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {/* ── Job description ── */}
            <Panel className="lg:col-span-2">
              <PanelHead
                title={
                  <span className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-accent">
                      <Briefcase
                        className="size-4 text-accent-foreground"
                        aria-hidden
                      />
                    </span>
                    Job description
                  </span>
                }
                subtitle="One role per screening run"
                right={
                  <Chip className="border-[var(--color-met-border)] bg-[var(--color-met-bg)] font-medium text-[var(--color-met)]">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    Loaded
                  </Chip>
                }
              />

              <div className="p-5">
                <div className="rounded-2xl bg-muted/70 p-4">
                  <p className="text-lg font-semibold tracking-tight">
                    {job.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                    <span>{job.company}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden />
                      {job.location}
                    </span>
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="size-3.5" aria-hidden />
                    <span className="font-mono">{job.sourceDoc}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Eyebrow>
                    Parsed into {requirements.length} requirements · {hard}{" "}
                    must-have
                  </Eyebrow>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {requirements.map((r) => (
                      <span
                        key={r.id}
                        className={
                          r.kind === "hard"
                            ? "rounded-lg bg-accent px-2 py-1 font-mono text-[11px] font-bold text-accent-foreground"
                            : "rounded-lg border border-border px-2 py-1 font-mono text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        {r.id}
                      </span>
                    ))}
                  </div>
                </div>

                <pre className="evidence-quote mt-4 max-h-56 overflow-auto rounded-2xl border border-border bg-muted/50 p-4 whitespace-pre-wrap text-foreground/80">
                  {job.rawText}
                </pre>
              </div>
            </Panel>

            {/* ── Right column ── */}
            <div className="space-y-4">
              <HeroCard
                label="Ready to screen"
                value={candidates.length}
                caption={`candidates × ${requirements.length} requirements`}
                note={`${candidates.length * requirements.length} individual evidence checks. Every one either cites a located quote or is flagged for a human.`}
              />

              <Panel>
                <PanelHead
                  title={
                    <span className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-xl bg-accent">
                        <Users
                          className="size-4 text-accent-foreground"
                          aria-hidden
                        />
                      </span>
                      Resumes
                    </span>
                  }
                  right={
                    <Chip className="border-[var(--color-met-border)] bg-[var(--color-met-bg)] font-medium text-[var(--color-met)]">
                      {candidates.length}
                    </Chip>
                  }
                />
                <div className="mt-3 divide-y divide-border">
                  {candidates.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {c.sourceDoc}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.yearsExperience} yrs
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-5 pt-3">
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                    <Upload className="size-4" aria-hidden />
                    Drop more resumes
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Every candidate in this demo is synthetic. HireFlow is never
                    pointed at real resumes in a demo environment.
                  </p>
                </div>
              </Panel>
            </div>
          </div>

          {/* ── Pipeline ── */}
          <Panel className="mt-4 p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  What happens when you run a screening
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  The agent proposes evidence. Our code validates it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhase("running")}
                className={buttonVariants({ variant: "outline" })}
              >
                Run screening
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>

            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-2xl bg-muted/60 p-4">
                  <span className="font-mono text-[11px] font-bold text-primary">
                    {s.n}
                  </span>
                  <p className="mt-1 text-sm font-semibold">{s.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {s.d}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </>
      )}
    </>
  );
}

// ── done state ────────────────────────────────────────────────────────────

function ResultsSummary({
  stats,
}: {
  stats: {
    counts: Record<string, number>;
    verified: number;
    refused: number;
    open: number;
    questions: number;
  };
}) {
  const tiles = [
    {
      label: "Requirements evidenced",
      value: stats.counts.met,
      tone: "text-[var(--color-met)]",
      icon: CheckCircle2,
    },
    {
      label: "Quotes located in source",
      value: stats.verified,
      tone: "text-[var(--color-met)]",
      icon: BadgeCheck,
    },
    {
      label: "Need human validation",
      value: stats.open,
      tone: "text-[var(--color-unverified)]",
      icon: AlertTriangle,
    },
    {
      label: "Questions generated",
      value: stats.questions,
      tone: "text-primary",
      icon: Activity,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Panel className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--color-met-bg)] text-[var(--color-met)]">
            <CheckCircle2 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Screening complete
            </h2>
            <p className="text-sm text-muted-foreground">
              {candidates.length} candidates evaluated against{" "}
              {requirements.length} requirements.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="rounded-2xl bg-muted/60 p-4">
                <Icon className={cn("size-4", t.tone)} aria-hidden />
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {t.value}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {t.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/candidates" className={buttonVariants({ size: "lg" })}>
            View candidates
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/activity"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <Activity className="size-4" aria-hidden />
            See the full run
          </Link>
        </div>
      </Panel>

      {stats.refused === 0 && (
        <Panel className="p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              Every quote in this run was located in its source document.
            </span>{" "}
            The verifier refused nothing this time — but the refusal path is real
            and unit-tested. What it guarantees is that a claim which{" "}
            <em>cannot</em> be grounded is never shown as met.
          </p>
        </Panel>
      )}
    </div>
  );
}
