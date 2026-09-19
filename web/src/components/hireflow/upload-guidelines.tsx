"use client";

import {
  BadgeCheck,
  Braces,
  Briefcase,
  FileText,
  Info,
  Table2,
  TriangleAlert,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Input guidelines shown near the upload controls.
 *
 * This is product instruction, not a demo walkthrough: it tells a recruiter what
 * to provide for the best screening. Formats are reported honestly — this build's
 * ingestion works on text-based documents; PDF/DOCX extraction and structured
 * bulk import are described as part of the production pipeline rather than
 * claimed as working here.
 */

function Fmt({ children, muted = false }: { children: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
        muted
          ? "border border-dashed border-border text-muted-foreground"
          : "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="grid size-6 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-3.5" aria-hidden />
        </span>
        {title}
      </h3>
      <div className="mt-2 space-y-2 pl-8 text-[13px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function UploadGuidelines({
  className,
  children,
}: {
  className?: string;
  /** Custom trigger content. When given, `className` fully styles the trigger. */
  children?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className={
          children
            ? className
            : cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
                className,
              )
        }
      >
        {children ?? (
          <>
            <Info className="size-3.5" aria-hidden />
            Supported formats &amp; best practices
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-popover p-5">
          <DialogTitle className="text-lg">
            What to upload for the best results
          </DialogTitle>
          <DialogDescription>
            HireFlow evaluates candidates against the requirements it can read
            from your documents. The clearer the input, the stronger the
            evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-5">
          <Section icon={Briefcase} title="Job description">
            <p className="flex flex-wrap items-center gap-1.5">
              Accepted now: <Fmt>TXT</Fmt> <Fmt>MD</Fmt>
              <span className="text-foreground/40">·</span>
              production: <Fmt muted>PDF</Fmt> <Fmt muted>DOCX</Fmt>
            </p>
            <p>
              Best results come from a full JD with clearly separated sections:
              job title, responsibilities, required qualifications, required and
              preferred skills, experience, education, and certifications.
            </p>
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-foreground/70">
              Upload a complete description with explicit{" "}
              <span className="font-semibold">required vs. preferred</span>{" "}
              qualifications rather than a short title — HireFlow turns each line
              into an addressable requirement.
            </p>
          </Section>

          <Section icon={Users} title="Candidate resumes">
            <p className="flex flex-wrap items-center gap-1.5">
              Accepted now: <Fmt>TXT</Fmt> <Fmt>MD</Fmt>
              <span className="text-foreground/40">·</span>
              production: <Fmt muted>PDF</Fmt> <Fmt muted>DOCX</Fmt>
            </p>
            <p>
              Include name, contact details, a professional summary, work
              experience with dates/durations, skills, projects, education,
              certifications, and portfolio/GitHub/LinkedIn where applicable.
            </p>
            <p>One candidate per file unless a structured import is used.</p>
          </Section>

          <Section icon={Table2} title="Bulk / structured import">
            <p className="flex flex-wrap items-center gap-1.5">
              Production pipeline: <Fmt muted>CSV</Fmt> <Fmt muted>JSON</Fmt>{" "}
              <Fmt muted>XLSX</Fmt>
            </p>
            <p>Expected columns for a structured candidate file:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
              {`candidate_id, candidate_name, job_role, skills,
experience, projects, education, certifications,
portfolio_url, resume_file`}
            </pre>
            <p className="flex items-start gap-1.5 text-xs">
              <Braces className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Keep candidate identifiers consistent across rows so evidence and
              interview state stay attached to the right person.
            </p>
          </Section>

          <Section icon={BadgeCheck} title="Upload quality">
            <ul className="space-y-1">
              {[
                "Use text-readable PDFs, not scanned image-only documents.",
                "Avoid password-protected or corrupted files.",
                "One candidate per resume unless the importer supports otherwise.",
                "Keep candidate identifiers consistent in structured files.",
                "Use descriptive filenames.",
                "Do not leave required fields completely empty.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <BadgeCheck
                    className="mt-0.5 size-3.5 shrink-0 text-[var(--color-met)]"
                    aria-hidden
                  />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>

          <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            <TriangleAlert
              className="mt-0.5 size-3.5 shrink-0 text-[var(--color-unverified)]"
              aria-hidden
            />
            <span>
              This build reads text-based documents directly. PDF/DOCX
              extraction and structured bulk import are handled by the
              production ingestion pipeline.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
