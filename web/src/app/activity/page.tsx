import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Wrench,
} from "lucide-react";

import { PageHeader } from "@/components/hireflow/app-shell";
import {
  Eyebrow,
  HeroCard,
  Panel,
  PanelHead,
} from "@/components/hireflow/kit";
import { cn } from "@/lib/utils";
import { activity, candidates, findings, requirements } from "@/lib/data";
import type { ActivityKind } from "@/lib/types";

const KIND: Record<
  ActivityKind,
  { icon: typeof Bot; label: string; badge: string }
> = {
  agent: {
    icon: Bot,
    label: "agent",
    badge: "bg-accent text-accent-foreground",
  },
  verifier: {
    icon: BadgeCheck,
    label: "verifier",
    badge: "bg-[var(--color-met-bg)] text-[var(--color-met)]",
  },
  tool: {
    icon: Wrench,
    label: "tool",
    badge: "bg-muted text-muted-foreground",
  },
  warn: {
    icon: AlertTriangle,
    label: "verifier",
    badge: "bg-[#f59e0b] text-white",
  },
};

export default function ActivityPage() {
  const refused = activity.filter((a) => a.kind === "warn").length;

  // Counted from the findings themselves, not from log lines — the trace only
  // shows a sample of steps, and overstating our own verification rate would
  // undercut the entire point of the product.
  const locatedQuotes = findings.reduce(
    (n, f) => n + f.evidence.filter((e) => e.verified).length,
    0,
  );
  const openFindings = findings.filter(
    (f) => f.status === "unverified" || f.status === "absent",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Agent activity"
        title="What the agent actually did"
        subtitle="Every step of the run, including each decision the verifier made. The amber lines are the ones that matter — those are claims the agent proposed and plain code refused to accept."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Stream ── */}
        <Panel className="overflow-hidden lg:col-span-2">
          <PanelHead
            title={
              <span className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute size-2 animate-ping rounded-full bg-[var(--color-met)] opacity-60" />
                  <span className="size-2 rounded-full bg-[var(--color-met)]" />
                </span>
                Run JOB-001
              </span>
            }
            subtitle="Reasoning trace, newest last"
            right={
              <span className="font-mono text-[11px] text-muted-foreground">
                {activity.length} events
              </span>
            }
          />

          <ol className="mt-3 divide-y divide-border/70">
            {activity.map((e) => {
              const k = KIND[e.kind];
              const Icon = k.icon;
              const loud = e.kind === "warn";
              return (
                <li
                  key={e.id}
                  className={cn(
                    "flex items-start gap-3 px-5 py-2.5",
                    loud && "bg-[var(--color-unverified-bg)]",
                  )}
                >
                  <span className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {e.at}
                  </span>
                  <span
                    className={cn(
                      "mt-px inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      k.badge,
                    )}
                  >
                    <Icon className="size-3" aria-hidden />
                    {k.label}
                  </span>
                  <span
                    className={cn(
                      "evidence-quote min-w-0 flex-1",
                      loud
                        ? "font-semibold text-[var(--color-unverified)]"
                        : "text-foreground/85",
                    )}
                  >
                    {e.message}
                  </span>
                </li>
              );
            })}
          </ol>
        </Panel>

        {/* ── Right column ── */}
        <div className="space-y-4">
          <HeroCard
            label="Claims refused"
            value={refused}
            caption="by the verifier, not the model"
            note="Each of these is a case where the agent proposed evidence and our own code could not locate it in the source document. The finding degraded to unverified instead of being accepted."
          />

          <Panel className="p-5">
            <Eyebrow>Run totals</Eyebrow>
            <ul className="mt-3 space-y-3">
              {[
                {
                  label: "Findings produced",
                  value: findings.length,
                  icon: CheckCircle2,
                  tone: "text-foreground",
                },
                {
                  label: "Quotes located in source",
                  value: locatedQuotes,
                  icon: BadgeCheck,
                  tone: "text-[var(--color-met)]",
                },
                {
                  label: "Requirements left open",
                  value: openFindings,
                  icon: AlertTriangle,
                  tone: "text-[var(--color-unverified)]",
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.label} className="flex items-center gap-2.5">
                    <Icon className={cn("size-4 shrink-0", s.tone)} aria-hidden />
                    <span className="text-sm text-muted-foreground">
                      {s.label}
                    </span>
                    <span className="ml-auto text-lg font-semibold tabular-nums">
                      {s.value}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              {requirements.length} requirements × {candidates.length} candidates
            </div>
          </Panel>

          <Panel className="p-5">
            <Eyebrow>How the verifier works</Eyebrow>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The verifier is plain code, not a model call. It checks that a
              proposed quote genuinely appears in the source document after
              Unicode normalisation, de-hyphenation and whitespace collapsing. If
              the quote cannot be located, the finding degrades to unverified.
            </p>
            <p className="mt-2.5 text-xs leading-relaxed font-medium text-foreground/80">
              The model is never given the final say on whether its own evidence
              is real.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
