"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  FileText,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type {
  Candidate,
  Finding,
  InterviewQuestion,
  Requirement,
} from "@/lib/types";
import { needsValidation, summariseCoverage } from "@/lib/types";
import { useVerification } from "@/lib/verification-store";
import { AiAgentDrawer } from "./ai-agent-drawer";
import { CoverageLegend, coverageSegments } from "./coverage";
import { DecisionHero } from "./decision-bar";
import { EvaluationReport } from "./evaluation-report";
import { FindingRow } from "./finding-row";
import { Avatar, Donut, Eyebrow, IdTag, Panel, PanelHead } from "./kit";
import { HireFlowGlyph } from "./logo";
import { StatusBadge } from "./status-badge";

/**
 * The candidate evidence workspace.
 *
 * The workspace owns the full width; the AI Interview Agent lives in an
 * on-demand right-hand drawer, opened from "Ask HireFlow AI" or from any open
 * requirement. All requirement status is read through the verification store, so
 * a verification made in the drawer updates the coverage ring, the open-gap
 * count, the evaluation report and the audit trail here immediately — and the
 * pool stats and matrix on the other pages too.
 */
export function CandidateWorkspace({
  candidate,
  jobTitle,
  requirements,
  findings,
  questions,
  recordedAnswers,
}: {
  candidate: Candidate;
  jobTitle: string;
  requirements: Requirement[];
  findings: Finding[];
  questions: InterviewQuestion[];
  recordedAnswers: Record<string, string>;
}) {
  const { statusFor, eventsFor, latestFor } = useVerification();

  // Live-merged findings. When a requirement was verified in an interview we
  // override the status AND carry the interview evidence/reason, so the coverage
  // row reflects how it was actually established.
  const merged = useMemo(
    () =>
      findings.map((f) => {
        const status = statusFor(candidate.id, f.requirementId, f.status);
        if (status === f.status) return f;
        const ev = latestFor(candidate.id, f.requirementId);
        const extra =
          ev?.evidenceQuote != null
            ? [
                {
                  quote: ev.evidenceQuote,
                  sourceDoc: "interview note",
                  locationHint: ev.evidenceSource,
                  verified: true,
                },
              ]
            : [];
        return {
          ...f,
          status,
          reason: ev?.reason ?? f.reason,
          evidence: [...f.evidence, ...extra],
        };
      }),
    [findings, statusFor, latestFor, candidate.id],
  );

  const summary = summariseCoverage(merged, requirements);
  const open = needsValidation(merged);
  const requirementById = useMemo(
    () => new Map(requirements.map((r) => [r.id, r])),
    [requirements],
  );
  const questionByReq = useMemo(
    () => new Map(questions.map((q) => [q.requirementId, q])),
    [questions],
  );

  const firstOpenId =
    merged.find((f) => f.status === "unverified" || f.status === "absent")
      ?.requirementId ??
    requirements[0]?.id ??
    "";

  const [focusReqId, setFocusReqId] = useState<string>(firstOpenId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openAgent(reqId?: string) {
    if (reqId) setFocusReqId(reqId);
    setDrawerOpen(true);
  }

  const events = eventsFor(candidate.id);
  const verifiedOutcomes = events
    .filter((e) => e.outcome === "verified")
    .map((e) => ({ requirementId: e.requirementId, newStatus: e.newStatus }));

  return (
    <>
      {/* ── Top row: profile · coverage · decision ── */}
      <div className="grid gap-4 lg:grid-cols-3">
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
                {candidate.yearsExperience === 0
                  ? "under a year of experience"
                  : `${candidate.yearsExperience} years experience`}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2">
            <FileText className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {candidate.sourceDoc}
            </span>
          </div>
          <div className="mt-3">
            <Eyebrow tone="brand" className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden />
              AI summary
            </Eyebrow>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
              {candidate.aiSummary}
            </p>
          </div>
        </Panel>

        <Panel className="p-5">
          <Eyebrow>Evidence breakdown</Eyebrow>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Donut
              segments={coverageSegments(summary)}
              centerTop="Evidenced"
              centerMain={`${summary.met}/${summary.total}`}
              centerSub="all requirements"
              size={140}
              thickness={14}
            />
            <CoverageLegend summary={summary} className="min-w-[150px] flex-1" />
          </div>
        </Panel>

        <DecisionHero
          candidateName={candidate.name}
          summary={summary}
          openCount={open.length}
        />
      </div>

      {/* ── Open requirements — the reason to interview ── */}
      {open.length > 0 && (
        <section className="mt-4 overflow-hidden rounded-3xl border-2 border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)] card-lift">
          <div className="flex flex-wrap items-start gap-3 px-5 pt-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f59e0b] text-white">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-[var(--color-unverified)]">
                {open.length} requirement{open.length === 1 ? "" : "s"} still
                need validation
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground/75">
                Related text exists, but nothing that establishes the
                requirement. Take one to HireFlow AI to close it with an
                interview answer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAgent(open[0].requirementId)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              <HireFlowGlyph size={14} />
              Ask HireFlow AI
            </button>
          </div>

          <div className="space-y-2.5 p-5">
            {open.map((f) => {
              const r = requirementById.get(f.requirementId);
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
                    <button
                      type="button"
                      onClick={() => openAgent(f.requirementId)}
                      className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-accent"
                    >
                      <HireFlowGlyph size={12} />
                      Validate with AI
                    </button>
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
                      <p className="mt-1.5 text-sm font-medium">{q.question}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Requirement coverage ── */}
      <Panel className="mt-4">
        <PanelHead
          title="Requirement coverage"
          subtitle="Open any row to see the exact source text behind the verdict"
          right={
            <span className="text-xs text-muted-foreground">
              {merged.length} findings
            </span>
          }
        />
        <div className="space-y-2.5 p-5">
          {merged.map((f) => {
            const r = requirementById.get(f.requirementId);
            if (!r) return null;
            return (
              <FindingRow
                key={f.id}
                requirement={r}
                finding={f}
                question={questionByReq.get(f.requirementId)}
                defaultOpen={f.status === "unverified"}
              />
            );
          })}
        </div>
      </Panel>

      {/* ── Evaluation report — Resume column stays the original screening ── */}
      <div className="mt-4">
        <EvaluationReport
          requirements={requirements}
          findings={findings}
          interviews={verifiedOutcomes}
        />
      </div>

      {/* ── Verification audit ── */}
      {events.length > 0 && (
        <Panel className="mt-4 p-5">
          <Eyebrow className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verification audit
          </Eyebrow>
          <ol className="mt-3 space-y-3">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-start gap-x-3 gap-y-1 border-l-2 border-border pl-3 text-sm"
              >
                <span className="flex items-center gap-1.5">
                  <IdTag>{e.requirementId}</IdTag>
                  <StatusBadge status={e.priorStatus} />
                  <span className="text-muted-foreground">→</span>
                  <StatusBadge status={e.newStatus} />
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.outcome === "verified"
                    ? "Verified by HireFlow AI"
                    : "Answer insufficient"}{" "}
                  ·{" "}
                  {new Date(e.at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="w-full text-xs leading-relaxed text-foreground/75">
                  {e.reason}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {/* ── Floating trigger, always reachable ── */}
      {!drawerOpen && (
        <button
          type="button"
          onClick={() => openAgent()}
          className="fixed right-5 bottom-5 z-30 inline-flex items-center gap-2 rounded-full brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
          <HireFlowGlyph size={16} />
          Ask HireFlow AI
        </button>
      )}

      <AiAgentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        candidate={candidate}
        jobTitle={jobTitle}
        requirements={requirements}
        findings={merged}
        questions={questions}
        recordedAnswers={recordedAnswers}
        focusReqId={focusReqId}
        onFocus={setFocusReqId}
      />
    </>
  );
}
