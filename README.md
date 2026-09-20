# HireFlow

**AI candidate screening and interview intelligence — evidence-backed, human-in-the-loop.**

Built for the Agentic AI Hackathon 2026 (Product Space), Problem Statement 3.

HireFlow reads a job description and a stack of resumes, then produces a screening report where
**every claim points back to the exact line of the source document it came from** — and where the
agent openly refuses to assert anything it cannot ground in that source.

There is no overall match score anywhere in the product. That is deliberate.

---

## The idea in one sentence

> **The model proposes evidence. The code validates it.**

The LLM is never given the final say on whether its own evidence is real. It returns candidate
claims with quotes; a **pure-Python verifier with no model call in it** then tries to locate each
quote in the source document. If the quote cannot be located, the claim is refused and the
requirement is flagged for a human instead of being marked satisfied.

That single boundary is what makes the output defensible: the component that decides truth
structurally cannot hallucinate, because it cannot generate text.

In the recorded run, the verifier **refused 5 of the agent's own proposed claims**. Each refusal
became an interview question rather than a conclusion.

---

## Requirement statuses

Statuses are assigned by explicit rule, not left to the model's discretion:

| Status | Rule |
|---|---|
| **Met** | Explicit evidence satisfies the requirement |
| **Partial** | Explicit evidence satisfies *part* of the requirement |
| **Unverified** | Related evidence exists, but the required detail is not demonstrated |
| **Absent** | No relevant evidence found at all |

`Unverified` is the status that matters. A resume saying *"containerised microservices with Docker"*
against a requirement of *"Kubernetes in production"* is **not** a match — it is a question to ask.

---

## Capability coverage — 12 of 13

| # | Capability | Where |
|---|---|---|
| 1 | Upload a job description + candidate resumes | Intake (`/`) |
| 2 | Extract skills, experience, projects, qualifications | Findings with evidence quotes |
| 3 | Map candidate experience against job requirements | Requirement coverage, evidence matrix |
| 4 | Identify missing / unclear info needing validation | `unverified` / `absent` + open-gap banner |
| 5 | Group candidates by experience and role fit | *Partial* — matrix + filters + NL query |
| 6 | Generate structured candidate summaries | Candidate workspace |
| 7 | Create role-specific interview questions | Generated per open requirement |
| 8 | Generate follow-up questions when an answer is thin | Agent panel, on insufficient answers |
| 9 | Summarise interview notes, map back to requirements | Answer analysis writes evidence to the REQ |
| 10 | Identify unanswered evaluation areas | Open requirements persist; report says "incomplete" |
| 11 | Standardised interview evaluation report | Resume / Interview / Final columns |
| 12 | Natural-language querying of the candidate pool | `/ask` and the pool search |
| 13 | Audit trail: which info produced each insight | `[Why?]` on every claim + verification audit |

Capability 5 was deliberately deprioritised — with five candidates, explicit grouping produced no
value that the matrix and the natural-language query did not already cover.

---

## Verified numbers from the recorded run

Read off the running app, not estimated:

| | |
|---|---|
| Requirements parsed from one JD | **10** (6 must-have, 4 nice-to-have) |
| Candidates screened | **5** |
| Evidence checks run | **50** |
| Quotes located in source | **45** |
| **Claims refused by the verifier** | **5** |
| Requirements left open for a human | **21** |
| Whole pool screened in | **~91 s** |
| Match score shown anywhere | **none** |

---

## Architecture

```
job description ─┐
                 ├─→ ingest ─→ requirements ─→ extract ─→ ┌─ VERIFY ─┐ ─→ map ─→ summarise ─→ questions
resumes ─────────┘                (REQ-ids)   (proposals) │ pure code │
                                                          └─ refuses ─┘ ─→ generate validation question
```

A **LangGraph** pipeline with one real conditional edge: `evidence_sufficient?` routes either to a
verified finding or to a generated interview question. The verifier node is plain Python and is
covered by unit tests.

Two constraints shaped the design, both discovered by probing the endpoint rather than assuming:

- **No structured-output guarantee.** JSON is enforced by system prompt, tolerant parsing and a
  single repair retry — not by a vendor flag. This kept the client provider-agnostic.
- **Slow calls.** One call per requirement would have taken ~19 minutes for five candidates. The
  design batches one call per candidate and runs them concurrently: ~91 seconds.

### Stack

- **Web** — Next.js 16 (App Router), React 19, Tailwind v4, TypeScript. Fixed-viewport shell:
  the app chrome never scrolls, only data regions do.
- **Agent pipeline** — Python, LangGraph, an OpenAI-compatible chat endpoint.
- **Live agent** — API routes under `web/src/app/api/agent/*` hold the prompts and the key
  server-side; the browser never sees credentials.

---

## Running it

### Web app

```bash
cd web
npm install
cp .env.example .env.local     # then fill in your model endpoint + key
npm run dev                    # http://localhost:3000
```

The UI reads a recorded run from `web/src/data/run.json`, so **every screen works without any
model access**. Model access is only needed for the live interview agent.

### Agent pipeline

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # model endpoint + key
python -m hireflow.run         # regenerates run.json
pytest                         # verifier unit tests
```

### Configuration

| Variable | Purpose |
|---|---|
| `HIREFLOW_API_KEY` | Key for the chat/completions endpoint (server-side only) |
| `HIREFLOW_BASE_URL` | Any OpenAI-compatible base URL |
| `HIREFLOW_MODEL` | Model id the endpoint actually serves |

---

## Project layout

```
api/
  hireflow/
    graph.py        LangGraph pipeline definition
    verify.py       the verifier — pure code, no model call
    prompts.py      prompts, including the explicit status policy
    schema.py       Finding / Requirement / Evidence types
    llm.py          OpenAI-compatible client
    fixtures/       1 job description + 5 candidate resumes (Markdown)
  tests/            verifier unit tests
web/
  src/app/          intake, requirements, candidates, matrix, activity, ask
  src/components/   UI, agent panel, evidence rendering
  src/lib/          shared types, live agent client, verification store
  src/data/run.json real recorded output of the pipeline
```

---

## Notes

- Candidate data is **synthetic**. One candidate is deliberately ambiguous — strong Docker
  evidence, no Kubernetes evidence — because that is the case that separates a screener that
  checks its evidence from one that pattern-matches.
- Findings carry their own provenance: finding id, confidence, the model that produced them, and a
  timestamp, visible behind `[Why?]` on every claim.
- Interview verifications are held in an in-memory store, so they reset on reload. Persisting them
  is the obvious next step, along with PDF ingestion and recruiter-supplied JD upload.

---

Built by **Om Prakash Sahu** · Agentic AI Hackathon 2026 · Product Space
