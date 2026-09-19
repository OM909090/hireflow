# HireFlow — Research Brief

Research for PS3: AI Candidate Screening & Interview Intelligence Agent
Compiled 19 Sep 2026. Sources linked inline. Content was rephrased for compliance with licensing restrictions.

---

## 1. The headline finding

**The regulatory angle is your moat, and almost nobody in a 3,000-person hackathon will use it.**

AI recruitment is not a normal AI product category. It is a *legally classified high-risk* category
in the EU and already regulated in NYC. HireFlow's requirement #13 — "maintain an audit trail
showing which candidate information was used to generate each insight" — is not a nice-to-have the
organizers tacked on. It is the single requirement that maps directly onto real law, and it is the
one most teams will skip because it isn't flashy.

Build the boring requirement well and you have a defensible story that a scoring rubric weighted
25% on "AI Integration" and 15% on "Innovation" can actually reward.

---

## 2. Competitive landscape — what already exists

The space is crowded and mature. Established players, by function:

| Function | Who owns it |
|---|---|
| Conversational high-volume screening | Paradox (Olivia), Humanly |
| Structured AI video interviewing | HireVue |
| Agentic sourcing | SeekOut, Findem, hireEZ, Juicebox |
| Talent intelligence / skills graphs | Eightfold AI |
| Candidate prioritization on Workday | HiredScore |
| Structured scorecard hiring | Greenhouse |
| AI-native ATS | Ashby |
| Resume scoring & rediscovery | Skima AI, SortResume.ai |

Sources: [Lever's 2026 roundup](https://www.lever.co/insights/best-ai-recruiting-tools),
[Rework's agent comparison](https://resources.rework.com/tools/ai-agents/best-ai-agents-for-recruiting-2026),
[Noon.ai](https://www.noon.ai/blog/articles/214-best-ai-recruiting-software-2026)

**What the current generation of screening tools actually does** (per
[GoPerfect](https://www.goperfect.com/blog/top-resume-screening-platforms-for-2026-what-recruiting-teams-actually-need)):
connect to the ATS, read applicants on arrival, score against the JD, auto-approve top candidates,
auto-decline poor fits with a personalized rejection, and hold borderline cases for human review.

**The gap:** they produce a score. They do not produce a *defensible* score. Nothing in the market
description above emphasizes showing which line of which resume produced which conclusion.

---

## 3. Regulatory reality — why "explainable" is the product

### EU AI Act
Recruitment AI is explicitly named high-risk. Annex III, point 4(a) covers systems used for
recruitment or selection — specifically including analysing and filtering applications and
evaluating candidates ([Regulation (EU) 2024/1689 summary](https://resumescreening.ai/eu-ai-act-compliance)).

Employment AI sits at the top of the Annex III high-risk list because it directly affects
livelihood, non-discrimination, and access to employment
([CISO guide](https://beyondscale.tech/blog/eu-ai-act-hr-employment-ai-ciso-compliance-guide)).

Obligations include **mandatory human oversight and transparency toward employees and their
representatives** ([Crowell legal overview](https://www.crowell.com/en/insights/client-alerts/artificial-intelligence-and-human-resources-in-the-eu-a-2026-legal-overview)).

Timing: standalone high-risk (Annex III) compliance obligations were deferred to **2 December 2027**
under the Digital Omnibus agreement — described by the EU's own Apply AI Alliance community as
[a prep window, not a free pass](https://futurium.ec.europa.eu/hr/apply-ai-alliance/community-content/eu-ai-act-and-recruitment-why-december-2027-extension-prep-window-not-free-pass).

Penalties under Article 99 reach up to €15M or 3% of global turnover for high-risk
non-compliance, and up to €35M or 7% for prohibited practices
([Annex III HR guide](https://www.teamazing.com/blog/ai-act-annex-iii-hr-high-risk/)).

### NYC Local Law 144 — already in force
Effective 5 July 2023. Before using an automated employment decision tool, an employer must:
- have an independent bias audit conducted within the prior year
- publish a summary of the audit results publicly
- notify candidates at least 10 business days before the tool is used, including how to request
  a reasonable accommodation

Sources: [NYC DCWP](https://www.nyc.gov/site/dca/workers/job-hunters.page),
[Gibson Dunn on the FAQs](https://www.gibsondunn.com/nyc-artificial-intelligence-law-key-takeaways-from-newly-released-faqs/)

### Why this shapes architecture, not just the pitch
An audit obligation means every output needs a provenance chain. You cannot retrofit that. If your
agent emits "Strong fit — 87%" with no pointer to the evidence, the product is unshippable in two
of the world's largest hiring markets. If it emits "Meets requirement 3 (5+ yrs Python) — evidence:
resume p.1, 'Senior Python Engineer, 2019–2026'", it is auditable by construction.

---

## 4. The cautionary tale — Amazon, 2014–2018

Amazon built an internal resume-screening tool and scrapped it after discovering it systematically
disadvantaged women in technical roles. Specifics:
- down-ranked resumes containing the word "women's" (as in "women's rugby team")
- penalized graduates of two all-women's colleges
- favored verb patterns more common in men's resumes, such as "executed" and "captured"

Source: [ACLU](https://www.aclu.org/news/womens-rights/why-amazons-automated-hiring-tool-discriminated-against),
[Cornell JLPP](https://publications.lawschool.cornell.edu/jlpp/2024/11/21/ai-hr-algorithmic-discrimination-in-the-workplace/)

The ACLU's framing is the sharpest summary available: tools like this do not remove human bias,
they launder it through software.

Two quotable lessons from [Hubert.ai's 2026 retrospective](https://www.hubert.ai/insights/why-amazons-ai-driven-high-volume-hiring-project-failed):
an AI trained on your history reproduces your history including its bias; and a shortlist you
cannot explain is a shortlist you cannot defend.

Recurring failure categories across documented AI HR incidents: biased training data, proxy
discrimination against protected classes, disparate impact on age and disability, vendor liability
when a third-party tool does the screening, and non-compliance with bias-audit and notice laws.

**Design implication for HireFlow:** do not train or tune on "who we hired before." Score against
the *stated requirements in the job description* only. That is both better engineering and a
direct answer to the Amazon failure mode.

---

## 5. Evidence base for the interview half of the product

Capabilities 7–11 (generate role-specific questions, follow-ups, evaluation reports) are backed by
decades of personnel selection research, which is unusual for a hackathon feature set.

Structured interviews — same questions for every candidate, anchored scoring, ratings recorded
independently before group discussion — substantially outperform unstructured conversations at
predicting job performance. Reported corrected validity is around **r = 0.51 for structured vs
r = 0.38 for unstructured**, making a structured panel roughly twice as predictive as the same
panel talking freely.

Sources: [100Hires on scorecards](https://100hires.com/interview-scorecard.html),
[Deeper Signals on Schmidt & Hunter's 85-year synthesis](https://www.deepersignals.com/guides-explainers/structured-vs-unstructured-interview),
[Sprad's review of 8 studies](https://sprad.io/blog/structured-vs-unstructured-interviews-8-studies-that-prove-structure-wins-and-where-it-doesn-t)

An unstructured interview largely measures how the conversation *felt* — shaped by charisma,
confidence, and similarity to the interviewer, none of which reliably predict performance
([Hubert.ai](https://www.hubert.ai/insights/structured-vs-unstructured-interviews-what-the-evidence-says)).

**Pitch line this unlocks:** HireFlow isn't automating hiring. It is making structured interviewing
cheap enough that teams actually do it. That reframes the whole product from "replace the recruiter"
to "give the recruiter the method that research says works."

---

## 6. Problem-scale numbers (use these in the LinkedIn post and the demo)

| Stat | Source |
|---|---|
| Employers average ~**11.2 seconds** per resume | InterviewPal study, via [Forbes, May 2026](https://www.forbes.com/sites/courtneyconnley-hampton/2026/05/08/in-ai-age-recruiters-spend-11-seconds-a-resume-heres-what-they-notice/) |
| **42%** of HR pros spend under 10 seconds on an initial resume; ~**65%** form a first impression in under 15 seconds | [Novorésumé HR survey](https://novoresume.com/career-blog/hr-survey) |
| Resumes that pass the first pass get ~**1 min 34 sec** total | [The Interview Guys](https://blog.theinterviewguys.com/beyond-7-seconds/) |
| Screening stage takes **8–9 days** | SHRM 2025, via [Stealth Agents](https://stealthagents.com/research/recruiter-screening-time-statistics-2026) |
| A single bad hire can cost up to **$240,000** | [daily.dev](https://recruiter.daily.dev/resources/write-technical-interview-scorecards-reduce-hiring-bias/) |

Useful tension to build the narrative on: 11 seconds of attention allocated to a decision worth up
to a quarter million dollars. That is the problem statement in one sentence.

One note of caution — the "6 seconds per resume" figure gets recycled constantly and is
[frequently misread](https://www.empireresume.com/blog/how-long-hiring-managers-review-resumes/).
Use the 11.2s figure with its attribution rather than the folk version.

---

## 7. Technical landscape — agent frameworks as of 2026

The market moved significantly in H1 2026. Anything you read from 2025 is stale.

| Framework | State | Fit for HireFlow |
|---|---|---|
| **LangGraph** | 1.0 GA (Oct 2025), now ~v1.0.10. Graph/state-machine model, checkpointing, durable execution. Steepest learning curve. | Best fit if you want auditability and resumability. The graph *is* the audit trail. |
| **CrewAI** | 1.0 GA, ~44.6k stars, v1.10.x with native MCP and A2A. Role-based crews, YAML config. | Fastest scaffolding. Maps naturally onto "Extractor / Mapper / Interviewer / Auditor" roles. Best speed-to-demo. |
| **OpenAI Agents SDK** | Minimal, shipping multiple releases per week. Imperative handoff chains. | Lowest friction if you're OpenAI-only. Provider-locked. |
| **Google ADK 2.0** | Multi-language (Python, Go, TS), native Google platform integration. | Overkill for 30 hours. |
| **Mastra** | TypeScript-first, Vercel-native. | Good if you want the UI and agents in one TS repo. |
| **Smolagents** | Sub-1,000 LOC, code-first. | Good if you want to show you understand the primitives. |
| **AutoGen** | ⚠️ **Maintenance mode.** No release in ~6 months. | Avoid. Plan migrations away from it. |
| **Swarm** | ⚠️ Archived. | Avoid. |

Sources: [RaftLabs comparison](https://staging.raftlabs.com/blog/ai-agent-framework-comparison),
[Digital Applied on open-source frameworks](https://www.digitalapplied.com/blog/open-source-agent-frameworks-5-compared-2026),
[Let's Data Science](https://letsdatascience.com/blog/ai-agent-frameworks-compared),
[Requesty SDK comparison](https://www.requesty.ai/blog/best-ai-agent-sdks-compared-2026-langchain-crewai-openai-anthropic-google)

**Directly relevant framing** from [Codebridge](https://www.codebridge.tech/articles/choosing-a-multi-agent-framework-langgraph-crewai-microsoft-agent-framework-or-openai-agents-sdk):
by 2026, picking a framework carries the weight of picking a database. Get it wrong and you end up
with workflows that can't resume after a crash, **decisions that can't be audited**, and tool calls
that can't pause for human review.

That sentence describes HireFlow's three hardest requirements. Worth quoting in the demo.

RaftLabs also names the threshold for going custom: more than 50 tools, sub-200ms latency needs, or
**regulated industries where you need full audit control**. Hiring is a regulated industry. Worth
knowing, though for a 30-hour build a framework is still the right call.

---

## 8. Structured output — the technique that makes the audit trail work

This is the most important technical pattern for this problem statement.

**Don't use JSON mode, don't regex-parse.** JSON mode guarantees valid JSON, not *correct* JSON —
ask for an invoice and it will happily return well-formed JSON describing soup
([alexcloudstar](https://alexcloudstar.com/blog/structured-outputs-llm-developer-guide-2026/)).

The 2026 consensus approach ([zglg.work](https://zglg.work/en/ai/guides/structured-outputs-guide)):
use provider-native structured output features, then validate in your own code. For critical
workflows pair schemas with retries, typed parsers, refusal handling, and evals that include
malformed input. Regex-parsing LLM output in 2026 is compared to hand-rolling your own HTTP client
([effloow](https://effloow.hashnode.dev/llm-structured-outputs-json-schema-production-guide-2026)).

**The key pattern — "visible-only extraction with citations"**
([Reducto](https://llms.reducto.ai/json-schema-extraction-with-citations)): extract only what is
literally present in the document, and compute derived values downstream in your own code. This
reduces model drift and *simplifies auditing*.

This is precisely how you satisfy requirement #13 and requirement #4 simultaneously:

- **Extraction layer** returns only spans that exist in the resume, each with a source pointer
  (file, page, character range or quoted snippet)
- **Anything the model cannot find becomes an explicit `missing` or `unverified` field**, not a
  guess — that *is* requirement #4 ("identify missing or unclear information requiring validation")
- **Scoring/mapping happens in deterministic code** over those cited spans, not inside a prompt
- The audit trail falls out of the architecture for free rather than being a logging afterthought

[MightyBot](https://mightybot.ai/blog/structured-outputs-for-enterprise-llms/) frames the same
stack: enforced schemas make output parseable; evidence pointers, deterministic checks, and review
routing make it *reliable*.

**Consequence:** hallucination stops being a risk you mitigate and becomes a state you represent.
A field is either cited or flagged. There is no third option. That is a genuinely strong demo
moment — show the agent *refusing* to assert something it can't source.

---

## 9. LinkedIn strategy — this is 25% of your score

Treat this as an engineered deliverable. The mechanics as of 2026:

**The first 60–90 minutes decide everything.** LinkedIn tests a new post against roughly 5–10% of
your audience and uses reaction speed, comment depth, and dwell time to decide whether to expand
reach or bury it. Posts that don't get early traction stall, often permanently.
([Hyperclapper](https://www.hyperclapper.com/blog-posts/why-quick-linkedin-engagement-boosts-reach))

**What the 2026 algorithm actually weights:** dwell time, saves, and comment *depth* — not raw
likes. Comments are modeled separately from reactions. Tactics that worked in 2024 are now actively
penalized. ([Sides Media](https://sidesmedia.com/linkedin-algorithm/),
[eClincher](https://www.eclincher.com/articles/how-the-linkedin-algorithm-works-in-2026-a-guide-for-b2b-growth))

**Practical checklist:**
1. Spend 10–15 minutes commenting on others' posts *before* you publish — warms your distribution
2. Hook must earn the "see more" click. Dwell time starts there.
3. Post something that invites a *substantive* reply, not "thoughts?" — depth is measured
4. Reply to every comment within 15–30 minutes. Replies re-activate the post's distribution window.
5. Add an image (architecture diagram, screenshot) — increases dwell time
6. Don't post and disappear. The first 90 minutes need you present.

**Timing.** Global tracking data puts peak at Friday 12:00–13:00 UTC and the 06:00–07:00 UTC
commute window ([Taplio, from 200k+ posts](https://taplio.com/blog/linkedin-algorithm)). But your
audience here is overwhelmingly Indian students and early-career professionals plus the Product
Space team. 06:00–07:00 UTC is 11:30 AM–12:30 PM IST; the Indian evening scroll (roughly
7:00–9:30 PM IST) is likely a better bet for this specific audience. Judge by your own audience,
not the global average.

**Hackathon-specific leverage:** ~3,000 participants are all posting with the same templates and
the same three hashtags on the same two days. Engagement bonus is ranked, so the differentiator is
being *un*-templated. Specifics beat polish: a real screenshot, a real number, a real failure.

---

## 10. Demo video — 3 minutes, and judges are tired

They will have watched 30+ submissions before yours
([Reskilll](https://reskilll.com/blogs/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/)).

**Structure (~180 seconds):**

| Segment | Time | Content |
|---|---|---|
| Problem | 0:00–0:25 | The 11-second stat. One concrete recruiter moment. No preamble, no title card. |
| What it is | 0:25–0:40 | One sentence. "HireFlow screens candidates and shows you exactly why." |
| **Live demo** | 0:40–2:15 | Real product running. Upload JD + resumes → mapping → the *audit trail* moment → interview questions → evaluation report. |
| Architecture | 2:15–2:40 | One diagram. Agent roles + where evidence is captured. |
| Why it matters / next | 2:40–3:00 | High-risk classification, human stays in the loop, what you'd build next. |

**Rules from the guidance:**
- Demo should be roughly **half the total runtime** — do not let setup eat the clock
  ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/))
- If you have extra time, extend the demo and next-steps, never the intro
- Clear narrative beats production polish; a voiceover over screen capture is fine
  ([Colosseum](https://blog.colosseum.com/perfecting-your-hackathon-submission/))
- Treat it as a short startup pitch, not a feature tour
- It should be a **demo of the thing running**, not a slide presentation ([MLH](https://guide.mlh.io/general-information/judging-and-submissions/judging-plan))
- [Devpost's](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video) best tip:
  decide the video's story during ideation, not at the end. The story *is* the pitch.

**The one moment to nail:** show HireFlow declining to assert something it cannot evidence, and
show the citation next to something it can. That single screen recording does more for "AI
Integration" and "Innovation" than any amount of feature breadth.

---

## 11. Strategic read — how to not be one of 600 identical submissions

Assume PS3 is popular and most submissions look like: upload resume → similarity score against JD →
ranked list → maybe a chatbot. That is a commodity build and it maps to maybe 5 of the 13 required
capabilities.

The four capabilities almost everyone will skip, and why each is worth disproportionate credit:

| # | Capability | Why it wins |
|---|---|---|
| 13 | Audit trail tying each insight to source data | Maps to EU AI Act + LL144. Falls out of visible-only extraction. Nobody else will demo it. |
| 4 | Flag missing/unclear info needing validation | The anti-hallucination move. Most builds let the model guess. |
| 8 | Follow-up questions when an answer needs deeper validation | Shows the agent *reasoning about sufficiency of evidence*, not just generating text. |
| 10 | Identify unanswered evaluation areas after an interview | Closes the loop. Turns a one-shot tool into a process. |

**Positioning sentence to carry through post, demo, and deck:**
Most AI screening tools tell you *who* to interview. HireFlow tells you *why*, shows you the
evidence, and flags what it doesn't know.

That positioning is defensible, legally literate, technically distinctive, and it is honest about
keeping humans in the decision — which is the organizers' own stated goal for this problem
statement.

---

## 12. Open questions for our architecture discussion

Not decided yet — for us to work through before any code:

1. **Framework:** CrewAI for speed-to-demo, or LangGraph because durable state *is* the audit
   trail? Leaning LangGraph on fit, CrewAI on clock.
2. **Scope:** 13 capabilities in ~30 hours is not realistic at depth. Which thin vertical slice
   demos end to end? Proposal: capabilities 1→2→3→4→6→13 as the spine, plus 7 for the interview
   half.
3. **Evidence model:** quoted snippet, or character offsets with a resume viewer that highlights?
   The latter is a far better demo and meaningfully more work.
4. **Deterministic vs LLM scoring:** how much of requirement-mapping lives in code vs the prompt?
5. **Storage:** in-memory for the demo, or real persistence so the audit trail survives a reload?
6. **Bias posture:** do we actively demonstrate *not* using historical hire data, and show a
   blind-review toggle? Strong differentiator, small effort.
7. **What we deliberately fake:** decide now, and say so honestly in the video. Rules require
   declaring actual contribution vs AI-generated output.
