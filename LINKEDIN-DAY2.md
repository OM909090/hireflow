# LinkedIn — Day 2 Post (post on 20 Sep 2026)

**Due Day 2.** Worth 25% of your score + ranked engagement bonus (+6 min just for posting).
This post completes the 2-day streak the certificate requires.

Checklist for the post:
- [ ] Says you're in the Agentic AI Hackathon
- [ ] Says it's conducted by Product Space
- [ ] Tags **Product Space** → https://www.linkedin.com/company/theproductspace/
- [ ] Shows the *product working*, with visuals
- [ ] Ends with a question that invites a substantive reply
- [ ] Hashtags: `#AIHackathon #BuildWithAI #ProductSpace`
- [ ] Log BOTH day links in the streak form → https://forms.gle/CkqGP9JK76QvSzwp9

Day 1 promised "a hiring agent that shows its work." Day 2 proves it. The app is built and
running — lead with what it does and let the visuals carry it.

---

## Every number below is real — pulled from the running app

Captured from the live screens in `assets/proof/` (do not invent or round these up):

| Claim | Value | Proof shot |
|---|---|---|
| Requirements parsed from one JD | **10** (6 must-have, 4 nice-to-have) | `02-requirements.png` |
| Candidates screened | **5** | `03-pool.png` |
| Evidence checks run | **50** (10 reqs × 5 candidates) | `01-intake.png`, `05-activity.png` |
| Quotes located in source | **45** | `05-activity.png` |
| **Claims refused by the verifier** | **5** | `05-activity.png` |
| Requirements flagged for a human | **21** across 5 candidates | `03-pool.png` |
| Whole pool screened in | **~91 seconds** | run trace |
| Overall match score shown | **none, by design** | `04-matrix.png` |

---

## Variant A — "The claim it refused to make" (recommended)

> Yesterday I said I was building a hiring agent that shows its work.
>
> Today it's running — and the most useful thing it did was refuse to answer.
>
> Day 2 of the Agentic AI Hackathon by Product Space. HireFlow takes a job description and a stack
> of resumes, and turns them into evidence you can audit. One JD became 10 individually addressable
> requirements. Five candidates, 50 evidence checks, about 90 seconds for the whole pool.
>
> Here's the moment that made the build worth it.
>
> One candidate's resume clearly mentions Docker and containerised microservices. I asked whether he
> meets our "Kubernetes in production" requirement. An ordinary screener pattern-matches containers
> to Kubernetes and moves on. Mine marked it UNVERIFIED — because nothing in that resume actually
> says he ran Kubernetes in production. It said what was missing, then wrote the question to close
> the gap:
>
> "Your resume describes containerisation and cloud deployment — did you use Kubernetes in a
> production environment, and if so, walk me through the system and your responsibilities?"
>
> I pasted his real answer back in: EKS, Helm charts, rolling deploys, rolled back a bad release
> with kubectl, on-call for that cluster for a year. It re-checked, found the line that supported
> the claim, and only then moved the requirement to MET — showing the exact quote it relied on.
> Coverage went from 6/10 to 7/10 on screen, and the open-gap count dropped by one.
>
> Across the run it refused 5 of its own proposed claims because it couldn't locate them in the
> source document. Those 5 became interview questions instead of conclusions.
>
> The architecture in one sentence: the model proposes evidence, and my code validates it. The
> verifier is plain Python with no model call in it — so it structurally cannot fabricate a
> citation. Every claim carries a [Why?] button with the source text behind it.
>
> And there's no overall match score anywhere in the product. It organises evidence and names what
> it can't confirm. The human still clicks Shortlist, Needs review, or Reject.
>
> 21 requirements across those 5 candidates are still flagged as needing a human. That's not a
> failure state — that's the feature.
>
> With another week: PDF ingestion, and letting a recruiter upload their own JD and resumes.
>
> Recruiters and hiring managers — if a shortlist showed you the exact line behind every claim, and
> openly flagged what it couldn't verify, would you trust it more than a score out of 100?
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## Variant B — "Short and clean"

> It runs. And the best thing it did today was say "I can't verify that."
>
> Day 2 of the Agentic AI Hackathon by Product Space. HireFlow turns a job description plus a stack
> of resumes into auditable evidence: 1 JD became 10 requirements, 5 candidates, 50 evidence checks,
> about 90 seconds for the pool.
>
> The money moment: a resume mentions Docker. I asked whether the candidate meets a "Kubernetes in
> production" requirement. Instead of pattern-matching containers to Kubernetes, it marked the
> requirement UNVERIFIED, said exactly what was missing, and generated the interview question to
> close it. When I fed back a real answer, it flipped to MET — and showed the quote it used.
>
> Across the run it refused 5 of its own claims because it couldn't find them in the source. Those
> became questions instead of conclusions.
>
> One-sentence architecture: the model proposes evidence, my code validates it. The verifier makes
> no model call, so it can't invent a citation. And there's no match score anywhere — the human
> clicks Shortlist, Needs review, or Reject.
>
> Recruiters — would you trust a shortlist more if every claim showed the line it came from?
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## Visuals — recorded and ready ✅

### 1. The hero: 10-second clip
**`assets/clip-verifier-10s.mp4`** — 10.1s · 1280×734 · H.264 · 256 KB · silent.
A real screen recording at **1x speed, start to finish, nothing sped up or cut**. The model call
genuinely took ~5.9 seconds and you watch the counter run.

| Time | What plays |
|---|---|
| 0.0–1.0s | Donut reads **6/10**, REQ-07 **Unverified**, banner "**3** requirements still need validation", the candidate's answer sitting in the composer |
| 1.0–6.9s | Answer submitted. A live counter ticks "Checking against REQ-07… 3.3s" while the model works |
| ~6.9s | **The flip** — donut **6/10 → 7/10**, Met 6 → 7, badge → **Met**, banner drops to "**2** requirements still need validation" |
| 6.9–10.1s | Verdict: **Unverified → Met · ✓ Verified by HireFlow AI**, the reason, and the grounded quote *"I deployed our order services on AWS EKS"* marked **"quote located in the interview answer"** |

It works as a hook because a number visibly changes and the system cites the line it used.

### 2. Carousel — 9 full-resolution screens (1672×960) in `assets/proof/`

Best order if you post a carousel. Suggested caption per slide:

| # | File | Slide caption |
|---|---|---|
| 1 | `01-intake.png` | One JD + 5 resumes in. 10 requirements out. |
| 2 | `02-requirements.png` | Every requirement traced back to the line of the JD it came from. |
| 3 | `06-workspace-before.png` | Docker on the resume. Kubernetes required. Verdict: **Unverified** — and here's what's missing. |
| 4 | `07-verified-verdict.png` | Answer supplied → **Met**, with the exact quote it relied on. 6/10 → 7/10. |
| 5 | `05-activity.png` | **5 claims refused** by the verifier. Those became interview questions. |
| 6 | `08-evaluation-report.png` | Resume / Interview / Final — and it says outright when evaluation is incomplete. |
| 7 | `09-audit-trail.png` | Timestamped audit of every status change. |
| 8 | `04-matrix.png` | 5 candidates × 10 requirements. No scores. You decide. |
| 9 | `03-pool.png` | 21 requirements still need a human. That's the feature. |

If you'd rather post a single image, use **`07-verified-verdict.png`**. If a single video, use the clip.

All assets were re-captured after removing the decorative model badge from the header, so the chrome
is clean and consistent across the clip and all nine screens. Model provenance still appears where
it's actually evidence — the footer run stamp and each finding's `[Why?]` row — which is the audit
trail, not decoration.

Don't name model providers or endpoints in the post copy — say "the model". Keep the internals internal.

---

## Posting mechanics (this is what earns the bonus)

- **Warm up:** 10–15 min before posting, leave substantive comments on 5–8 posts in your feed.
- **Timing:** Indian evening ~7:00–9:30 PM IST. Post on **20 Sep** — the streak is date-specific.
- **First 90 minutes:** stay present. Reply to every comment in 15–30 min, and reply with a question
  back rather than "thanks" — comment depth is weighted.
- **Distribute:** share to 2–3 relevant WhatsApp/Discord groups (not the hackathon group).
- **Video beats images** for reach here, and the clip needs no sound or captions to land.

## Then close the streak form (ONE submission, both links)

https://forms.gle/CkqGP9JK76QvSzwp9 — needs Day 1 AND Day 2 links, so submit only after Day 2 is live.

| Field | Value |
|---|---|
| Name | Om Prakash Sahu |
| Email | os4558966@gmail.com |
| Phone | (yours) |
| Team Name | HireFlow |
| Day 1 link | https://www.linkedin.com/feed/update/urn:li:activity:7507028227475881985/ |
| Day 2 link | (paste after posting) |
| Participant 2 | leave blank (solo) |

Screenshot both posts' like/comment counts near the 11:59 PM deadline — the engagement bonus is
scored at submission time.
