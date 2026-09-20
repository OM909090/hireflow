# Agentic AI Hackathon '26 — Control Sheet

**Host:** Product Space (Acadence Edutech Pvt Ltd) · listed on Unstop
**Participant:** Om Prakash Sahu (os4558966@gmail.com, @omsah77404)
**Chosen track:** Problem Statement 3 — **HireFlow** (AI Candidate Screening & Interview Intelligence Agent)
**Last verified:** 19 Sep 2026, 15:44 IST

---

## Registrations — both done ✅

| Platform | Status |
|---|---|
| Unstop | ✅ Confirmed on account (os4558966@gmail.com) |
| Product Space website | ✅ Confirmed by Om, 19 Sep |
| WhatsApp group | ✅ In "Agentic AI Hackathon '26 \| Product Space" |

Product Space registration was mandatory (FAQ Q14) — without it, no submission and no certificate.
Submission portal: https://theproductspace.in/user-dashboard/submissions/agentic-ai-hackathons

---

## Countdown

| Milestone | When (IST) | Status |
|---|---|---|
| Unstop registration deadline | 19 Sep, 11:00 AM | ✅ Done (confirmed on Unstop) |
| Kickoff call (mandatory) | 19 Sep, 08:00–09:00 AM | ⚠️ Already passed — request recording |
| Product Space registration | ASAP | ✅ Done (confirmed by Om, 19 Sep) |
| Work-on-project window | 19 Sep 11:00 AM → 20 Sep 11:59 PM | 🔵 Live now |
| LinkedIn post — Day 1 | 19 Sep | ✅ **LIVE** — posted 19 Sep ~16:20 IST |
| LinkedIn post — Day 2 | 20 Sep | 🟡 **Drafted** — 2 variants ready in `LINKEDIN-DAY2.md`, post in the evening IST window |
| Streak form submission | After Day 2 post | ⬜ Pending (single submission, needs both links — see below) |
| Project submission | **20 Sep, 11:59 PM** | ⬜ Build essentially demo-ready; video + Vercel deploy still to do |
| Demo Day with panelists | TBD | — |
| Winner announcement | TBD | — |

Kickoff recording will be shared with registered participants (FAQ Q27). The LinkedIn caption
template was also shared on that call — templates are already captured below, so you're not blocked.

---

## Your Problem Statement — PS3: HireFlow

**AI Candidate Screening & Interview Intelligence Agent**

### The problem
Recruiters review large numbers of resumes per role. Candidate info is scattered across resumes,
portfolios, application forms, and interview notes. Manual screening is slow and makes consistent
comparison against real role requirements hard. Interviewers burn time preparing questions and
reviewing notes instead of talking to candidates.

### Required capabilities (this is your build checklist)

| # | Capability | Status | Where in the app |
|---|---|---|---|
| 1 | Upload a job description + candidate resumes | ✅ | Intake `/` |
| 2 | Extract skills, experience, projects, qualifications per candidate | ✅ | Findings + evidence quotes |
| 3 | Map candidate experience against specific job requirements | ✅ | Requirement coverage + matrix |
| 4 | Identify missing / unclear info needing validation | ✅ | `unverified`/`absent` + "needs validation" |
| 5 | Group candidates by relevant experience and role fit | ➖ | Deprioritized; matrix + NL query cover it |
| 6 | Generate structured candidate summaries for recruiters | ✅ | AI summary + decision hero |
| 7 | Create role-specific interview questions per candidate background | ✅ | Agent panel — "Suggest a question" |
| 8 | Generate follow-up questions when an answer needs deeper validation | ✅ | Agent panel — follow-up on insufficient answer |
| 9 | Summarize interview notes, map evidence back to job requirements | ✅ | Agent analyses answer → records evidence to REQ |
| 10 | Identify unanswered evaluation areas after an interview | ✅ | Open requirements stay flagged; audit trail |
| 11 | Generate a standardized interview evaluation report | ✅ | `EvaluationReport` (Resume / Interview / Final) |
| 12 | Natural-language querying of the candidate pool | ✅ | `/ask` + pool NL query |
| 13 | Audit trail: which candidate info produced each insight | ✅ | `[Why?]` on every claim + verification audit |

**Coverage: 12 of 13 built** (only #5 grouping intentionally deprioritized — the plan cut it as a
no-demo-moment feature; the evidence matrix and NL query cover the underlying need). The verifier
that backs #4/#13 is pure Python with 15 passing tests: the LLM proposes evidence, the code
validates it, and it refuses to mark a requirement "met" if it can't locate the quote in the source.

**Stated goal:** reduce repetitive recruitment work while keeping human hiring decisions at the
center. Do not build an auto-reject machine — keep the human in the loop. Item 13 (audit trail) is
the differentiator most teams will skip; it directly supports the "human decides" framing.

---

## Scoring — where the marks actually are

| Area | Weight |
|---|---|
| AI Integration | 25% |
| **LinkedIn content + engagement** | **25%** |
| Prototype quality & UX | 20% |
| Problem understanding | 15% |
| Innovation & creativity | 15% |

Half your score is AI integration + LinkedIn. LinkedIn is worth as much as your entire AI
implementation, and more than prototype quality. Treat posting as a graded deliverable, not
an afterthought.

### LinkedIn engagement bonus (on top of the 25%)
Submit post link + screenshot of likes/comments at deadline.

| Rank by engagement | Bonus |
|---|---|
| Highest | +10 |
| 2nd–3rd | +9 |
| 4th–7th | +8 |
| 8th–15th | +7 |
| Everyone else who posts | +6 |

Just posting gets +6, so never skip a day. Missing a day reduces your streak score and
affects final ranking (FAQ Q26).

---

## LinkedIn playbook

**Mandatory:** post on both 19 Sep and 20 Sep. Tag **Product Space**
(https://www.linkedin.com/company/theproductspace/). If in a 2-person team, *both* members post
separately on both days (FAQ Q13).

**Submit each post here →** https://forms.gle/CkqGP9JK76QvSzwp9

Every post must include:
- That you're in the Agentic AI Hackathon
- That it's conducted by Product Space
- The *problem* you're solving, not just "I'm coding"
- Screenshots / architecture diagram / prototype / demo clip
- A closing question to drive comments (this is what earns the engagement bonus)
- Hashtags: `#AIHackathon #BuildWithAI #ProductSpace`

### Day 1 hook options
- "Everyone is building AI agents. Very few talk about this part."
- "Day 1 of the AI Agent Hackathon. No prior agent experience. Here is what I am learning."
- "What if an AI agent could screen 200 resumes in under 60 seconds?"

### Day 1 body skeleton
Day 1 complete. Kickoff call done. Building an AI agent for **candidate screening and interview
intelligence**. Three things that stood out:
1. The problem is bigger than expected — *[specific pain point]*
2. Not another chatbot — leaning toward a multi-agent setup with specialized roles
3. Problem first, tech second — solving it, not showing off the stack

Closer: "What is one repetitive hiring task you wish an AI agent would handle? It might make its
way into my build." → then the hashtags.

### Day 2 hook options
- "My AI agent ran end to end for the first time today. It mostly worked."
- "Prototype day. Here is what no tutorial warned me about."
- "It is running. HireFlow took its first real resume today."

### Day 2 body skeleton
**What it does right now:** takes *[input]* → routes through *[N]* specialized agents → returns
*[output]* in ~*[time]*.
**Early testing:** working well: *[x]* · needs work: *[y]*.
Be honest about a failure and what edge case it exposed — that authenticity drives comments.
Closer: "Fellow builders: what was your first breakthrough testing an agent? I want the messy ones."

Templates are guidelines — tweak them. Identical posts across 3,000 participants won't win the
engagement bonus.

---

## Submission requirements

**Submit at →** https://theproductspace.in/user-dashboard/submissions/agentic-ai-hackathons
(requires the Product Space account — see blocker above)

| Item | Required? |
|---|---|
| 3-minute demo video explaining solution + prototype | ✅ **Mandatory** |
| Deck / supporting material | Optional |
| Live agent link | Optional |
| n8n JSON file | Optional |

### Google Drive rules — do not get disqualified here
- Upload the 3-min demo video to Google Drive
- Paste the Drive link into the submission form
- **Set sharing to "Anyone with the link"** — if the link isn't publicly accessible your
  submission may be disqualified (FAQ Q18)
- Test the link in a private/incognito window before submitting

### Hard rules
- **One shot.** No edits after submitting (FAQ Q16). Review everything first.
- Must be built for this problem statement. Pre-existing or unrelated projects are rejected (FAQ Q22).
- Fully pre-built solutions not allowed; starter templates are fine.
- All development inside the hackathon window.
- Declare your actual contribution vs AI-generated output.
- Must be a working product — not designs or slides.
- Plagiarism = disqualification.
- Late submissions not accepted.
- Codebase access (GitHub or equivalent) expected.
- Document your process: problem → solution → architecture.

### Certificate requires both
1. Submitted project demo video
2. Completed 2-day LinkedIn streak tagging Product Space

---

## All links

| What | Link |
|---|---|
| Unstop listing | https://unstop.com/hackathons/agentic-ai-hackathon-product-space-1751529 |
| **Product Space registration (mandatory)** | https://theproductspace.in/events/agentic-ai-hackathons |
| Project submission | https://theproductspace.in/user-dashboard/submissions/agentic-ai-hackathons |
| LinkedIn streak form | https://forms.gle/CkqGP9JK76QvSzwp9 |
| Main hackathon page (Notion) | https://app.notion.com/p/projectmanagmentassig/AI-Agent-Hackathon-3a0a0a143f2d80539909e08544d3ac47 |
| Problem statements | https://app.notion.com/p/projectmanagmentassig/Problem-Statement-3a0a0a143f2d80c28e6ae4a59b3124b8 |
| FAQ | https://app.notion.com/p/projectmanagmentassig/Agentic-AI-Hackathon-26-FAQ-2f1a0a143f2d80399a5fc2394d15af24 |
| LinkedIn templates | https://app.notion.com/p/projectmanagmentassig/LinkedIn-Post-Templates-3a0a0a143f2d804c8e6bc3105a9ff82f |
| Resources | https://app.notion.com/p/projectmanagmentassig/Resources-3a0a0a143f2d80f4bf69ccf88e41266d |
| Kickoff call room | https://learn.theproductspace.in/edmingleliveclass/join?token=llRmY2_SJIEFgOQ8 |
| WhatsApp group (you're in this one) | https://chat.whatsapp.com/DDgRgKnLGOcIcmjbKWvnzc |
| WhatsApp group (alt / overflow) | https://chat.whatsapp.com/J6lKo1UFWR8HGuDxdbxq2a |
| Tag on LinkedIn | https://www.linkedin.com/company/theproductspace/ |

**Support / mentorship:** Himanshu Singh, +91 73556 89582 (Product Space team)

---

## Prize note — conflicting numbers

| Source | Winner | 1st RU | 2nd RU |
|---|---|---|---|
| Unstop | ₹5,000 | ₹3,000 | ₹2,000 |
| Product Space Notion | ₹3,000 | ₹2,000 | ₹1,000 |

Unstop also lists "in-kind prizes worth ₹70,000" (total pool ₹80,000). Notion is the host's own
page and was updated more recently, so treat it as authoritative. Worth asking Himanshu to confirm.

---

## Reference: the other 4 problem statements

Not your track — listed for context on what the field is building.

1. **EduPath** — personalized learning & skill-gap agent
2. **FinPilot** — personal finance decision support agent
3. **HireFlow** — candidate screening & interview intelligence ← **yours**
4. **ContractLens** — contract review & obligation tracking agent
5. **TravelPilot** — trip planning & disruption management agent

Note: PS3, PS4, and PS5 all reward "evidence traced back to source." For HireFlow that's the audit
trail (item 13). It's the least glamorous requirement and the easiest place to stand out.

---

## Recommended next actions (Day 2, in order)

1. **Post the Day-2 LinkedIn update** (Variant A in `LINKEDIN-DAY2.md`) in the ~7:00-9:30 PM IST
   window, with a 10s clip of the Kubernetes verifier moment. Stay present the first 90 min.
2. **Submit the streak form** (https://forms.gle/CkqGP9JK76QvSzwp9) once Day 2 is live — it needs
   both day links in a single submission. Team name: `HireFlow`.
3. **Record the 3-min demo video.** Lead with the confrontation arc: ask about Kubernetes → loud
   UNVERIFIED → generated question → paste answer → flips to MET with the `[Why?]` quote → human
   decides. Then the live agent trace and the NL query.
4. **Vercel deploy** — needs Om's login/token. ⚠️ The model proxy at `127.0.0.1:20128` is
   unreachable from Vercel; either point `HIREFLOW_BASE_URL` at a reachable endpoint or ship with
   the recorded `run.json` demo data. See `DEPLOY.md`.
5. **Submit the project** at theproductspace.in: upload the video to Drive as "anyone with the
   link", verify in incognito, attach the GitHub repo, then submit. One shot — review everything
   first. Personal cutoff ~8:00 PM so nothing is rushed against the 11:59 PM wall.

---

## LinkedIn streak tracker

**Day 1 post — LIVE**
https://www.linkedin.com/feed/update/urn:li:activity:7507028227475881985/

Verified on the live post: "Product Space" renders as a real mention link (tagged the correct
company — *Higher Education, Bangalore, 86K followers*, matching theproductspace.in, not the two
similarly named decoys), all three hashtags are live links, architecture diagram attached,
visibility set to anyone on or off LinkedIn.

**Day 2 post** — 🟢 drafted **with visuals captured**. Copy in `LINKEDIN-DAY2.md` (Variant A
recommended), built around the real anti-hallucination money shot. Assets are recorded and verified:

- `assets/clip-verifier-10s.mp4` — 10.0s / 1280×720 / 238 KB, real 1x screen recording of
  REQ-07 going Unverified → Met with the donut ticking 6/10 → 7/10 and the grounded quote shown.
- `assets/proof/01..09*.png` — nine 1672×960 screens (intake, requirements, pool, matrix, activity
  trace, workspace before/after, evaluation report, audit trail), ordered as a carousel in the doc.
- `assets/clip-verifier-poster.png` — poster/thumbnail frame.

Numbers in the post copy were read off the live app, not estimated: 10 requirements from 1 JD,
5 candidates, 50 findings, 45 quotes located in source, **5 claims refused by the verifier**,
21 requirements left open for a human, ~91 s for the pool, no match score anywhere.

Post on 20 Sep in the ~7:00–9:30 PM IST window, then submit the streak form with both links.

### ⚠️ The streak form is ONE submission, not two

https://forms.gle/CkqGP9JK76QvSzwp9

Both "Day 1 post link" and "Day 2 post link" are **required** fields, so the form can only be
submitted after the Day 2 post exists. Do not submit it today.

Fields it asks for:

| Field | Value | Ready? |
|---|---|---|
| Name | Om Prakash Sahu | ✅ |
| Email | os4558966@gmail.com | ✅ |
| Phone Number | — | ⬜ you have this |
| **Team Name** | — | ⚠️ **need to decide** — suggest `HireFlow` |
| Participant 1 · Day 1 link | `urn:li:activity:7507028227475881985` (full URL above) | ✅ |
| Participant 1 · Day 2 link | — | ⬜ tomorrow |
| Participant 2 · Day 1 / Day 2 | leave blank (solo) | ✅ |

Also still needed near the deadline: a screenshot of the post's likes + comments count, since the
engagement bonus is scored at submission time.

---

## Workspace files

| File | What's in it |
|---|---|
| `HACKATHON-CONTROL.md` | This file — logistics, deadlines, rules, links |
| `RESEARCH.md` | Domain, regulatory, competitive, technical research with sources |
| `LINKEDIN-DAY1.md` | Three ready-to-post Day 1 drafts + posting mechanics |
| `LINKEDIN-DAY2.md` | Two ready-to-post Day 2 drafts (the verifier money shot) + form checklist |
| `PLAN.md` | Build plan — dependency map, block cut, time budget, demo-backward shots |
| `DEPLOY.md` | Vercel deploy steps + the 127.0.0.1 model-proxy caveat |
| `assets/` | Day 1 diagram (HTML source + 2400×2400 PNG), post text parts |

## Progress log

- **19 Sep, 15:44** — Verified Unstop registration, WhatsApp group membership, pulled all 5 problem
  statements, FAQ, scoring rubric, LinkedIn templates. Found blocker: no Product Space registration.
- **19 Sep, ~16:30** — Research complete across 5 fronts (competitive landscape, EU AI Act /
  NYC LL144, Amazon bias case, structured-interview validity research, 2026 agent framework state,
  structured-output patterns, LinkedIn algorithm, demo video craft). Day 1 LinkedIn drafts written.
  No code yet — architecture still open for discussion.
- **19 Sep, ~16:20** — Day 1 LinkedIn post published with verified Product Space mention + 2400×2400
  architecture diagram. Permalink recorded above. Discovered the streak form needs both days'
  links in a single submission, so it's deferred to 20 Sep.
- **19 Sep, ~16:30** — Broke PS3 into dependency blocks, wrote `PLAN.md` v1.
- **19 Sep, ~17:00** — Ran the plan past ChatGPT and Gemini for adversarial critique. Both
  independently flagged the same core error: over-indexing on regulatory framing that the rubric
  doesn't reward. Rewrote as `PLAN.md` v2 — repositioned around visible anti-hallucination
  behaviour, added caps 8 + 12 (both cheap), cut cap 5, upgraded the Finding schema, split out the
  evidence verifier as its own block, restaged the money shot. Coverage went 7 → 9 of 13
  capabilities with *less* work.
- **19 Sep, ~17:30** — LangGraph confirmed. Scaffolded `web/` (Next.js 16, Tailwind v4,
  shadcn/ui). Wrote `src/lib/types.ts` — this is block B0, the shared schema for UI + backend.
- **19 Sep, ~18:30** — Built all five screens against the chosen pink/violet reference: floating
  app panel, icon rail, bento grid, violet hero cards, evidence donut. Verified every page in the
  browser. Build + lint clean, 12 routes prerendered. Fixed 4 real bugs found during verification
  (base-ui `asChild`, render-time mutation in the donut, a metric that contradicted its own label,
  and an overstated verification count).
- **19 Sep, ~19:30** — Backend built and running. LangGraph pipeline in `api/`
  (ingest → requirements → review → **verify** → questions → finalise) with one real
  conditional edge on the verifier's output. Verifier is pure code with 15 passing tests.
  Probing the endpoint found three constraints that reshaped the design: no `json_schema`
  support, forced SSE, and ~30 s per call — so the design moved to one batched call per
  candidate run concurrently (91 s total vs ~19 min naive). UI now reads real model output
  from `web/src/data/run.json`; `mock-data.ts` deleted. Build + lint clean.
- **Next** — demo video, Day 2 LinkedIn post, Vercel deploy, submission.

- **19 Sep, ~19:00** — Production pass. Added the missing planned capability (12, NL query) at
  `/ask` — grounded client-side engine, returns real evidence. Made "Run screening" replay the
  real agent trace live (stepper + streaming verifier lines). Replaced fake header chrome with
  honest controls (model badge, working Share, real open-count bell, provenance footer). Added
  404, OG + Twitter images, full metadata. Consolidated into one git repo at the root (secret
  verified out of the commit). Build + lint clean, 15 routes. Capability coverage now 9/13, matching
  the plan. Deploy is prepared (`DEPLOY.md`) but needs Om's Vercel login or a token.

### Day-2 build (continued 19 → 20 Sep)

- **Agent wired to the live model.** The "Ask HireFlow AI" agent is no longer a dummy — it routes
  through the connected model (gpt-5.6-luna) via `lib/llm.ts`, `lib/prompts.ts` and API routes
  `/api/agent/{analyze,ask,question,health}`. The model *decides* verification; the server refuses
  a "met" verdict when the supporting quote can't be located in the answer. Deleted the
  deterministic stand-in (`lib/interview-eval.ts`). Verified with real 24-25s calls in the browser.
- **Five parallel audit agents** driven across the pages to stress the UI/UX; fixed the major bugs
  they found (root-scroll leak, sticky matrix headers, focus rings, pool NL query, 5+ years parsing,
  contradictory activity label, etc.).
- **Agent panel redesigned twice, then embedded.** Consolidated to a single-conversation chat
  (one thread + one composer, Answer/Ask toggle), then embedded it as a sticky right-hand column
  that fits inside the card — the workspace splits into a two-column grid on demand and the panel
  stays fixed at full visible height while the workspace scrolls beside it. Committed `70ddfc0`.
- **Fixed-viewport shell.** Every page fits the screen; `<main>` is the sole scroller so the app
  container stays put and only the data inside scrolls.
- **End-to-end verified in browser:** a real REQ-07 (Kubernetes) analysis (23.7s) flips
  Unverified → Met only after a traceable answer, and propagates live to the coverage donut (6→7),
  the header open-count bell (21→20) and the evaluation report. Build + lint clean throughout.
- **Capability coverage re-assessed: 12/13** (see checklist above) — the interview-answer flow and
  `EvaluationReport` cover #9/#10/#11, which the plan hadn't counted.

- **20 Sep, ~17:50 — model provider switched.** Moved the live agent off the old 9Router proxy
  (`127.0.0.1:20128`, `kr/gpt-5.6-luna`) onto the local OpenAI-compatible gateway on
  `127.0.0.1:8082` running **Muse Spark 1.3** (`opencode/muse-spark-1.3-contributor-free`).
  Updated `web/.env.local`, both `.env.example`s, the fallback defaults in `web/src/lib/llm.ts`
  and `api/hireflow/config.py`, and `DEPLOY.md`. Re-verified all three agent routes against the
  new model: a grounded answer verifies REQ-07 (unverified → met) in **5.2 s** (was ~24 s), a vague
  answer is correctly **refused** (stays unverified, returns missing detail + follow-up), and
  question generation and free-form ask both return grounded output. Build + lint clean.
  Note: `web/src/data/run.json` still records `kr/gpt-5.6-luna` because that batch screening run
  genuinely was produced by that model — left as-is rather than falsifying provenance. Re-run the
  pipeline if the footer/badge should read Muse Spark everywhere.

- **Next (before 20 Sep 11:59 PM):** (1) post Day-2 LinkedIn + submit streak form with both links;
  (2) record the 3-min demo video (lead with the Kubernetes verifier arc); (3) Vercel deploy
  (needs Om's login/token; note the 127.0.0.1 model proxy is unreachable from Vercel — see
  `DEPLOY.md`); (4) upload video to Drive as "anyone with link", incognito-check, submit the
  project form. One-shot submission — review first.
