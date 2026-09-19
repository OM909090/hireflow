"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { PageHeader } from "./app-shell";
import { CoverageBar, CoverageLegend, coverageSegments } from "./coverage";
import { Avatar, Donut, Eyebrow, HeroCard, IdTag, Panel } from "./kit";
import { StatusBadge } from "./status-badge";
import { buttonVariants } from "@/components/ui/button";
import { candidates, findingsFor, requirements } from "@/lib/data";
import {
  candidateBand,
  needsValidation,
  summariseCoverage,
} from "@/lib/types";
import type {
  CandidateBand,
  CoverageSummary,
  Finding,
} from "@/lib/types";
import { queryCandidates, type CandidateQueryChip } from "@/lib/query";
import { useVerification } from "@/lib/verification-store";
import { cn } from "@/lib/utils";

const BAND_META: Record<CandidateBand, { label: string; pill: string }> = {
  strong: {
    label: "Strong",
    pill: "bg-[var(--color-met-bg)] text-[var(--color-met)] border-[var(--color-met-border)]",
  },
  validate: {
    label: "Needs validation",
    pill: "bg-[var(--color-unverified-bg)] text-[var(--color-unverified)] border-[var(--color-unverified-border)]",
  },
  limited: {
    label: "Limited",
    pill: "bg-muted text-muted-foreground border-border",
  },
};

const EXAMPLES = [
  "Java + Spring Boot candidates with unverified Kubernetes",
  "candidates with more than 5 years",
  "who is missing Kafka",
  "verified PostgreSQL",
];

const PAGE_SIZE = 4;

const EMPTY_SUMMARY: CoverageSummary = {
  met: 0,
  partial: 0,
  unverified: 0,
  absent: 0,
  total: 0,
  hardEvidenced: 0,
  hardTotal: 0,
};

type Row = {
  id: string;
  name: string;
  headline: string;
  location: string;
  yearsExperience: number;
  aiSummary: string;
  findings: Finding[];
  summary: CoverageSummary;
  band: CandidateBand;
  open: Finding[];
  interviewed: boolean;
};

export function CandidatePool() {
  const { statusFor, eventsFor } = useVerification();

  // Live-merged findings for every candidate.
  const rows: Row[] = useMemo(() => {
    return candidates.map((c) => {
      const findings = findingsFor(c.id).map((f) => {
        const status = statusFor(c.id, f.requirementId, f.status);
        return status === f.status ? f : { ...f, status };
      });
      const summary = summariseCoverage(findings, requirements);
      return {
        id: c.id,
        name: c.name,
        headline: c.headline,
        location: c.location,
        yearsExperience: c.yearsExperience,
        aiSummary: c.aiSummary,
        findings,
        summary,
        band: candidateBand(summary),
        open: needsValidation(findings),
        interviewed: eventsFor(c.id).length > 0,
      };
    });
  }, [statusFor, eventsFor]);

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [expFilter, setExpFilter] = useState("any");
  const [bandFilter, setBandFilter] = useState("any");
  const [stateFilter, setStateFilter] = useState("any");
  const [interviewFilter, setInterviewFilter] = useState("any");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // NL query interpretation over live-merged findings.
  const nl = useMemo(() => {
    if (!query.trim()) return null;
    const allFindings = rows.flatMap((r) => r.findings);
    return queryCandidates(query, {
      candidates,
      requirements,
      findings: allFindings,
    });
  }, [query, rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (nl && nl.matchIds) {
      const set = new Set(nl.matchIds);
      list = list.filter((r) => set.has(r.id));
    }
    if (expFilter !== "any") {
      list = list.filter((r) => {
        const y = r.yearsExperience;
        if (expFilter === "0-2") return y <= 2;
        if (expFilter === "3-4") return y >= 3 && y <= 4;
        return y >= 5;
      });
    }
    if (bandFilter !== "any") list = list.filter((r) => r.band === bandFilter);
    if (stateFilter === "gaps") list = list.filter((r) => r.open.length > 0);
    if (stateFilter === "allmusthaves")
      list = list.filter(
        (r) => r.summary.hardEvidenced === r.summary.hardTotal,
      );
    if (interviewFilter === "notstarted")
      list = list.filter((r) => !r.interviewed);
    if (interviewFilter === "inprogress")
      list = list.filter((r) => r.interviewed);

    return [...list].sort(
      (a, b) => b.summary.hardEvidenced - a.summary.hardEvidenced,
    );
  }, [rows, nl, expFilter, bandFilter, stateFilter, interviewFilter]);

  // Reset to first page whenever the result set changes size.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const poolSummary = filtered.reduce<CoverageSummary>(
    (acc, r) => ({
      met: acc.met + r.summary.met,
      partial: acc.partial + r.summary.partial,
      unverified: acc.unverified + r.summary.unverified,
      absent: acc.absent + r.summary.absent,
      total: acc.total + r.summary.total,
      hardEvidenced: acc.hardEvidenced + r.summary.hardEvidenced,
      hardTotal: acc.hardTotal + r.summary.hardTotal,
    }),
    { ...EMPTY_SUMMARY },
  );
  const totalOpen = filtered.reduce((n, r) => n + r.open.length, 0);

  const hasFilters =
    query.trim() !== "" ||
    expFilter !== "any" ||
    bandFilter !== "any" ||
    stateFilter !== "any" ||
    interviewFilter !== "any";

  function submitQuery(q: string) {
    setQueryInput(q);
    setQuery(q);
    setPage(0);
  }

  function clearAll() {
    setQuery("");
    setQueryInput("");
    setExpFilter("any");
    setBandFilter("any");
    setStateFilter("any");
    setInterviewFilter("any");
    setPage(0);
  }

  function toggleSelected(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Compare only what the current view actually contains, so the count in the
  // bar always matches the checkboxes on screen and nothing hidden sneaks in.
  const visibleIds = new Set(filtered.map((r) => r.id));
  const selectedVisible = selected.filter((id) => visibleIds.has(id));
  const hiddenSelected = selected.length - selectedVisible.length;
  const selectedRows = filtered.filter((r) => selectedVisible.includes(r.id));

  return (
    <>
      <PageHeader
        eyebrow="Step 3 — Candidates"
        title="Candidate pool"
        subtitle={`${candidates.length} candidates screened against ${requirements.length} requirements. Search in plain language, filter, and compare — every status is live evidence, you decide.`}
      />

      {/* NL query */}
      <Panel className="p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuery(queryInput);
          }}
          className="flex items-center gap-2"
        >
          <Search
            className="ml-3 size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask about candidates… e.g. Java + Spring Boot with unverified Kubernetes"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search candidates in plain language"
          />
          {query && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
              aria-label="Clear query"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>
      </Panel>

      {/* Examples / interpretation */}
      {nl ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {nl.understood ? (
            <>
              <span className="text-xs text-muted-foreground">
                Interpreted as:
              </span>
              {nl.chips.map((c: CandidateQueryChip) => (
                <span
                  key={`${c.label}-${c.value}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                >
                  <span className="font-semibold">{c.label}:</span>
                  {c.value}
                </span>
              ))}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-unverified-border)] bg-[var(--color-unverified-bg)] px-2.5 py-1 text-xs font-medium text-[var(--color-unverified)]">
              <AlertTriangle className="size-3.5" aria-hidden />
              Couldn&apos;t interpret this query
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} match{filtered.length === 1 ? "" : "es"}
          </span>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submitQuery(q)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterSelect
          value={expFilter}
          onChange={(v) => {
            setExpFilter(v);
            setPage(0);
          }}
          label="Filter by experience"
          options={[
            ["any", "Any experience"],
            ["0-2", "0–2 years"],
            ["3-4", "3–4 years"],
            ["5+", "5+ years"],
          ]}
        />
        <FilterSelect
          value={bandFilter}
          onChange={(v) => {
            setBandFilter(v);
            setPage(0);
          }}
          label="Filter by evidence band"
          options={[
            ["any", "Any band"],
            ["strong", "Strong"],
            ["validate", "Needs validation"],
            ["limited", "Limited"],
          ]}
        />
        <FilterSelect
          value={stateFilter}
          onChange={(v) => {
            setStateFilter(v);
            setPage(0);
          }}
          label="Filter by coverage"
          options={[
            ["any", "Any coverage"],
            ["gaps", "Has open gaps"],
            ["allmusthaves", "All must-haves evidenced"],
          ]}
        />
        <FilterSelect
          value={interviewFilter}
          onChange={(v) => {
            setInterviewFilter(v);
            setPage(0);
          }}
          label="Filter by interview status"
          options={[
            ["any", "Any interview status"],
            ["notstarted", "Not interviewed"],
            ["inprogress", "Interviewed"],
          ]}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            <X className="size-3.5" aria-hidden />
            Clear
          </button>
        )}
      </div>

      {/* Pool summary */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <HeroCard
          className="lg:col-span-1"
          label="Needs human validation"
          value={totalOpen}
          caption={`across ${filtered.filter((r) => r.open.length > 0).length} of ${filtered.length} candidates`}
          note="Requirements the resume left unproven — either related text that stops short, or no evidence at all. Validate them with HireFlow AI."
        />
        <Panel className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              segments={coverageSegments(poolSummary)}
              centerTop="Findings"
              centerMain={poolSummary.total}
              centerSub={
                hasFilters ? "in current view" : "across the pool"
              }
              size={150}
              thickness={15}
            />
            <div className="min-w-[180px] flex-1">
              <Eyebrow>Coverage breakdown</Eyebrow>
              <CoverageLegend summary={poolSummary} className="mt-3" />
            </div>
          </div>
        </Panel>
      </div>

      {/* Comparison */}
      {selectedVisible.length >= 2 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-accent/60 px-4 py-2.5">
          <GitCompare className="size-4 text-primary" aria-hidden />
          <span className="text-sm font-medium">
            {selectedVisible.length} selected
          </span>
          {hiddenSelected > 0 && (
            <span className="text-xs text-muted-foreground">
              ({hiddenSelected} more hidden by the current filters)
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowCompare((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
          >
            {showCompare ? "Hide comparison" : "Compare selected"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelected([]);
              setShowCompare(false);
            }}
            className="rounded-full border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card"
          >
            Clear selection
          </button>
        </div>
      )}

      {showCompare && selectedRows.length >= 2 && (
        <ComparisonTable rows={selectedRows} />
      )}

      {/* Results */}
      {pageRows.length === 0 ? (
        <Panel className="mt-4 p-10 text-center">
          <p className="text-sm font-medium">No candidates match</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {nl && !nl.understood
              ? "That query could not be interpreted. Try a skill, a requirement state (verified / unverified), an experience range, or a candidate name."
              : "Every active constraint has to hold at once. Loosen one, or reset below."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              <X className="size-3.5" aria-hidden />
              Clear search and filters
            </button>
          )}
        </Panel>
      ) : (
        <div className="mt-4 space-y-4">
          {pageRows.map((r) => (
            <CandidateCard
              key={r.id}
              row={r}
              selected={selected.includes(r.id)}
              onToggle={() => toggleSelected(r.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-current={i === safePage ? "page" : undefined}
                className={cn(
                  "grid size-8 place-items-center rounded-full text-xs font-semibold transition-colors",
                  i === safePage
                    ? "bg-[var(--color-violet)] text-white"
                    : "border border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function CandidateCard({
  row,
  selected,
  onToggle,
}: {
  row: Row;
  selected: boolean;
  onToggle: () => void;
}) {
  const meta = BAND_META[row.band];

  return (
    <Panel className={cn("overflow-hidden", selected && "ring-2 ring-primary/40")}>
      <div className="flex flex-wrap items-start gap-4 p-5">
        <label className="flex cursor-pointer items-center pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="size-4 accent-[var(--color-violet)]"
            aria-label={`Select ${row.name} to compare`}
          />
        </label>
        <Avatar name={row.name} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{row.name}</h3>
            <IdTag>{row.id}</IdTag>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                meta.pill,
              )}
            >
              {meta.label}
            </span>
            {row.interviewed && (
              <span className="rounded-full bg-[var(--color-met-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-met)]">
                interviewed
              </span>
            )}
            {row.open.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-unverified-bg)] px-2.5 py-1 text-xs font-bold text-[var(--color-unverified)]">
                <AlertTriangle className="size-3.5" aria-hidden />
                {row.open.length} to validate
              </span>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>{row.headline}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {row.location}
            </span>
            <span aria-hidden>·</span>
            <span>{row.yearsExperience} yrs</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {row.summary.hardEvidenced}
              <span className="text-muted-foreground">
                /{row.summary.hardTotal}
              </span>
            </span>
            <span className="text-xs leading-tight text-muted-foreground">
              must-have requirements
              <br />
              with located evidence
            </span>
          </div>
          <CoverageBar summary={row.summary} className="mt-3 max-w-md" />
        </div>

        <Link
          href={`/candidates/${row.id}`}
          className={buttonVariants({ size: "lg", className: "shrink-0" })}
        >
          View evidence
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>

      {/* Always shown — the summary matters most for the weakest candidates. */}
      {row.aiSummary && (
        <div className="border-t border-border bg-muted/40 px-5 py-3">
          <div className="flex items-start gap-2">
            <Sparkles
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-hidden
            />
            <span className="text-[13px] leading-relaxed text-foreground/85">
              {row.aiSummary}
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ComparisonTable({ rows }: { rows: Row[] }) {
  const statusByReq = (row: Row) =>
    new Map(row.findings.map((f) => [f.requirementId, f.status]));
  const maps = rows.map((r) => ({ row: r, m: statusByReq(r) }));

  return (
    <Panel className="mt-4 overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <GitCompare className="size-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold">Side-by-side comparison</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          evidence &amp; verification state — not a score
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[240px] border-b border-border bg-card p-3 text-left">
                <Eyebrow>Requirement</Eyebrow>
              </th>
              {maps.map(({ row }) => (
                <th
                  key={row.id}
                  className="border-b border-l border-border bg-card p-3 text-center"
                >
                  <span className="text-xs font-semibold">
                    {row.name.split(" ")[0]}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                    {row.summary.hardEvidenced}/{row.summary.hardTotal}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.id} className="group">
                <th className="sticky left-0 z-10 border-b border-border bg-card p-3 text-left align-top group-hover:bg-muted/40">
                  <div className="flex items-center gap-1.5">
                    <IdTag>{r.id}</IdTag>
                    {r.kind === "soft" && (
                      <span className="rounded border border-border px-1 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                        nice
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-[220px] text-[13px] font-medium">
                    {r.text}
                  </p>
                </th>
                {maps.map(({ row, m }) => (
                  <td
                    key={row.id}
                    className="border-b border-l border-border p-2 text-center group-hover:bg-muted/40"
                  >
                    <StatusBadge status={m.get(r.id) ?? "absent"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
