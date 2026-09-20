"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  Grid3x3,
  LayoutGrid,
  Link2,
  ListChecks,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { findings, generatedAt, job } from "@/lib/data";
import {
  useVerification,
  VerificationProvider,
} from "@/lib/verification-store";
import { HireFlowGlyph } from "./logo";

const RAIL = [
  { href: "/", label: "Intake", icon: LayoutGrid },
  { href: "/requirements", label: "Requirements", icon: ListChecks },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/matrix", label: "Evidence matrix", icon: Grid3x3 },
  { href: "/activity", label: "Agent activity", icon: Activity },
];

const ORG_INITIALS = job.company
  .split(" ")
  .map((w) => w[0])
  .slice(0, 2)
  .join("");

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Application chrome.
 *
 * The reference design's header carried decorative controls; here every control
 * does something real. The bell reports the actual number of requirements
 * awaiting human validation, and Share copies a working link. Model provenance
 * lives in the footer next to the run timestamp, where it belongs — the agent
 * panel reports the model actually answering, so the header stays uncluttered.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const current = RAIL.find((r) => isActive(pathname, r.href));

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <VerificationProvider>
    <div className="h-dvh overflow-hidden p-3 sm:p-5 lg:p-7">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[28px] border border-white/70 bg-card app-panel">
        {/* ── Icon rail ── */}
        <nav
          aria-label="Main"
          className="hidden w-[76px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border bg-card py-5 sm:flex"
        >
          <Link
            href="/"
            aria-label="HireFlow home"
            className="grid size-11 place-items-center rounded-2xl brand-gradient text-white shadow-sm"
          >
            <HireFlowGlyph size={22} />
          </Link>

          <div className="mt-4 flex flex-col gap-2">
            {RAIL.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "grid size-11 place-items-center rounded-2xl transition-colors",
                    active
                      ? "bg-[var(--color-violet)] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </Link>
              );
            })}
          </div>

          {/* Rail footer: the hiring org this workspace belongs to */}
          <div className="mt-auto flex flex-col items-center gap-3">
            <span
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
              title="Screening run complete"
            >
              <span className="size-1.5 rounded-full bg-[var(--color-met)]" />
            </span>
            <span
              className="grid size-9 place-items-center rounded-2xl bg-secondary text-[11px] font-bold text-secondary-foreground"
              title={job.company}
            >
              {ORG_INITIALS}
            </span>
          </div>
        </nav>

        {/* ── Main column ── */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="text-muted-foreground">HireFlow</span>
              <span className="text-border" aria-hidden>
                /
              </span>
              <span className="truncate font-semibold">
                {current?.label ?? "Screening"}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-accent"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-[var(--color-met)]" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Link2 className="size-3.5" aria-hidden />
                    Share
                  </>
                )}
              </button>

              <OpenCountBell />

              <span className="flex items-center gap-2 rounded-full border border-border py-1 pr-1 pl-3">
                <span className="hidden text-xs font-medium sm:inline">
                  {job.company}
                </span>
                <span className="grid size-7 place-items-center rounded-full brand-gradient text-[10px] font-bold text-white">
                  {ORG_INITIALS}
                </span>
              </span>
            </div>
          </header>

          {/* Mobile rail */}
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-4 py-2 sm:hidden">
            {RAIL.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-[var(--color-violet)] text-white"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* `relative` matters: screen-reader-only spans inside page content are
              absolutely positioned, and without a positioned ancestor their
              containing block is the initial one — which lets them extend the
              document and make the whole shell scroll. */}
          <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/35 p-4 sm:p-6">
            {children}
          </main>

          {/* Provenance footer */}
          <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-card px-4 py-3 text-[11px] text-muted-foreground sm:px-6">
            <span className="flex items-center gap-1.5 font-semibold text-foreground/70">
              <HireFlowGlyph size={13} className="text-primary" />
              HireFlow
            </span>
            <span>Evidence-backed candidate screening</span>
            <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
              {generatedAt && (
                <span>
                  run{" "}
                  {new Date(generatedAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
              <span>synthetic candidate data</span>
            </span>
          </footer>
        </div>
      </div>
    </div>
    </VerificationProvider>
  );
}

/**
 * Header alert counter — live.
 *
 * Reports the number of requirements still awaiting human validation across the
 * pool, subtracting any that have since been verified live in an interview.
 */
function OpenCountBell() {
  const { isVerifiedLive } = useVerification();
  const open = findings.filter(
    (f) =>
      (f.status === "unverified" || f.status === "absent") &&
      !isVerifiedLive(f.candidateId, f.requirementId),
  ).length;

  return (
    <Link
      href="/candidates"
      title={`${open} requirements need validation`}
      className="relative grid size-9 place-items-center rounded-full border border-border transition-colors hover:bg-accent"
    >
      <AlertTriangle className="size-4 text-foreground/70" aria-hidden />
      {open > 0 && (
        <span className="absolute -top-1.5 -right-1.5 grid min-w-4.5 place-items-center rounded-full bg-[var(--color-unverified)] px-1 text-[10px] font-bold text-white">
          {open}
        </span>
      )}
    </Link>
  );
}

/** Page title block, used at the top of each screen's content area. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold tracking-[0.08em] text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[1.75rem] leading-tight font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
