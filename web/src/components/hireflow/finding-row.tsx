"use client";

import { useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  FileText,
  HelpCircle,
  MessageSquareQuote,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Finding, InterviewQuestion, Requirement } from "@/lib/types";
import { StatusBadge } from "./status-badge";

/**
 * One requirement × candidate row, with the [Why?] disclosure.
 *
 * This component is the product. Everything it renders obeys one rule: a claim
 * is either backed by a quote our verifier located in the source document, or it
 * is visibly marked as not established. Nothing is asserted without provenance.
 */
export function FindingRow({
  requirement,
  finding,
  question,
  defaultOpen = false,
}: {
  requirement: Requirement;
  finding: Finding;
  question?: InterviewQuestion;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const needsHuman =
    finding.status === "unverified" || finding.status === "absent";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-colors",
        needsHuman
          ? "border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)]/50"
          : "border-border",
      )}
    >
      {/* ── Collapsed header ── */}
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 rounded-lg bg-secondary px-2 py-1 font-mono text-[11px] font-semibold tracking-tight text-secondary-foreground">
          {requirement.id}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {requirement.text}
            </p>
            {requirement.kind === "soft" && (
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                nice to have
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {finding.reason}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={finding.status} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            <HelpCircle className="size-3.5" aria-hidden />
            Why?
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* ── Expanded: the audit trail ── */}
      {open && (
        <div className="space-y-4 border-t border-border/70 px-4 pt-4 pb-4">
          {/* What the JD actually asked for */}
          <Block
            icon={FileText}
            label="Requirement source"
            meta={requirement.id}
          >
            <Quote text={requirement.sourceQuote} />
            <SourceLine doc="job description" hint="Requirements" verified />
          </Block>

          {/* What we located in the resume */}
          {finding.evidence.length > 0 ? (
            <Block
              icon={MessageSquareQuote}
              label={
                finding.evidence.length === 1
                  ? "Evidence located in resume"
                  : `Evidence located in resume (${finding.evidence.length})`
              }
            >
              <div className="space-y-3">
                {finding.evidence.map((e, i) => (
                  <div key={i}>
                    <Quote text={e.quote} />
                    <SourceLine
                      doc={e.sourceDoc}
                      hint={e.locationHint}
                      verified={e.verified}
                    />
                  </div>
                ))}
              </div>
            </Block>
          ) : (
            <Block icon={MessageSquareQuote} label="Evidence located in resume">
              <p className="text-sm text-muted-foreground italic">
                No supporting text was found in {finding.evidence.length === 0 && "the source document"}.
              </p>
            </Block>
          )}

          {/* The gap, stated plainly */}
          {finding.missingDetail && (
            <div className="rounded-2xl border border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--color-unverified)] uppercase">
                <ShieldAlert className="size-3.5" aria-hidden />
                Not established by the document
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {finding.missingDetail}
              </p>
            </div>
          )}

          {/* Uncertainty converted into a human action */}
          {question && (
            <div className="rounded-2xl bg-accent p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
                <Sparkles className="size-3.5" aria-hidden />
                Ask this in the interview
              </div>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {question.question}
              </p>
              {question.followUp && (
                <div className="mt-2.5 border-l-2 border-primary/30 pl-3">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    If the answer is still unclear
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">
                    {question.followUp}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Provenance footer */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-mono">{finding.id}</span>
            <span>
              confidence {(finding.confidence * 100).toFixed(0)}%
            </span>
            <span>model {finding.model}</span>
            <span>
              {new Date(finding.generatedAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────────── */

function Block({
  icon: Icon,
  label,
  meta,
  children,
}: {
  icon: typeof FileText;
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden />
        {label}
        {meta && <span className="font-mono normal-case">· {meta}</span>}
      </div>
      {children}
    </div>
  );
}

/** Verbatim source text. Monospace signals "quoted, not generated". */
function Quote({ text }: { text: string }) {
  return (
    <blockquote className="evidence-quote rounded-md border-l-2 border-border bg-muted/70 py-2 pr-3 pl-3 text-foreground/90">
      {text}
    </blockquote>
  );
}

function SourceLine({
  doc,
  hint,
  verified,
}: {
  doc: string;
  hint: string;
  verified: boolean;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-3 text-[11px] text-muted-foreground">
      <span className="font-mono">{doc}</span>
      <span aria-hidden>·</span>
      <span>{hint}</span>
      {verified && (
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-met)]">
          <BadgeCheck className="size-3.5" aria-hidden />
          quote located in source
        </span>
      )}
    </div>
  );
}
