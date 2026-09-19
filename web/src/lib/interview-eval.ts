import type { FindingStatus, Requirement } from "./types";

/**
 * Deterministic interview-answer evaluator (the "HireFlow AI" verification step).
 *
 * This is real analysis, not a model call and not a hardcoded per-candidate
 * result. It works because verification here is a well-defined judgement:
 *
 *   1. Identify what the requirement is about (its topic).
 *   2. Look in the recruiter's recorded answer for concrete evidence signals of
 *      that topic AND first-hand ownership ("I deployed", "production", "on-call").
 *   3. Decide sufficiency by rule, and ground the verdict in a quote taken from
 *      the answer itself.
 *
 * A vague "yeah, I've used it a bit" never verifies; a specific, first-hand
 * answer does. Same philosophy as the resume verifier: the model/agent never
 * gets the final say on truth — deterministic code does.
 */

export interface AnswerEvaluation {
  outcome: "verified" | "insufficient";
  /** "met" when verified; otherwise the prior status is preserved. */
  newStatus: FindingStatus;
  reason: string;
  /** A grounded quote lifted from the answer, when verified. */
  evidenceQuote?: string;
  evidenceSource: string;
  followUp?: string;
  topicLabel: string;
  matchedSignals: string[];
  depthCues: string[];
}

interface Topic {
  id: string;
  label: string;
  /** If any of these appears in the requirement text, the requirement is this topic. */
  match: string[];
  /** Concrete evidence words we look for in an answer. */
  signals: string[];
}

/** Ordered by priority — the first topic whose `match` hits the requirement wins. */
const TOPICS: Topic[] = [
  {
    id: "kubernetes",
    label: "production Kubernetes experience",
    match: ["kubernetes", "k8s"],
    signals: [
      "kubernetes", "k8s", "eks", "gke", "aks", "kubectl", "helm", "pod",
      "pods", "deployment", "deployments", "rolling", "probe", "probes",
      "liveness", "readiness", "namespace", "cluster", "node", "autoscaling",
      "ingress", "manifest", "helm chart",
    ],
  },
  {
    id: "kafka",
    label: "Kafka / event-streaming experience",
    match: ["kafka", "event-streaming", "event streaming"],
    signals: [
      "kafka", "topic", "topics", "partition", "partitions", "consumer",
      "producer", "broker", "brokers", "offset", "offsets", "stream",
      "streaming", "zookeeper", "kstream", "consumer group", "exactly-once",
      "throughput", "idempotent",
    ],
  },
  {
    id: "aws",
    label: "AWS experience",
    match: ["aws", "amazon web"],
    signals: [
      "aws", "ec2", "s3", "lambda", "eks", "ecs", "rds", "cloudwatch", "iam",
      "vpc", "dynamodb", "sqs", "sns", "fargate", "cloudformation", "route 53",
    ],
  },
  {
    id: "cicd",
    label: "CI/CD pipeline experience",
    match: ["ci/cd", "ci cd", "cicd", "pipeline", "continuous integration", "continuous delivery"],
    signals: [
      "ci", "cd", "pipeline", "pipelines", "jenkins", "github actions",
      "gitlab ci", "circleci", "argocd", "build", "deploy", "artifact",
      "artifacts", "stage", "stages", "runner",
    ],
  },
  {
    id: "springboot",
    label: "production Spring Boot experience",
    match: ["spring boot"],
    signals: [
      "spring boot", "spring", "bean", "beans", "controller", "jpa",
      "hibernate", "actuator", "microservice", "microservices",
      "dependency injection", "autowire", "rest controller",
    ],
  },
  {
    id: "postgres",
    label: "PostgreSQL experience",
    match: ["postgres", "postgresql"],
    signals: [
      "postgres", "postgresql", "index", "indexes", "indexing", "query",
      "queries", "schema", "migration", "migrations", "join", "joins",
      "optimize", "optimise", "optimized", "optimised", "explain", "partition",
      "transaction", "normalization",
    ],
  },
  {
    id: "docker",
    label: "Docker experience",
    match: ["docker", "container"],
    signals: [
      "docker", "dockerfile", "image", "images", "container", "containers",
      "compose", "registry", "multi-stage", "volume", "volumes",
    ],
  },
  {
    id: "rest",
    label: "REST API experience",
    match: ["rest", "api"],
    signals: [
      "rest", "api", "apis", "endpoint", "endpoints", "http", "json",
      "openapi", "swagger", "status code", "crud", "versioning", "pagination",
    ],
  },
  {
    id: "java",
    label: "Java experience",
    match: ["java"],
    signals: [
      "java", "jvm", "maven", "gradle", "concurrency", "thread", "threads",
      "garbage collection", "streams", "generics", "spring",
    ],
  },
  {
    id: "years",
    label: "years of experience",
    match: ["years", "experience"],
    signals: ["year", "years"],
  },
];

const DEPTH_CUES = [
  "i built", "i designed", "i deployed", "i owned", "i implemented",
  "i managed", "i led", "i wrote", "i configured", "i ran", "i set up",
  "i maintained", "i architected", "i debugged", "i migrated", "i scaled",
  "responsible for", "personally", "production", "on-call", "on call",
  "incident", "rollback", "rolled back", "my role", "we deployed", "we built",
];

const WEAKNESS_CUES = [
  "a bit", "a little", "not really", "briefly", "just used", "somewhat",
  "not sure", "i think", "kind of", "kinda", "only used", "played with",
  "familiar with", "heard of", "in theory", "haven't", "have not", "never",
];

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-token, case-insensitive presence test (so "ci" ≠ "specific"). */
function has(haystack: string, needle: string): boolean {
  return new RegExp(`(?<![a-z0-9])${esc(needle)}(?![a-z0-9])`, "i").test(
    haystack,
  );
}

function detectTopic(requirement: Requirement): Topic {
  const text = `${requirement.text} ${requirement.sourceQuote}`.toLowerCase();
  for (const t of TOPICS) {
    if (t.match.some((m) => text.includes(m))) return t;
  }
  // Fallback: build an ad-hoc topic from the requirement's own significant words.
  const words = requirement.text
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  return {
    id: "generic",
    label: requirement.text.toLowerCase(),
    match: [],
    signals: [...new Set(words)],
  };
}

function firstNumber(s: string): number | null {
  const m = s.match(/\b(\d{1,2})(?:\+|\s*\+)?\s*(?:years|year|yrs|yr)?/i);
  return m ? Number(m[1]) : null;
}

/** Pick the sentence from the answer that carries the most evidence. */
function bestQuote(answer: string, signals: string[]): string {
  const sentences = answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return answer.trim();
  let best = sentences[0];
  let bestScore = -1;
  for (const s of sentences) {
    const score = signals.filter((sig) => has(s, sig)).length;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export function evaluateAnswer(
  requirement: Requirement,
  answer: string,
  opts: { priorStatus?: FindingStatus; fallbackFollowUp?: string } = {},
): AnswerEvaluation {
  const prior = opts.priorStatus ?? "unverified";
  const topic = detectTopic(requirement);
  const text = answer.trim();
  const wordCount = text ? text.split(/\s+/).length : 0;

  const matchedSignals = [...new Set(topic.signals.filter((s) => has(text, s)))];
  const depthCues = DEPTH_CUES.filter((c) => text.toLowerCase().includes(c));
  const weakness = WEAKNESS_CUES.filter((c) => text.toLowerCase().includes(c));

  // Years requirements verify on a stated number that meets the threshold.
  let numericPass = false;
  if (topic.id === "years") {
    const need = firstNumber(requirement.text) ?? 5;
    const got = firstNumber(text);
    numericPass = got != null && got >= need;
  }

  const strongWeakness = weakness.length > 0 && depthCues.length === 0;

  const sufficient =
    numericPass ||
    (matchedSignals.length >= 2 &&
      depthCues.length >= 1 &&
      wordCount >= 14 &&
      !strongWeakness) ||
    (matchedSignals.length >= 4 && wordCount >= 18 && !strongWeakness);

  const followUp =
    opts.fallbackFollowUp ??
    `Can you give a specific example of ${topic.label} you personally worked on — what you built or operated, and what you were responsible for?`;

  if (sufficient) {
    const cue = depthCues.slice(0, 2).join(", ");
    const sig = (numericPass ? ["a stated duration"] : matchedSignals.slice(0, 3)).join(", ");
    return {
      outcome: "verified",
      newStatus: "met",
      reason: numericPass
        ? `The answer states experience meeting the required duration — sufficient to evidence ${topic.label}.`
        : `The answer cites ${sig}${cue ? ` with first-hand ownership (${cue})` : ""} — specific enough to evidence ${topic.label}.`,
      evidenceQuote: bestQuote(text, topic.signals),
      evidenceSource: "Interview answer",
      topicLabel: topic.label,
      matchedSignals,
      depthCues,
    };
  }

  const why =
    wordCount === 0
      ? "No answer was recorded"
      : weakness.length > 0
        ? `the answer hedges ("${weakness[0]}") and gives no first-hand specifics`
        : matchedSignals.length === 0
          ? "the answer does not reference the required work at all"
          : "the answer mentions it but without concrete, first-hand detail";

  return {
    outcome: "insufficient",
    newStatus: prior,
    reason: `Not enough to verify — ${why}.`,
    evidenceSource: "Interview answer",
    followUp,
    topicLabel: topic.label,
    matchedSignals,
    depthCues,
  };
}
