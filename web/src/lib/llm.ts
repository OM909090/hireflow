/**
 * Server-side LLM client for an OpenAI-compatible endpoint.
 *
 * SERVER ONLY — never import this from a client component. The API key must not
 * reach the browser; the app talks to the model through the route handlers in
 * `src/app/api/agent/*`.
 *
 * Written to be provider-agnostic, because the endpoint has been swapped mid-build
 * more than once. It assumes only the lowest common denominator of an
 * OpenAI-compatible API (see api/hireflow/llm.py, which does the same for the
 * Python pipeline):
 *
 *   1. `stream: false` is sent explicitly — some proxies return SSE by default,
 *      and `contentFromSse` below recovers the content if one still does.
 *   2. JSON is enforced by system prompt + tolerant parsing + one repair retry
 *      rather than `response_format`, since not every provider honours it.
 *      Providers that do support it still work; this is just not dependent on it.
 *   3. Calls are slow (seconds to tens of seconds), so callers get a long
 *      timeout and the UI reports real elapsed time rather than faking progress.
 */

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class LlmError extends Error {}

export function llmConfig(): LlmConfig {
  // 127.0.0.1 rather than localhost: a v4-only bound proxy hangs on ::1.
  const baseUrl = (
    process.env.HIREFLOW_BASE_URL ?? "http://127.0.0.1:8082/v1"
  ).replace(/\/$/, "");
  const apiKey = process.env.HIREFLOW_API_KEY ?? "";
  const model =
    process.env.HIREFLOW_MODEL ?? "opencode/muse-spark-1.3-contributor-free";
  if (!apiKey) {
    throw new LlmError(
      "HIREFLOW_API_KEY is not set — the AI agent has no model access configured.",
    );
  }
  return { baseUrl, apiKey, model };
}

export const JSON_SYSTEM =
  "You are a JSON API inside an automated hiring pipeline. " +
  "You reply with a single raw JSON object and nothing else. " +
  "No prose, no explanation, no markdown code fences, no questions, no preamble. " +
  "Never ask for clarification. If information is missing, express that inside " +
  "the JSON using the fields provided. Your entire response must parse as JSON.";

/**
 * Pull a JSON object out of a model response.
 *
 * Handles fenced blocks, a sentence before or after the object, and falls back
 * to a brace-balanced scan that respects string literals so a `{` inside a
 * quoted value does not derail it.
 */
export function extractJson(text: string): unknown {
  let t = text.trim();

  if (t.startsWith("```")) {
    const nl = t.indexOf("\n");
    if (nl !== -1) t = t.slice(nl + 1);
    const fence = t.lastIndexOf("```");
    if (fence !== -1) t = t.slice(0, fence);
    t = t.trim();
  }

  try {
    return JSON.parse(t);
  } catch {
    /* fall through to scan */
  }

  const start = t.indexOf("{");
  if (start === -1) {
    throw new LlmError(`No JSON object in response: ${text.slice(0, 200)}`);
  }

  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < t.length; i += 1) {
    const ch = t[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(t.slice(start, i + 1));
        } catch (e) {
          throw new LlmError(`Malformed JSON object: ${String(e)}`);
        }
      }
    }
  }
  throw new LlmError(`Unbalanced JSON in response: ${text.slice(0, 200)}`);
}

/** Some proxies answer with SSE even when asked not to. Recover the content. */
function contentFromSse(body: string): string | null {
  if (!body.startsWith("data:")) return null;
  let out = "";
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const obj = JSON.parse(payload) as {
        choices?: { delta?: { content?: string }; message?: { content?: string } }[];
      };
      const c = obj.choices?.[0];
      out += c?.delta?.content ?? c?.message?.content ?? "";
    } catch {
      /* ignore keep-alive noise */
    }
  }
  return out || null;
}

async function post(
  cfg: LlmConfig,
  messages: { role: string; content: string }[],
  maxTokens: number,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        stream: false, // required — this proxy streams by default
        temperature: 0,
        max_tokens: maxTokens,
        messages,
      }),
      signal: controller.signal,
    });

    const body = await res.text();
    if (!res.ok) {
      throw new LlmError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    const sse = contentFromSse(body);
    if (sse) return sse;

    try {
      const json = JSON.parse(body) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("no content");
      }
      return content;
    } catch {
      throw new LlmError(`Unexpected response envelope: ${body.slice(0, 300)}`);
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new LlmError(`Model call timed out after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run `prompt` and return parsed JSON, validated by `validate`.
 *
 * One repair retry: the model is shown its own broken output and the problem.
 * Capped at a single retry deliberately — each attempt is expensive.
 */
export async function completeJson<T>(
  prompt: string,
  validate: (value: unknown) => T,
  opts: { maxTokens?: number; timeoutMs?: number; label?: string } = {},
): Promise<{ value: T; model: string; raw: string }> {
  const cfg = llmConfig();
  const maxTokens = opts.maxTokens ?? 1200;
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const label = opts.label ?? "call";

  const raw = await post(
    cfg,
    [
      { role: "system", content: JSON_SYSTEM },
      { role: "user", content: prompt },
    ],
    maxTokens,
    timeoutMs,
  );

  try {
    return { value: validate(extractJson(raw)), model: cfg.model, raw };
  } catch (first) {
    const repair =
      `${prompt}\n\n---\nYour previous response could not be used.\n\n` +
      `Previous response:\n${raw.slice(0, 1500)}\n\n` +
      `Problem:\n${String(first)}\n\n` +
      "Return ONLY the corrected raw JSON object. No prose, no fences.";

    const raw2 = await post(
      cfg,
      [
        { role: "system", content: JSON_SYSTEM },
        { role: "user", content: repair },
      ],
      maxTokens,
      timeoutMs,
    );
    try {
      return { value: validate(extractJson(raw2)), model: cfg.model, raw: raw2 };
    } catch (second) {
      throw new LlmError(
        `${label}: unusable after repair. ${String(second)}. Raw: ${raw2.slice(0, 300)}`,
      );
    }
  }
}
