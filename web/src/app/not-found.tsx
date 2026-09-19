import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { Panel } from "@/components/hireflow/kit";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl">
      <Panel className="p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-primary">
          <SearchX className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-mono text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          404
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Nothing to screen here
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          That page does not exist. Head back to the intake and run a screening,
          or jump straight to the candidate pool.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to intake
          </Link>
          <Link
            href="/candidates"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View candidates
          </Link>
        </div>
      </Panel>
    </div>
  );
}
