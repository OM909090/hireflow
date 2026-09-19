# LinkedIn — Day 1 Post (19 Sep 2026)

**Due today.** Worth 25% of your score plus ranked bonus points (+6 minimum just for posting).

Requirements checklist for every post:
- [ ] Says you're in the Agentic AI Hackathon
- [ ] Says it's conducted by Product Space
- [ ] Tags **Product Space** → https://www.linkedin.com/company/theproductspace/
- [ ] Explains the *problem*, not just "I'm building"
- [ ] Includes a visual (diagram / screenshot / whiteboard photo)
- [ ] Ends with a question that invites a substantive reply
- [ ] Hashtags: `#AIHackathon #BuildWithAI #ProductSpace`
- [ ] Logged in the streak form → https://forms.gle/CkqGP9JK76QvSzwp9

---

## Variant A — "The 11 seconds" (recommended)

Leads with a concrete number, lands on a real insight, asks a question people can actually answer
from experience. Best dwell-time hook of the three.

> Employers spend about 11 seconds on a resume.
>
> A bad hire can cost up to $240,000.
>
> That gap is what I'm building for this weekend.
>
> Day 1 of the Agentic AI Hackathon by Product Space. I picked the candidate screening problem
> statement, and spent today on research instead of code. Three things reframed the whole build
> for me.
>
> **1. This isn't a normal AI product category.**
> Under the EU AI Act, AI used to filter job applications and evaluate candidates is classified
> high-risk. NYC already requires an independent bias audit and 10 business days' notice to
> candidates before an automated tool assesses them. So "it works" isn't the bar. "You can explain
> why it decided that" is the bar.
>
> **2. Amazon already ran this experiment.**
> They built a resume screener, trained it on who they'd hired before, and it learned to penalize
> resumes containing the word "women's." They scrapped it. The lesson I keep coming back to: a
> shortlist you can't explain is a shortlist you can't defend.
>
> **3. So the interesting problem isn't scoring. It's evidence.**
> Ranking resumes is a solved commodity. What's not solved: every claim the agent makes should
> point back to the exact line it came from — and when it can't find something, it should say
> "unverified" instead of guessing.
>
> That changes the architecture. Extraction only returns what's literally in the document, with a
> source pointer. Anything missing gets flagged for a human rather than filled in by the model.
> Scoring happens in deterministic code over cited evidence, not inside a prompt.
>
> Not building a tool that decides who to hire. Building one that shows its work.
>
> Tomorrow: the prototype, and finding out which parts of that plan survive contact with reality.
>
> Recruiters and hiring managers — what's the one thing you wish you could see *next to* a
> candidate score to actually trust it?
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## Variant B — "The contrarian take"

Higher risk, higher ceiling. Opens against the grain, which drives comment depth. Use if you're
comfortable defending it in the replies.

> Everyone's building AI that screens candidates faster.
>
> After a day of research, I think that's the wrong goal.
>
> Day 1 of the Agentic AI Hackathon by Product Space. I'm on the candidate screening problem
> statement, and the thing that surprised me is that speed is already solved. Resume parsers,
> match scores, ranked shortlists — the market has a dozen mature tools doing this well.
>
> What nobody has solved is **defensibility**.
>
> AI that filters job applications is legally high-risk in the EU. NYC requires bias audits and
> advance notice to candidates. And the most famous failure in this space — Amazon's scrapped
> screener, which learned to penalize the word "women's" — didn't fail because it was slow. It
> failed because it was confident and unexplainable.
>
> So I'm building the unfashionable requirement: every single insight has to cite the exact source
> it came from, and the agent has to be able to say "I don't know, a human should check this."
>
> Three design decisions that came out of that:
> → Extract only what's literally in the document. No inference at the extraction layer.
> → Missing information becomes a visible flag, not a silent guess.
> → Requirement matching happens in code over cited evidence, not inside a prompt.
>
> Slower to build. Much harder to demo in 3 minutes. But it's the version that could actually ship.
>
> Day 2 is prototype day. We'll see how much of this principle survives a deadline.
>
> If you've ever been screened out by an automated system and never found out why — what would you
> have wanted to see?
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## Variant C — "Short and clean"

If you're short on time. Still specific, still on-brief, faster to post. Lower ceiling but
comfortably earns the streak and the +6.

> Day 1 of the Agentic AI Hackathon by Product Space. No code yet — just research.
>
> I picked the candidate screening problem statement. Here's what changed my plan:
>
> Employers spend roughly 11 seconds per resume. Meanwhile AI that filters job applications is
> classified high-risk under the EU AI Act, and NYC already requires bias audits plus 10 days'
> notice to candidates.
>
> So the hard part isn't ranking resumes. That's a commodity. The hard part is making every
> conclusion traceable to the line of the resume it came from — and making the agent admit when
> it can't find something instead of inventing it.
>
> Amazon's scrapped screener is the cautionary tale everyone cites. It didn't fail for being slow.
> It failed for being confident and unexplainable.
>
> Building the version that shows its work.
>
> Prototype tomorrow.
>
> What's the most frustrating part of resume screening you've experienced — as a candidate or a
> recruiter?
>
> #AIHackathon #BuildWithAI #ProductSpace

---

## Posting mechanics — the part that actually earns the bonus

Engagement is ranked across ~3,000 participants. Highest gets +10, everyone who posts gets +6.
The delta is won in the first 90 minutes, not in the writing.

**Before you post (10–15 min):**
Comment substantively on 5–8 posts in your feed. Warms your distribution before LinkedIn runs its
test on 5–10% of your audience.

**The visual — pick one, it matters for dwell time:**
- A hand-drawn architecture sketch (extraction → evidence store → mapping → report). Hand-drawn
  outperforms polished here; it reads as real work in progress.
- A screenshot of your research notes or the problem breakdown
- A simple diagram of the "cited vs flagged" decision — that's your core idea in one image

**Right after posting:**
- Do not post and walk away. The first 90 minutes need you present.
- Reply to every comment within 15–30 minutes — replies re-activate distribution
- Reply with a *question back*, not "thanks!" — comment depth is weighted, and threads count
- Share to 2–3 relevant WhatsApp/Discord groups (not the hackathon group — that's announcement-only)

**Timing for this audience:**
Global data points to 06:00–07:00 UTC (11:30 AM–12:30 PM IST) and Friday midday UTC. But your
audience is mostly Indian students and early-career folks plus the Product Space team, so the
Indian evening window (~7:00–9:30 PM IST) is likely stronger. Given it's already afternoon on
Day 1, **post by ~8:00 PM IST tonight** — don't push it to tomorrow, the streak is date-specific.

**Then:** log the post URL in https://forms.gle/CkqGP9JK76QvSzwp9 and screenshot the
likes/comments count near the submission deadline, since the bonus is scored on engagement at that
point.

---

## Why these read differently from the template

The organizer template has ~3,000 people writing "Day 1 is complete, and I am already invested"
with the same three hashtags on the same day. Engagement bonus is ranked, so sameness is the
enemy.

What these variants do instead:
- **Open with a number, not a feeling.** 11 seconds and $240,000 create tension in two lines.
- **Teach something.** The EU AI Act classification and the Amazon detail are genuinely
  non-obvious. People comment on things they learned.
- **Take a position.** "Ranking resumes is a commodity" is arguable, and arguable drives depth.
- **Ask an answerable question.** "What would you want to see next to a score?" draws on real
  experience. "Thoughts?" does not.
- **Show restraint.** No emoji walls, no "🚀 Day 1 🚀". Reads senior.

One honesty note: everything factual in these drafts is sourced in `RESEARCH.md`. Keep it that way
— if someone challenges the EU AI Act claim in the comments, you want to be able to cite Annex III
point 4(a) and be right. That exchange, handled well, is worth more reach than the original post.

---

## Day 2 post — outline only, write it tomorrow

Don't pre-write this. It should reflect what actually broke.

Skeleton:
- Hook: the honest version of what happened ("It runs. It also confidently mis-parsed my own
  resume, which was humbling.")
- What it does now: input → agents → output → rough timing
- One thing that worked, one thing that didn't — name the specific failure
- The audit trail screenshot. This is your money shot.
- What you'd build with another week
- Question back to builders about their own messy first run
- Same hashtags, tag Product Space again

The failure you name is what makes Day 2 credible. Everyone posts wins on Day 2; specific honest
failures get remembered and commented on.
