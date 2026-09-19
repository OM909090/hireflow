import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  MinusCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FindingStatus } from "@/lib/types";

/**
 * The four-state visual vocabulary.
 *
 * Emphasis is deliberately INVERTED relative to the usual convention: `met` is
 * the quietest treatment on the page and `unverified` is the loudest. A subtle
 * grey "unverified" chip does not survive being watched on a phone, and the
 * uncertainty is the point of the product — so it gets the amber, the border
 * and the icon weight.
 */
export const STATUS_META: Record<
  FindingStatus,
  {
    label: string;
    short: string;
    icon: LucideIcon;
    chip: string;
    dot: string;
    /** Emphasis rank, 0 = loudest. Used for sorting. */
    weight: number;
  }
> = {
  unverified: {
    label: "Unverified",
    short: "Unverified",
    icon: AlertTriangle,
    chip:
      "bg-[var(--color-unverified-bg)] text-[var(--color-unverified)] border-[var(--color-unverified-border)] font-semibold",
    dot: "bg-[var(--color-unverified)]",
    weight: 0,
  },
  absent: {
    label: "No evidence found",
    short: "Absent",
    icon: CircleSlash,
    chip:
      "bg-[var(--color-absent-bg)] text-[var(--color-absent)] border-[var(--color-absent-border)] font-medium",
    dot: "bg-[var(--color-absent)]",
    weight: 1,
  },
  partial: {
    label: "Partially met",
    short: "Partial",
    icon: MinusCircle,
    chip:
      "bg-[var(--color-partial-bg)] text-[var(--color-partial)] border-[var(--color-partial-border)] font-medium",
    dot: "bg-[var(--color-partial)]",
    weight: 2,
  },
  met: {
    label: "Met",
    short: "Met",
    icon: CheckCircle2,
    chip:
      "bg-[var(--color-met-bg)] text-[var(--color-met)] border-[var(--color-met-border)] font-medium",
    dot: "bg-[var(--color-met)]",
    weight: 3,
  },
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
  long = false,
}: {
  status: FindingStatus;
  className?: string;
  showIcon?: boolean;
  long?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap",
        meta.chip,
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" aria-hidden />}
      {long ? meta.label : meta.short}
    </span>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: FindingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        STATUS_META[status].dot,
        className,
      )}
      aria-hidden
    />
  );
}
