# HireFlow — UI/UX Spec (LOCKED)

Design system built and verified 19 Sep. All five screens implemented in
`web/` with mock data, building clean and lint-clean.

---

## Decisions locked

| Question | Answer |
|---|---|
| Framework | **Next.js 16 + shadcn/ui + Tailwind v4** (Vercel deploy) |
| Theme | **Light** |
| Reference | The pink/violet "Recruitment · Interview UIX Designer" dashboard |
| Agent framework | **LangGraph** (confirmed: Om has used it) |
| Inverted emphasis | **Yes** — `met` is quiet, `unverified` shouts |

## Reference signatures adopted

From the chosen reference, in order of how much they define the look:

1. **Floating app panel** — the whole product is one 28px-radius card on a tinted
   blue-grey field, not edge-to-edge. This is the single most recognisable move.
2. **Icon-only left rail**, 76px, with a filled deep-violet rounded square for the
   active item and a magenta gradient logo tile at the top.
3. **Breadcrumb header** with a magenta gradient "AI Tools" pill, Share, a bell
   with an unread dot, and an org chip on the right.
4. **Bento grid** — asymmetric 2/3 + 1/3 columns rather than uniform cards.
5. **Deep-violet gradient hero card** for the headline figure, with a soft light
   bloom top-right. Used once per screen, never twice.
6. **Pastel status pills** and a **multi-segment donut** built from real counts.

## Deliberate departures

Three places where the reference was not followed, each for a product reason:

| Reference does | HireFlow does | Why |
|---|---|---|
| Big "87% Matched" score | `3/4 must-have requirements with located evidence` | A single opaque score is exactly what makes a screener read as an automated ranker. Both external reviewers flagged it. The replacement is inspectable. |
| "Workmap Score" donut over invented dimensions | Donut over real finding counts (met/partial/unverified/absent) | No fabricated metrics. Every segment maps to countable findings. |
| Quiet grey status chips | Amber, bordered, full-width alert for `unverified` | A subtle chip does not survive being watched on a phone, and uncertainty is the point of the product. |

## Design tokens

```
brand         #ec4899   magenta — primary actions, AI affordances
violet        #3b2a6b   hero cards, active nav
field         #e9eef6   page background behind the panel
radius        1rem      (panel 28px, cards 24px, inner 16px)

met           #047857 on #e7f8f0   quiet
partial       #1d4ed8 on #eaf1ff   quiet
unverified    #a1590a on #fff6e3   LOUD — border + icon + alert block
absent        #be123c on #ffecf0   medium
```

Evidence quotes render in **monospace** throughout — mono signals "verbatim
source", not generated prose.

## Screens built

| Route | Purpose | Notes |
|---|---|---|
| `/` | Intake | JD + resumes loaded, 4-step pipeline explainer |
| `/requirements` | Requirement decomposition | 7 numbered cards, per-requirement status spread, source doc alongside |
| `/candidates` | Pool | Pool donut, gaps-before-strengths card order, transparent sort |
| `/candidates/[id]` | **The demo** | Confrontation block → findings with `[Why?]` → interview pack → violet decision card |
| `/activity` | Agent trace | 19 events, amber lines are verifier refusals |

## Component inventory

Custom (`src/components/hireflow/`):
- `app-shell.tsx` — floating panel, icon rail, breadcrumb header, `PageHeader`
- `kit.tsx` — `Panel`, `PanelHead`, `Eyebrow`, `HeroCard`, `Donut`, `Chip`, `IdTag`, `Avatar`
- `status-badge.tsx` — the four-state vocabulary, `STATUS_META`
- `finding-row.tsx` — the `[Why?]` disclosure. The money shot.
- `decision-bar.tsx` — `DecisionHero`, the violet human-decision card
- `coverage.tsx` — `CoverageBar`, `CoverageLegend`, `coverageSegments`

Shared contract: `src/lib/types.ts` — this is also block **B0** of the build
plan, so the UI and the LangGraph backend agree on one schema.
Fixtures: `src/lib/mock-data.ts`.

## The demo shot, as built

`/candidates/C-01` opens with REQ-03 already expanded, showing in one screen:

```
Requirement source   →  "Experience deploying and operating workloads
                         on Kubernetes in production"   [quote located in source]

Evidence located     →  "Containerised microservices using Docker and
                         Docker Compose..."             [quote located in source]

Not established      →  Evidence of deploying and operating Kubernetes
                         workloads in production

Ask in interview     →  "You mention containerising microservices with Docker...
                         Did you personally deploy or operate any of those
                         workloads on Kubernetes in production?"

Follow-up            →  "Which parts did you own — the control plane and cluster
                         upgrades, or workloads on a managed cluster?"

Provenance           →  F-C01-REQ03 · confidence 88% · model · timestamp
```

## Bugs found and fixed during verification

Worth recording because two were real logic errors, not cosmetics:

1. **`asChild` on Button** — this shadcn build is base-ui, not Radix, so `asChild`
   does not exist. Switched to `buttonVariants()` on `Link`.
2. **Mutation during render** in the donut — offsets were accumulated inside
   `.map()`. Precomputed the arc geometry instead.
3. **Metric contradicted its own label** — "candidates with every must-have
   evidenced" was counting candidates with zero open findings *including soft
   ones*, so Arjun (4/4 must-haves, missing only an optional degree) counted as
   0. Now filters on `hardEvidenced === hardTotal`.
4. **Overstated verification count** — "Quotes located in source" was counting
   log lines from one candidate's trace. Now computed from actual verified
   evidence spans across all findings.
5. Sticky right column on the detail page, and `items-start` on intake, to kill
   dead space where columns had unequal height.

## Next

Frontend is done and verified. Backend is next: LangGraph pipeline behind a
FastAPI route, wired to replace `mock-data.ts` while keeping `types.ts` fixed as
the contract. Need the API key to start.
