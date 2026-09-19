# Backend constraints — discovered by probing the endpoint

Probed 19 Sep against `http://127.0.0.1:20128/v1`. These findings changed the
architecture, so they're recorded rather than buried in commit messages.

## 1. `localhost` does not work — use `127.0.0.1`

The listener is bound IPv4-only on `0.0.0.0:20128`. `localhost` resolves to `::1`
first, so requests hang until timeout. Every config uses `127.0.0.1` explicitly.

## 2. Responses stream by default

Without `"stream": false` the endpoint returns SSE (`data: {...}` chunks) even
though the OpenAI spec defaults to non-streaming. Always send `stream: false`.

## 3. `response_format` / `json_schema` is **not supported**

Sending a strict `json_schema` response format is silently ignored. The model
replied with conversational prose asking what we wanted, not JSON.

This kills the plan's "provider-native structured outputs" approach. Fallback in
use instead:
- a system message instructing a raw-JSON-only reply
- `temperature: 0`
- tolerant extraction (strip fences, balanced-brace scan)
- one repair retry on parse failure

Verified working: a realistic two-requirement extraction returned clean, correct
JSON with exact substring quotes on the first attempt.

## 4. ~30–35 seconds per call, consistently

Not cold start — repeated calls stayed at 30–35 s. The proxy also injects a large
system prompt (4,200–6,800 prompt tokens for a trivial request), which is why it
behaves like a coding assistant unless firmly instructed otherwise.

**This is the constraint that reshaped the design.** The original plan implied a
call per (candidate × requirement) — 35 calls × 32 s ≈ 19 minutes per run, which
is unusable for iteration and impossible in a demo.

Adaptations:
- **One call per candidate**, returning all 7 findings at once → 5 calls
- Plus one call for JD → requirements → **6 calls total**
- Run candidates **concurrently** → wall clock ≈ 40–70 s for a full run
- **Persist the result to `api/out/run.json`** so the UI never waits on the model

## 5. Model choice

No `gpt-4.1-mini` on this proxy. 76 models available, all `kr/…` prefixed.
Using **`kr/claude-haiku-4.5`** — fastest of the Claude tier and its reasoning on
the probe was sound. `kr/claude-sonnet-4.5` is the quality fallback if haiku's
status classification proves too coarse.

## 6. Status classification needs explicit rules

On the probe, the model marked Kubernetes `absent` where our policy wants
`unverified` — related Docker evidence *does* exist, it just doesn't establish the
requirement. The four states are genuinely ambiguous without rules, exactly as
flagged in review, so the policy is written into the prompt verbatim rather than
left to model judgement.

---

# Run results

Model in use: **`kr/gpt-5.6-luna`** (~24 s/call, slightly faster than haiku-4.5 and
noticeably better at following the status policy).

```
$ cd api && uv run python -m hireflow.run

done in 91.4s
  requirements     7
  candidates       5
  findings         35  {met: 20, partial: 6, absent: 6, unverified: 3}
  quotes verified  29
  quotes refused   0
  questions        9
  activity events  44
```

Six LLM calls per run (1 requirements + 5 candidate reviews concurrently), then
questions for candidates with gaps. 91 s wall clock against ~19 minutes if the
naive per-(candidate × requirement) design had been kept.

## Two honest limitations

**1. Zero quotes were refused in this run.**
The verifier checked 29 quotes and located all of them, because the model copied
spans faithfully when told a program would check them. The refusal path is real
and proven by 15 unit tests in `tests/test_verify.py` — including fabricated
quotes, keyword soup, and quotes too short to evidence anything — but it did not
trigger on this input. Worth saying plainly in the demo rather than implying the
verifier is constantly catching hallucinations. What it actually provides is a
*guarantee*, not a steady stream of catches.

**2. The verifier checks quote existence, not quote sufficiency.**
For REQ-01 ("5+ years Python") the model marked `met` and cited *"Python services
for lending and collections."* That quote is genuinely in the resume, so it
verifies — but it does not on its own prove five years. The dates that do prove it
are elsewhere in the document. So a verified citation means "this text exists",
not "this text is sufficient". Closing that gap would need span-level reasoning
about entailment, which is out of scope here and should be named as future work
rather than glossed over.

## Requirement splitting needed tuning

First run produced 10 requirements: it split "deploying and operating workloads on
Kubernetes" into two, and "schema design and query optimisation" into two. Both
splits are technically defensible and both make candidates look artificially
weaker than the employer intended. The prompt now instructs the model to keep the
job description's own grouping and explicitly not to atomise. Second run: 7
requirements, matching the JD's bullets.
