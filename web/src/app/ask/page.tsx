"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CornerDownLeft,
  Search,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/hireflow/app-shell";
import { Avatar, IdTag, Panel } from "@/components/hireflow/kit";
import { StatusBadge } from "@/components/hireflow/status-badge";
import { candidates, findings, requirements } from "@/lib/data";
import { EXAMPLE_QUERIES, runQuery } from "@/lib/query";

export default function AskPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const result = useMemo(() => {
    if (!query.trim()) return null;
    return runQuery(query, { candidates, requirements, findings });
  }, [query]);

  function submit(q: string) {
    setInput(q);
    setQuery(q);
  }

  return (
    <>
      <PageHeader
        eyebrow="Ask the pool"
        title="Query candidates in plain language"
        subtitle="Ask about the pool and get answers grounded in the same verified evidence as the rest of HireFlow. Nothing here is generated — every result points back to a located quote or a flagged gap."
      />

      {/* Search */}
      <Panel className="p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2"
        >
          <Search className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. who lacks Kubernetes evidence?"
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="Ask a question about the candidate pool"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Ask
            <CornerDownLeft className="size-3.5" aria-hidden />
          </button>
        </form>
      </Panel>

      {/* Example chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => submit(q)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-5">
          <div className="mb-3 flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p className="text-sm font-medium">{result.summary}</p>
          </div>

          {result.kind === "ranking" && (
            <div className="space-y-2">
              {result.ranking.map((r, i) => (
                <Panel key={r.candidate.id} className="flex items-center gap-4 p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent font-mono text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                  <Avatar name={r.candidate.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {r.candidate.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.candidate.headline}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {r.summary.hardEvidenced}
                      <span className="text-muted-foreground">
                        /{r.summary.hardTotal}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      must-haves evidenced
                    </p>
                  </div>
                  <Link
                    href={`/candidates/${r.candidate.id}`}
                    className="shrink-0 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label={`View ${r.candidate.name}`}
                  >
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </Panel>
              ))}
            </div>
          )}

          {result.kind === "findings" && (
            <div className="space-y-2">
              {result.rows.map(({ candidate, requirement, finding }) => {
                const ev = finding.evidence.find((e) => e.verified);
                return (
                  <Panel key={finding.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Avatar name={candidate.name} size="sm" />
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {candidate.name}
                      </Link>
                      <span className="text-muted-foreground">·</span>
                      <IdTag>{requirement.id}</IdTag>
                      <span className="text-sm text-foreground/80">
                        {requirement.text}
                      </span>
                      <StatusBadge status={finding.status} className="ml-auto" />
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {finding.reason}
                    </p>

                    {ev ? (
                      <div className="mt-2.5">
                        <blockquote className="evidence-quote rounded-lg border-l-2 border-[var(--color-met-border)] bg-muted/60 py-1.5 pr-3 pl-3 text-foreground/85">
                          {ev.quote}
                        </blockquote>
                        <p className="mt-1 flex items-center gap-1 pl-3 text-[11px] text-[var(--color-met)]">
                          <BadgeCheck className="size-3.5" aria-hidden />
                          located in {ev.sourceDoc}
                        </p>
                      </div>
                    ) : finding.missingDetail ? (
                      <p className="mt-2 rounded-lg bg-[var(--color-unverified-bg)] px-3 py-2 text-xs text-[var(--color-unverified)]">
                        <span className="font-semibold">Missing: </span>
                        {finding.missingDetail}
                      </p>
                    ) : null}
                  </Panel>
                );
              })}
            </div>
          )}

          {result.kind === "empty" && (
            <Panel className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing matched. Try one of the suggestions above, or ask about a
                specific skill, requirement, or status.
              </p>
            </Panel>
          )}
        </div>
      )}

      {!result && (
        <Panel className="mt-5 p-8 text-center">
          <Search className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <p className="mt-2 text-sm text-muted-foreground">
            Ask a question, or pick a suggestion. Results come straight from the
            verified findings — grounded, never generated.
          </p>
        </Panel>
      )}
    </>
  );
}
