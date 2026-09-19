# HireFlow — Build Plan v2

PS3: AI Candidate Screening & Interview Intelligence Agent
Revised 19 Sep 2026 after adversarial review by ChatGPT and Gemini.
**~31 h wall clock to deadline · ~16 h real build time**

---

## What the review changed

Both reviewers independently landed the same core criticism, which means it's probably right:

> **I was optimizing for architectural correctness over judge-visible value.**

Gemini put it bluntest: *"You are optimizing for EU regulators; the judges are optimizing for a
3-minute video and LinkedIn virality."* ChatGPT: *"There is zero explicit compliance category...
spending hours building compliance machinery that isn't visible to the judge is dangerous."*

They're right, and the fix is cheap — it's a **repositioning, not a rebuild**. The architecture
survives. What changes is what I lead with and what's visible on screen.

### The repositioning

| Was | Now |
|---|---|
| "Auditability is the differentiator" (internal property) | **"Evidence-backed decisions that know when they don't know"** (user-facing behaviour) |
| Lead with EU AI Act | Lead with the anti-hallucination behaviour; regulation is *supporting context* mentioned once |
| Audit trail as backend infrastructure | Audit trail as a visible **[Why?]** button on every claim |

No recruiter wakes up wanting an audit trail. They wake up asking *"why does it say this person has
5 years of Kubernetes?"* Same machinery, better framing — and it now scores across AI Integration,
UX, Problem Understanding **and** Innovation simultaneously instead of just being correct.

---

## Consensus changes (both reviewers, acting on all)

1. **The naive substring check will fail badly.** Gemini estimated ~80% false-negative rate. PDF
   text injects whitespace, breaks lines mid-phrase, hyphenates across lines, mangles ligatures
   (`ﬁ`/`fi`), and the model will paraphrase punctuation (`5 years` vs `5+ years.`). Unfixed, this
   flags *valid* evidence as unverified and destroys the demo. → Normalize before comparing, plus a
   token-coverage fallback. Now its own block.
2. **Fixtures must be clean Markdown/TXT, not PDF.** Do not attempt general PDF extraction. If
   time allows at the end, add PDF as a bonus. Both flagged B3 as the block that blows up —
   ChatGPT estimated 3 h → 5 h.
3. **Cut capability 5 (grouping).** Five candidates don't need it, and it produces no demo moment.
   If wanted, it's a free column sort in the UI.
4. **Add capability 8 (follow-up questions).** I wrongly cut this. It's ~30 min once cap 7 exists
   and it's one of the strongest demo beats — see the sequence in §4.
5. **Reinstate capability 12 (NL query), constrained.** Not a general RAG chatbot — a narrow
   text-to-SQL over the findings table, 3–5 supported query shapes, ~45 min. Highly visible AI
   integration for very little work.
6. **Cut the overall match score.** Never render "Candidate: 87%". Both flagged that a percentage
   instantly reads as "another automated ranker" and contradicts the organizers' stated goal.
7. **Add an explicit human decision boundary** — `[Shortlist] [Review] [Reject]` buttons. The AI
   organizes evidence and names uncertainty; the human decides. This is the literal wording of the
   problem statement, and I had no UI representing it.
8. **Shot 4 was too subtle.** A grey `unverified` tag beside a green `met` tag will not read on a
   phone-sized video. It has to be staged as a confrontation — see §4.
9. **Cut elaborate audit-log infrastructure.** Minimal provenance is enough:
   `finding_id, candidate_id, requirement_id, source_doc, evidence_quote, verified, model, timestamp`.

### Kept — both reviewers endorsed
- Requirement objects with stable IDs as the keystone ("excellent architectural decision")
- The four-state `met | partial | unverified | absent` model
- Evidence verification as the real differentiator
- Interview questions generated from gaps
- Demo-backward planning and the 18:00 feature freeze

---

## Schema upgrade (ChatGPT's best catch)

My `Finding` was too thin. Adding three fields makes the interview-question generator almost
deterministic instead of requiring a second reasoning pass:

```
Finding {
  requirement_id    REQ-03
  candidate_id      C-02
  status            met | partial | unverified | absent
  reason            "Resume shows Docker experience but does not establish
                     Kubernetes production experience."
  missing_detail    "Production Kubernetes deployment/operations experience"
  confidence        0.0–1.0
  evidence[]        { quote, source_doc, location_hint, verified: bool }
}
```

`missing_detail` is what the question generator consumes. That's why cap 7 and cap 8 get cheap.

### Status policy — write this down, don't let the model improvise
Both reviewers warned the four states sound simple and aren't. Given requirement *"AWS Lambda
production experience"* and resume text *"worked with cloud infrastructure"* — is that absent,
unverified, or partial? Fix it by rule, in the prompt:

| Status | Rule |
|---|---|
| **MET** | Explicit evidence satisfies the requirement |
| **PARTIAL** | Explicit evidence satisfies *part* of the requirement |
| **UNVERIFIED** | Related evidence exists but the required detail isn't demonstrated |
| **ABSENT** | No relevant evidence found at all |

### The architectural one-liner
> **The LLM proposes evidence. My code validates it.**

That sentence is the pitch, the architecture, and the anti-hallucination guarantee in one line.

---

## Revised blocks

| Block | Caps | Est. | Notes |
|---|---|---|---|
| **B0** Schema + SQLite | 4, 13 | 0.75 h | Freeze first. Everything references REQ-IDs. |
| **B0.5** Fixtures | — | 0.5 h | 1 JD + 5 resumes, clean `.md`. One deliberately *ambiguous* candidate (Docker-but-not-Kubernetes) — this single fixture carries the whole demo. |
| **B1** Ingest | 1 | 0.75 h | `.md`/`.txt` only. PDF is a stretch goal, never a blocker. |
| **B2** JD → Requirements | keystone | 1.0 h | Numbered REQ-IDs with JD source spans |
| **B3** Extraction → evidence *proposals* | 2 | 2.0 h | Model proposes `{claim, evidence_quote, source, location_hint}`. It does **not** decide truth. |
| **B3.5** Evidence verifier | 13 | 1.5 h | ★ the differentiator. Normalize → substring → token-coverage fallback → else `unverified`. |
| **B4** Mapping → Findings | 3, 4 | 2.0 h | Applies the status policy, fills `reason` + `missing_detail` |
| **B5** Candidate view + **[Why?]** + decision buttons | 6, 13 | 2.0 h | ★ the demo surface |
| **B6** Interview questions from gaps | 7 | 1.0 h | Consumes `missing_detail` |
| **B6.5** Follow-up questions | 8 | 0.5 h | Nearly free. Big demo payoff. |
| | | **12.0 h** | ← core |
| **B7** Agent activity panel | — | 0.5 h | Gemini's idea, see below |
| **B8** Constrained NL query | 12 | 0.75 h | text-to-SQL over findings |
| Polish + demo states | — | 1.0 h | |
| | | **14.25 h** | ← full |

**Capability coverage: 9 of 13** (1, 2, 3, 4, 6, 7, 8, 12, 13) — up from 7 in v1, with *less*
work, because grouping and the interview-note loop are gone and caps 8/12 turned out cheap.

**Hard engineering cutoff: 14 h, not 16.** ChatGPT's point — the enemy isn't coding, it's
integration bugs, API failures, UI crashes, recording mistakes and submission mistakes.

### B7 — the Agent Activity panel (Gemini's best idea)
A Streamlit sidebar streaming the agent's reasoning as it runs:

```
[agent] parsing JD → 7 requirements found
[agent] extracting C-02 …
[agent] proposing evidence for REQ-03
[verifier] quote not found in source → REQ-03 flagged UNVERIFIED
[agent] generating validation question for REQ-03
```

Half an hour of work. It makes the system feel alive on camera, it's the clearest proof of agentic
behaviour available, and the verifier line is genuinely compelling footage. Gemini's argument:
without something like this, a Streamlit table of extracted text loses to someone's flashy
hallucinating chatbot.

---

## The one thing they disagreed on: LangGraph

| | Position |
|---|---|
| **Gemini** | *Mandatory.* "Submitting a standard LLM chain is a death sentence for the 25% AI Integration criteria." Killer argument: LangGraph compiles to an exportable **Mermaid diagram** of the agent workflow — unquestionable visual proof of agentic architecture, free. |
| **ChatGPT** | *Plain Python.* "Your workflow isn't complicated enough to justify the integration risk." It's a linear pipeline. One real decision loop is agentic enough. |

**My adjudication:** Gemini's real concern is *provable agentic optics*, and that's achievable
without the framework risk. The agentic credit comes from the evidence-sufficiency decision loop and
the NL-query tool use — not from the import statement. And I can generate the architecture diagram
directly (I already built the Day 1 one), which neutralises Gemini's strongest argument.

### ✅ DECIDED: LangGraph

Om has used it. Going with Gemini's recommendation.

What this buys us:
- `graph.get_graph().draw_mermaid()` → architecture diagram for free, for both the demo and the
  Day-2 LinkedIn post
- Checkpointed state doubles as the audit trail, so less custom persistence code
- Removes the "is this actually agentic?" question from a judge's mind

Guardrails, since ChatGPT's integration-risk warning still stands:
- Keep the graph **flat and boring** — nodes for ingest → requirements → extract → verify → map →
  summarise → questions. No nested subgraphs, no clever routing.
- The verifier node stays **pure Python**. No LLM call in it. That's the whole point.
- One real conditional edge: `evidence_sufficient?` → verified, or → generate question. That single
  branch is what makes it a graph rather than a chain.
- If LangGraph fights back for more than 45 minutes, fall back to plain Python with the same state
  dict. Do not let the framework become the project.

Pitch, either way:
> Deterministic orchestration + LLM reasoning + programmatic evidence verification.

---

## Shot 4, restaged as a confrontation

v1 had a grey tag beside a green tag. Both reviewers said that won't read on camera. New sequence:

```
1. Ask out loud:   "Does this candidate satisfy our Kubernetes requirement?"

2. Evidence found: "Containerized microservices using Docker…"

3. Requirement:     REQ-03 — Production Kubernetes experience

4. Verifier:        ✕ No source evidence for Kubernetes production usage

5. Verdict:         ⚠ HireFlow will NOT mark this requirement satisfied

6. Click →          "Ask this in the interview:
                     You mention Docker-based microservices. Did you personally
                     deploy or operate those workloads on Kubernetes in production?"

7. Follow-up →      "Which components did you manage — the control plane, or
                     workloads on a managed cluster?"

8. Human decides:   [ Shortlist ]  [ Review ]  [ Reject ]
```

Full arc: **resume → AI inference → evidence check → uncertainty → validation question → human
decision.** Render the failure state loud — `st.error`, a full-width yellow block, not a grey chip.

That single sequence demonstrates AI integration, UX, problem understanding, innovation, the audit
trail, *and* human-in-the-loop. One feature covering nearly the whole rubric.

---

## Execution order

**Tonight (7.5 h) — target: golden path running end to end**
| | Task | Time |
|---|---|---|
| 1 | B0 schema + SQLite, freeze it | 0.75 h |
| 2 | B0.5 fixtures incl. the ambiguous candidate | 0.5 h |
| 3 | B1 ingest (md/txt) | 0.75 h |
| 4 | B2 JD → REQ-IDs | 1.0 h |
| 5 | B3 extraction → evidence proposals | 2.0 h |
| 6 | B3.5 verifier + normalization | 1.5 h |
| | *Checkpoint: the ambiguous candidate produces a real UNVERIFIED on REQ-03* | |

**Stop at 01:00 regardless.** Leave a two-line note on what's next.

**Day 2 morning (5 h)** — B4 mapping (2 h) · B5 candidate UI + Why? + decision buttons (2 h) ·
**record shots 1–4 the instant they work** (1 h)

**Day 2 afternoon (5 h)** — B6 questions (1 h) · B6.5 follow-ups (0.5 h) · **record shot 5** ·
B7 activity panel (0.5 h) · Day-2 LinkedIn post (1 h) · B8 NL query *if stable* (0.75 h) ·
polish (1 h)

**18:00 — FEATURE FREEZE.** Then video (2.5 h) → Drive + incognito check (0.5 h) → submit both
forms (0.5 h) → buffer (1 h).

---

## Day 2 LinkedIn angle (25% of score — reuse the demo)

Both reviewers converged here too. Don't post "Excited to announce I built HireFlow 🚀".
Post the tension the product exposes:

> **"What happens when an AI hiring system can't prove its own claim?"**

Then the 10-second verifier clip: AI claims Kubernetes → verifier finds no evidence → `UNVERIFIED`
→ generated interview question. Same asset as shot 4, zero extra work, and it's a genuine hook
rather than an announcement.

---

## Risks

| Risk | Mitigation |
|---|---|
| Verifier false-negatives kill the demo | Normalize (NFKC, lowercase, de-hyphenate, collapse whitespace, strip punctuation) then token-coverage fallback at ~90%. Test against fixtures at hour 3, not hour 13. |
| B3 extraction overruns | Clean `.md` fixtures only. PDF is a stretch goal. |
| LLM improvises the four statuses | Status policy written into the prompt as explicit rules |
| Looks like an automated ranker | No overall score. Decision buttons always visible. |
| Shot 4 doesn't read on camera | Loud failure state + spoken question framing |
| Drive link not public | Verify in incognito before submitting |
| One-shot submission | Review before sending (FAQ Q16) |

---

## Open questions

1. **LangGraph — used it before, yes or no?** Last blocker on the architecture.
2. **Which model API keys work right now?** B3/B4 need reliable structured outputs.
3. **Streamlit OK?** Assuming yes — the `[Why?]` expander pattern is native to it.
4. Solo confirmed? (affects LinkedIn obligation + form participant-2 fields)
5. Team name — `HireFlow`?

Answer 1 and 2 and I'll start on B0.
