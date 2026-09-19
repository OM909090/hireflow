"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { Finding, FindingStatus } from "./types";

/**
 * Live verification store.
 *
 * The screening produces base findings (resume evidence). During an interview,
 * the AI verification step (interview-eval) can promote a requirement to `met`
 * when the recruiter records a sufficient answer. Those promotions are recorded
 * here as events and OVERLAY the base findings, so every component — coverage
 * rings, the pool stats, the matrix, the header counter, the audit trail — sees
 * the same live status without a page refresh.
 *
 * Mounted once in the app shell so state persists across client navigation.
 * Every event is scoped by candidateId + requirementId, which is what prevents
 * one candidate's interview evidence from ever affecting another's status.
 */

export interface VerificationEvent {
  id: string;
  candidateId: string;
  requirementId: string;
  priorStatus: FindingStatus;
  newStatus: FindingStatus;
  outcome: "verified" | "insufficient";
  reason: string;
  evidenceQuote?: string;
  evidenceSource: string;
  answer: string;
  followUp?: string;
  at: string;
  verifiedBy: "HireFlow AI";
}

interface VerificationContextValue {
  events: VerificationEvent[];
  record: (event: VerificationEvent) => void;
  reset: (candidateId?: string) => void;
  eventsFor: (candidateId: string) => VerificationEvent[];
  historyFor: (candidateId: string, requirementId: string) => VerificationEvent[];
  latestFor: (
    candidateId: string,
    requirementId: string,
  ) => VerificationEvent | undefined;
  statusFor: (
    candidateId: string,
    requirementId: string,
    base: FindingStatus,
  ) => FindingStatus;
  /** True if a live verification event exists for this cell. */
  isVerifiedLive: (candidateId: string, requirementId: string) => boolean;
}

const VerificationContext = createContext<VerificationContextValue | null>(null);

export function VerificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [events, setEvents] = useState<VerificationEvent[]>([]);

  const record = useCallback((event: VerificationEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const reset = useCallback((candidateId?: string) => {
    setEvents((prev) =>
      candidateId ? prev.filter((e) => e.candidateId !== candidateId) : [],
    );
  }, []);

  const value = useMemo<VerificationContextValue>(() => {
    const eventsFor = (candidateId: string) =>
      events.filter((e) => e.candidateId === candidateId);

    const historyFor = (candidateId: string, requirementId: string) =>
      events.filter(
        (e) =>
          e.candidateId === candidateId && e.requirementId === requirementId,
      );

    const latestFor = (candidateId: string, requirementId: string) => {
      let latest: VerificationEvent | undefined;
      for (const e of events) {
        if (e.candidateId === candidateId && e.requirementId === requirementId) {
          latest = e;
        }
      }
      return latest;
    };

    const statusFor = (
      candidateId: string,
      requirementId: string,
      base: FindingStatus,
    ) => {
      // Only a "verified" event overrides; an insufficient attempt never
      // downgrades or changes the resume status.
      let status = base;
      for (const e of events) {
        if (
          e.candidateId === candidateId &&
          e.requirementId === requirementId &&
          e.outcome === "verified"
        ) {
          status = e.newStatus;
        }
      }
      return status;
    };

    const isVerifiedLive = (candidateId: string, requirementId: string) =>
      events.some(
        (e) =>
          e.candidateId === candidateId &&
          e.requirementId === requirementId &&
          e.outcome === "verified",
      );

    return {
      events,
      record,
      reset,
      eventsFor,
      historyFor,
      latestFor,
      statusFor,
      isVerifiedLive,
    };
  }, [events, record, reset]);

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification(): VerificationContextValue {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error("useVerification must be used within a VerificationProvider");
  }
  return ctx;
}

/** Apply live verification to a candidate's findings, returning merged copies. */
export function useMergedFindings(
  candidateId: string,
  findings: Finding[],
): Finding[] {
  const { statusFor } = useVerification();
  return findings.map((f) => {
    const status = statusFor(candidateId, f.requirementId, f.status);
    return status === f.status ? f : { ...f, status };
  });
}
