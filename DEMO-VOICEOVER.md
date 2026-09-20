# Demo video voiceover — `assets/hireflow-demo-3min.mp4`

Video is **158.04s (2:38)**, 1280×734, no audio track. Timings below are exact segment
boundaries from the build, so the narration lands on the right visuals.

Total script ≈ **362 words ≈ 137 wpm**. That's a deliberate demo pace — don't rush the TTS.
If your TTS runs fast, add the pauses noted in brackets rather than speeding up the read.

**Never name the model or the provider out loud.** Say "the model" / "the agent".

---

## Timing map

| # | Segment | Start | End | Length | Words |
|---|---|---|---|---|---|
| 1 | Title card | 0:00.0 | 0:07.0 | 7.0s | 16 |
| 2 | Intake + live screening run | 0:07.0 | 0:31.6 | 24.6s | 56 |
| 3 | Requirements traced to the JD | 0:31.6 | 0:44.6 | 13.1s | 30 |
| 4 | Candidate pool + plain-language query | 0:44.6 | 1:01.7 | 17.1s | 39 |
| 5 | Evidence matrix | 1:01.7 | 1:11.9 | 10.2s | 23 |
| 6 | **The money shot — live verification** | 1:11.9 | 1:42.5 | 30.6s | 70 |
| 7 | Evaluation report + audit trail | 1:42.5 | 1:59.6 | 17.1s | 39 |
| 8 | Verifier refusing claims | 1:59.6 | 2:17.4 | 17.8s | 41 |
| 9 | Human decision | 2:17.4 | 2:29.0 | 11.6s | 27 |
| 10 | End card | 2:29.0 | 2:38.0 | 9.0s | 20 |

---

## The script

### 1 · Title card — 0:00 → 0:07
> Recruiters spend about eleven seconds on a resume. HireFlow is built for the part that
> actually matters afterwards. [pause]

### 2 · Intake + live screening run — 0:07 → 0:31.6
> One job description and five resumes go in. HireFlow reads the role and breaks it into ten
> individually addressable requirements — six must-have, four nice-to-have. [pause]
> Then the agent runs. It extracts evidence from each resume, checks every proposed quote
> against the source document, maps it to the requirements, and writes interview questions for
> whatever it could not establish. Fifty evidence checks across the pool, in about ninety seconds.

### 3 · Requirements traced to the JD — 0:31.6 → 0:44.6
> Every requirement keeps a stable ID and points back to the exact line of the job description
> it came from. Nothing here was invented by the model. If it is on screen, it came from a document.

### 4 · Candidate pool + plain-language query — 0:44.6 → 1:01.7
> The pool is queryable in plain language. Java and Spring Boot candidates with unverified
> Kubernetes — and it answers from the evidence, not from a vector guess. [pause]
> Twenty-one requirements across these five candidates still need a human. That count is a
> feature, not a failure.

### 5 · Evidence matrix — 1:01.7 → 1:11.9
> Five candidates against ten requirements in one grid. Notice what is missing — there is no
> match score anywhere in this product. No percentage, no ranking.

### 6 · The money shot — 1:11.9 → 1:42.5
> Here is the moment the whole build exists for. This candidate's resume clearly mentions Docker
> and containerised microservices. The requirement is Kubernetes in production. [pause]
> An ordinary screener pattern-matches containers to Kubernetes and moves on. HireFlow marks it
> unverified, and says exactly what is missing. Then it writes the question to close the gap.
> [pause] I paste his real interview answer in. The model decides whether it verifies — and the
> code checks the quote is genuinely in that answer. Only then does it move to met. Coverage goes
> from six of ten to seven.

### 7 · Evaluation report + audit trail — 1:42.5 → 1:59.6
> The evaluation report separates what the resume showed from what the interview established, and
> it states plainly when the evaluation is still incomplete. [pause] Every status change is written
> to a timestamped audit trail — which claim changed, why, and the evidence behind it.

### 8 · Verifier refusing claims — 1:59.6 → 2:17.4
> This is the part I am most pleased with. Across the run, the verifier refused five of the
> agent's own proposed claims, because it could not locate the quote in the source document.
> [pause] The verifier is plain code with no model call in it, so it cannot fabricate a citation.
> Those five refusals became interview questions instead of conclusions.

### 9 · Human decision — 2:17.4 → 2:29.0
> Nothing here auto-rejects anyone. The agent organises the evidence, names what it cannot
> confirm, and stops. Shortlist, needs review, or reject stays a human decision.

### 10 · End card — 2:29.0 → 2:38.0
> The model proposes evidence. The code validates it. That is the whole idea — a shortlist you
> can actually defend.

---

## One-shot plain text (for a single TTS render)

Paste this if your TTS takes one block. Keep the blank lines — most engines turn them into pauses.

```
Recruiters spend about eleven seconds on a resume. HireFlow is built for the part that actually matters afterwards.

One job description and five resumes go in. HireFlow reads the role and breaks it into ten individually addressable requirements — six must-have, four nice-to-have. Then the agent runs. It extracts evidence from each resume, checks every proposed quote against the source document, maps it to the requirements, and writes interview questions for whatever it could not establish. Fifty evidence checks across the pool, in about ninety seconds.

Every requirement keeps a stable ID and points back to the exact line of the job description it came from. Nothing here was invented by the model. If it is on screen, it came from a document.

The pool is queryable in plain language. Java and Spring Boot candidates with unverified Kubernetes — and it answers from the evidence, not from a vector guess. Twenty-one requirements across these five candidates still need a human. That count is a feature, not a failure.

Five candidates against ten requirements in one grid. Notice what is missing — there is no match score anywhere in this product. No percentage, no ranking.

Here is the moment the whole build exists for. This candidate's resume clearly mentions Docker and containerised microservices. The requirement is Kubernetes in production. An ordinary screener pattern-matches containers to Kubernetes and moves on. HireFlow marks it unverified, and says exactly what is missing. Then it writes the question to close the gap. I paste his real interview answer in. The model decides whether it verifies — and the code checks the quote is genuinely in that answer. Only then does it move to met. Coverage goes from six of ten to seven.

The evaluation report separates what the resume showed from what the interview established, and it states plainly when the evaluation is still incomplete. Every status change is written to a timestamped audit trail — which claim changed, why, and the evidence behind it.

This is the part I am most pleased with. Across the run, the verifier refused five of the agent's own proposed claims, because it could not locate the quote in the source document. The verifier is plain code with no model call in it, so it cannot fabricate a citation. Those five refusals became interview questions instead of conclusions.

Nothing here auto-rejects anyone. The agent organises the evidence, names what it cannot confirm, and stops. Shortlist, needs review, or reject stays a human decision.

The model proposes evidence. The code validates it. That is the whole idea — a shortlist you can actually defend.
```

---

## Merging the audio

Save your narration as `/home/om/Desktop/ai-hack/assets/voice.mp3` (or .wav), then:

```bash
cd /home/om/Desktop/ai-hack

# 1. check how long your narration is vs the 158.04s video
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/voice.mp3

# 2. merge — pads with silence if the audio is short, never truncates the video
ffmpeg -i assets/hireflow-demo-3min.mp4 -i assets/voice.mp3 \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k \
  -af "apad" -shortest -movflags +faststart \
  assets/hireflow-demo-3min-voiced.mp4

# 3. verify it has both streams and is still under 3 minutes
ffprobe -v error -show_entries stream=codec_type,codec_name -show_entries format=duration -of default=nw=1 \
  assets/hireflow-demo-3min-voiced.mp4
```

### If the narration is longer than 158s

Don't speed up the audio — stretch the video instead so the visuals stay in sync:

```bash
# say your audio is 171s: factor = 171 / 158.04 = 1.082
ffmpeg -i assets/hireflow-demo-3min.mp4 -filter:v "setpts=1.082*PTS" -an /tmp/slower.mp4
ffmpeg -i /tmp/slower.mp4 -i assets/voice.mp3 -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -crf 21 -preset veryfast -c:a aac -b:a 192k -shortest -movflags +faststart \
  assets/hireflow-demo-3min-voiced.mp4
```

Keep the result **under 3:00** — that's the submission limit. If your read lands over 3 minutes,
cut from segment 4 or 5 (pool / matrix); they carry the least weight. Do not cut segment 6 or 8 —
those are the money shot and the refusal count.

### Optional: duck nothing, there's no existing audio
The video has no audio track, so there's nothing to mix against. Your narration is the only track.
