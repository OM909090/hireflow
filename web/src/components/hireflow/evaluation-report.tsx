import { AlertTriangle, BadgeCheck, FileText, Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Finding, FindingStatus, Requirement } from "@/lib/types";
import { Eyebrow, IdTag, Panel } from "./kit";
import { STATUS_META, StatusBadge } from "./status-badge";

/** Minimal interview outcome — a live verification promoted this requirement. */
export interface InterviewOutcome {
  requirementId: string;
  newStatus: FindingStatus;
}

/**
 * Standardized interview evaluation report (capability 11) + unanswered
 * evaluation areas (capability 10).
 *
 * The report combines two evidence sources — the resume screening and the
 * interview re-evaluation — into one final view per requirement. "Final" status
 * takes the interview result where an answer was recorded, otherwise the resume
 * result, because the interview is the later and more direct evidence. Anything
 * still short of met after both is an unanswered evaluation area.
 */
export function EvaluationReport({
  requirements,
  findings,
  interviews,
}: {
  requirements: Requirement[];
  findings: Finding[];
  interviews: InterviewOutcome[];
}) {
  const findingByReq = new Map(findings.map((f) => [f.requirementId, f]));
  const interviewByReq = new Map(interviews.map((i) => [i.requirementId, i]));

  const rows = requirements.map((r) => {
    const resume = findingByReq.get(r.id)?.status ?? "absent";
    const iv = interviewByReq.get(r.id);
    const final: FindingStatus = iv ? iv.newStatus : resume;
    return { r, resume, interview: iv?.newStatus ?? null, final };
  });

  const evidencedFromResume = rows.filter(
    (x) => x.interview === null && x.final === "met",
  ).length;
  const validatedInInterview = rows.filter(
    (x) => x.interview === "met",
  ).length;
  const unresolved = rows.filter(
    (x) => x.final === "unverified" || x.final === "absent",
  );

  return (
    <Panel>
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary">
          <FileText className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Evaluation report
          </h2>
          <p className="text-xs text-muted-foreground">
            Resume screening and interview evidence, combined into one verdict
            per requirement
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-3 border-b border-border p-5 sm:grid-cols-3">
        <ReportStat
          icon={BadgeCheck}
          tone="text-[var(--color-met)]"
          value={evidencedFromResume}
          label="evidenced from resume"
        />
        <ReportStat
          icon={Mic}
          tone="text-primary"
          value={validatedInInterview}
          label="validated in interview"
        />
        <ReportStat
          icon={AlertTriangle}
          tone="text-[var(--color-unverified)]"
          value={unresolved.length}
          label="unresolved after interview"
        />
      </div>

      {/* Requirement table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-4 pb-2">
                <Eyebrow>Requirement</Eyebrow>
              </th>
              <th className="p-4 pb-2 text-center">
                <Eyebrow>Resume</Eyebrow>
              </th>
              <th className="p-4 pb-2 text-center">
                <Eyebrow>Interview</Eyebrow>
              </th>
              <th className="p-4 pb-2 text-center">
                <Eyebrow>Final</Eyebrow>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, resume, interview, final }) => (
              <tr key={r.id} className="border-t border-border/70">
                <td className="p-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <IdTag>{r.id}</IdTag>
                    <span className="text-[13px]">{r.text}</span>
                  </div>
                </td>
                <td className="p-2 py-2.5 text-center">
                  <Dot status={resume} />
                </td>
                <td className="p-2 py-2.5 text-center">
                  {interview ? (
                    <Dot status={interview} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-2 py-2.5 text-center">
                  <Dot status={final} strong={interview !== null && interview !== resume} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unanswered areas — capability 10 */}
      {unresolved.length > 0 && (
        <div className="border-t border-border bg-[var(--color-unverified-bg)]/60 px-5 py-4">
          <div className="flex items-center gap-1.5">
            <AlertTriangle
              className="size-4 text-[var(--color-unverified)]"
              aria-hidden
            />
            <p className="text-sm font-semibold text-[var(--color-unverified)]">
              Evaluation incomplete — {unresolved.length} area
              {unresolved.length === 1 ? "" : "s"} remain unvalidated
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unresolved.map(({ r, final }) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-unverified-border)] bg-card px-2.5 py-1 text-xs"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    final === "absent"
                      ? "bg-[var(--color-absent)]"
                      : "bg-[var(--color-unverified)]",
                  )}
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {r.id}
                </span>
                {r.text}
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
            These are the requirements to resolve before a decision — HireFlow
            will not close them on its own.
          </p>
        </div>
      )}
    </Panel>
  );
}

function ReportStat({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: typeof BadgeCheck;
  tone: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <Icon className={cn("size-4", tone)} aria-hidden />
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function Dot({
  status,
  strong = false,
}: {
  status: FindingStatus;
  strong?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        strong && "rounded-full ring-2 ring-[var(--color-met)]/40",
      )}
      title={meta.label}
    >
      <StatusBadge status={status} showIcon />
    </span>
  );
}
