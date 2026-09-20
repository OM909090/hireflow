# LinkedIn — Day 2 Post (post on 20 Sep 2026)

**Due Day 2.** Worth 25% of your score + ranked engagement bonus (+6 min just for posting).
The Day 2 post is what completes the 2-day streak the certificate requires.

Requirements checklist for the post:
- [ ] Says you're in the Agentic AI Hackathon
- [ ] Says it's conducted by Product Space
- [ ] Tags **Product Space** → https://www.linkedin.com/company/theproductspace/
- [ ] Shows the *product behaviour*, not just "I coded today"
- [ ] Includes a visual (demo clip / screenshot of the money shot)
- [ ] Ends with a question that invites a substantive reply
- [ ] Hashtags: `#AIHackathon #BuildWithAI #ProductSpace`
- [ ] Log BOTH day links in the streak form → https://forms.gle/CkqGP9JK76QvSzwp9

The Day-1 angle was "I'm building a hiring agent that shows its work." Day 2 pays that off with
the real behaviour: **the claim it refused to make.** That's the anti-hallucination money shot from
the plan, now working on camera.

---

## Variant A — "The claim it refused to make" (recommended)

Leads with the payoff of yesterday's promise, teaches the architecture in one line, names a real
engineering surprise, ends on an answerable question.

> Yesterday I said I was building a hiring agent that shows its work.
>
> Today it ran end to end — and the most useful thing it did was refuse to answer.
>
> Day 2 of the Agentic AI Hackathon by Product Space. I'm building HireFlow, an agent for
> candidate screening and interview intelligence. Status: a job description goes in, the agent
> extracts each candidate's evidence, maps it against every requirement, and returns a structured,
> source-linked summary for the whole pool in about 90 seconds.
>
> Here's the moment that made the build worth it.
>
> I asked it: does this candidate meet our "Kubernetes in production" requirement? Their resume
> clearly mentions Docker and containerized microservices. An ordinary screener pattern-matches
> "containers → Kubernetes" and moves on. Mine marked it UNVERIFIED — because nowhere does the
> resume actually say they ran Kubernetes in production. Instead of guessing, it wrote the question
> to close the gap:
>
> "You mention Docker-based microservices — did you personally deploy or operate those on
> Kubernetes in production?"
>
> When I pasted a real answer back in (EKS, Helm charts, on-call for the cluster), it re-checked,
> found the supporting line, and only then flipped the requirement to MET — with the exact quote it
> relied on shown behind a [Why?] button. The human still makes the call: Shortlist / Review /
> Reject. No black-box match score.
>
> The architecture in one sentence: the LLM proposes evidence, and my code validates it. The
> verifier is plain Python with no model call — so it physically can't fabricate a citation.
>
> What no tutorial warned me about: the model API had no structured-JSON mode, forced streaming,
> and ran ~30s per call. Naive one-call-per-requirement would've taken ~19 minutes to screen five
> candidates. I redesigned around one batched call per candidate, run concurrently — 91 seconds.
> Most of the real work was the plumbing, not the prompt.
>
> With another week: PDF ingestion and live JD upload so a recruiter can point it at their own role.
>
> Builders — what's a moment your agent did something *right* by admitting it didn't know? I'm
> collecting the honest ones.
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## Variant B — "Short and clean"

Same money shot, faster to post. Lower ceiling, comfortably earns the streak + engagement floor.

> It runs. And the best thing it did today was say "I can't verify that."
>
> Day 2 of the Agentic AI Hackathon by Product Space. HireFlow — my candidate-screening agent —
> went end to end: JD in, evidence extracted per candidate, mapped against each requirement,
> structured summary out in ~90 seconds for the whole pool.
>
> The money moment: a resume mentions Docker. I asked whether the candidate meets a *Kubernetes in
> production* requirement. Instead of pattern-matching containers → Kubernetes, the agent marked it
> UNVERIFIED and generated the exact interview question to close the gap. It only flipped to MET
> after I fed back an answer it could trace to a specific line — shown behind a [Why?] button.
>
> One-sentence architecture: the LLM proposes evidence, my code validates it. The verifier makes no
> model call, so it can't invent a citation.
>
> The humbling part: the model API had no structured-output mode, forced streaming, and ~30s
> latency per call. The prompt was easy; making it fast and honest was the actual project.
>
> Recruiters — would you trust a shortlist more if every claim showed the line it came from, and
> the system flagged what it *couldn't* confirm?
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## The visual to attach (pick one — this drives dwell time)

Best → worst for this post:
1. **10-second screen clip** of the money shot: ask about Kubernetes → UNVERIFIED (loud yellow) →
   generated question → paste answer → flips to MET with the [Why?] quote. This is shot 4/5 from
   the demo, reused with zero extra work.
2. **One screenshot** of the candidate workspace with the agent panel open on REQ-07, showing the
   verdict bubble "Unverified → Met · Verified by HireFlow AI" and the located quote.
3. **The evaluation report** screenshot (Resume / Interview / Final columns) — shows the whole
   pipeline output at a glance.

Keep the internal model name out of the public post — say "the model" / "an LLM," not the proxy id.

---

## Posting mechanics (the part that earns the bonus)

- **Warm up first:** 10-15 min before posting, leave substantive comments on 5-8 posts in your feed.
- **Timing:** Indian evening ~7:00-9:30 PM IST is strongest for this audience. Post Day 2 within
  that window on 20 Sep — the streak is date-specific, don't let it slip past midnight.
- **First 90 minutes:** stay present. Reply to every comment within 15-30 min, and reply with a
  question back, not "thanks" — comment depth is what's weighted.
- **Distribute:** share to 2-3 relevant WhatsApp/Discord groups (not the hackathon group — that's
  announcement-only).

## Then close out the streak form (ONE submission, both links)

https://forms.gle/CkqGP9JK76QvSzwp9 — this form needs Day 1 AND Day 2 links, so submit it only
after Day 2 is live.

| Field | Value |
|---|---|
| Name | Om Prakash Sahu |
| Email | os4558966@gmail.com |
| Phone | (yours) |
| Team Name | HireFlow |
| Day 1 link | https://www.linkedin.com/feed/update/urn:li:activity:7507028227475881985/ |
| Day 2 link | (paste after posting) |
| Participant 2 | leave blank (solo) |

Also screenshot the Day-1 AND Day-2 like/comment counts near the 11:59 PM deadline — the
engagement bonus is scored at submission time.
