# Researchly Interview System — Analysis & Build Plan

Written 2026-08-19 on branch `post-launch`. This is the spec to build the real guided
interview (the thing the landing page currently only *fakes* in `RoadmapPreview.jsx`).

---

## Part 1 — What EC Database actually does

Analyzed https://ecdatabase.org/onboarding by driving it with a headless browser
(their app is client-rendered; plain HTTP fetches only return a loading shell).

### Stack observed
- Next.js (`/_next/image` paths), Supabase (profile-photo storage URLs visible in payload)
- Routes: `/`, `/onboarding`, `/search`, `/opportunities`, `/organizations`, `/dashboard`,
  `/about`, `/blog`, `/contact`
- The `/onboarding` HTML payload is **1.38 MB** and contains large chunks of their
  opportunity dataset inline (hundreds of org records — Junior Achievement chapters,
  etc.). They ship a big slice of the dataset to the client.

### Entry screen — two modes
> **A roadmap built around you**
> Find the extracurricular path that fits how you think
> *Answer eight focused questions in about a minute, or talk it through. Both paths build the same personalized plan.*

- **"Answer eight questions"** — "Best when you want clear choices and full control."
- **"Talk it out"** — "Tell the bear what you care about for up to one minute." (voice input)

### The 8 questions (captured verbatim, Q1–Q5)

| # | Question | Input type | Options |
|---|---|---|---|
| 1 | **Where do your interests point?** <br>*Pick your main direction, then add up to two more.* | Multi-select, **max 3** | 17 field chips: Computer Science, Pre-Med, Economics, Public Policy, Engineering, Biology, Mathematics, Psychology, Business, Law, Linguistics, Political Science, Environmental Science, Physics, Arts, History, International Relations |
| 2 | **What part of that field pulls you in?** <br>*Pick every focus that fits.* | Multi-select | **Dynamic — depends on Q1.** For CS: "AI and data / Models, experiments, and useful data tools", "Apps and software / Products people can use", "Robotics and hardware / Machines, circuits, and engineering teams", "Math and theory / Olympiads, proofs, and deep problem solving" |
| 3 | **What kind of work sounds exciting?** <br>*Pick every kind of work you would enjoy.* | Multi-select | 6 fixed archetypes, but **descriptions are tailored to Q1**: Build something / Compete / Research / Lead and advocate / Teach and serve / Create and publish. With CS selected, examples read "Like USACO, the AI Olympiad, or a hackathon podium." |
| 4 | **What grade are you in?** <br>*Your grade helps us prioritize opportunities that fit your school timeline.* | **Single-select, auto-advances** (no Continue button — only Back) | Grade 8 or below, 9, 10, 11, 12 |
| 5 | **Where are you based?** <br>*We will favor nearby in-person programs and keep strong virtual options in the mix.* | Geocoded text autocomplete + geolocation + skippable | "Use my location" button, "Skip for now", placeholder `Type a city, e.g. Boston or London`. Results format ("Boston, Suffolk County, Massachusetts, United States") indicates **Nominatim/OpenStreetMap** geocoding |

**Q6–Q8 not captured** — the location step requires committing an autocomplete selection
that my automation couldn't complete. Based on the domain they're almost certainly
availability/time-commitment, cost/paid preference, and a goal or timeline question, but
**that is inference, not observation.** Don't treat it as fact.

### UI anatomy (from screenshots)
- Centered white card, ~720px, large radius, soft shadow, on near-white page
- **Top-left: `Question 4 of 8`** stacked label, beside a **thin horizontal progress bar**
  (green fill, gray track) spanning the card
- **Mascot illustration** (pixel-art bear) sits left of the question heading
- Question heading: very large, tight, near-black. Subtitle: one gray line beneath
- Optional hint row above options: `● ● ●  Pick up to 3 interests`
- **Options are large tappable cards**, each with: a small colored icon (or a number badge
  for grade), a bold label, an optional gray description line, and a **radio circle on the
  far right**. Interests laid out 3-across; grade laid out 1-across full width
- **Back** (outline, bottom-left). **Continue** (filled, bottom-right, **disabled until
  valid**) — *absent entirely on single-select questions*
- **`Skip` pill floats top-right of the viewport**, always available

### Why it works (worth stealing — these are generic form-UX patterns)
1. **Time promise up front** ("about a minute", "8 questions") kills the "how long is this?" anxiety that drives multi-step form abandonment.
2. **One question per screen** — no scroll-wall of fields.
3. **Auto-advance on single-select** removes a whole click per question.
4. **Continue disabled until valid** — no error states needed; invalid is unreachable.
5. **Escape hatches everywhere** (Skip, Skip for now, Back) so nobody gets trapped.
6. **The standout trick: later questions are personalized by earlier answers.** Picking CS rewrote Q3's examples to USACO/hackathons. Cheap to implement, makes it feel like it's listening.
7. **Two modes (type vs. talk)** respects different user preferences — but this is the most expensive feature to build and the least essential.

---

## Part 2 — What Researchly should do differently

### Copy overlap — fix this before launch
Researchly's landing page currently contains near-verbatim EC Database copy:

| Researchly (live now) | EC Database |
|---|---|
| "Questions, answered" | "Questions, answered" |
| "Everything you need to know before you start." | "Everything you need to know before you start" |
| "Get a personalized roadmap of research opportunities, internships, and summer programs based on your interest, in just a few minutes." | "Get a personalized roadmap of opportunities, organizations, and passion projects in just 1 minute" |

Short marketing phrases are weakly protected, so this is a low legal risk — but it's a real
**positioning** risk. If a user sees both sites, Researchly reads as a clone rather than a
competitor. Recommend rewriting these three before any public launch. Copying *interaction
patterns* (one-question-per-screen, progress bar, auto-advance) is completely normal and
fine; copying *sentences* is what to avoid.

### Structural differences Researchly needs
- **Do not copy their pixel-art mascot.** CLAUDE.md explicitly specifies "a low-poly book
  character **not pixel art**." Use the existing book mascot (`mascot-ask`, `mascot-scout`,
  `mascot-map`, `mascot-cheer` already exist in `IconSprite.jsx`) — one pose per question is
  a natural fit and already built.
- **Researchly's interview is 5 fields, not 8**, and CLAUDE.md fixes both the fields and
  their order (see below). Don't pad it to 8 to match.
- Researchly is **research opportunities specifically**, not general extracurriculars, so
  the "kind of work" archetype question doesn't apply cleanly. Skip it for v1.

### The canonical Researchly question order (from CLAUDE.md — do not reorder)
1. **Focal type** — *already set before the interview starts* (pre-med, biology, chemistry, physics, neuroscience, humanitarian…). This is the entry point, not a question.
2. **Academic level** — filters eligibility harder than anything else. Ask **second**.
3. **Location** — city/zip, or "remote only". Needed for the "hospital 4km away" feature.
4. **Time commitment / availability** — summer only, year-round, or both.
5. **Paid vs. unpaid preference** — **last**, because it's a refinement filter, not an eligibility one.

So: **1 preset + 4 asked questions.** With an optional intro screen that's a 5-screen flow.

---

## Part 3 — Architecture decision

**Build in this order. Do not skip ahead — each phase is independently shippable and
de-risks the next.**

The temptation is to start with Supabase + AI matching. That's backwards. The interview UI
is worthless without a dataset, and the dataset is the actual bottleneck (Part 6). But the
UI can be built and tested against a *hardcoded* dataset in a day, and that immediately
tells you whether the flow feels right.

```
Phase 1  Interview UI, pure client state, no persistence, no data      ← start here
Phase 2  Static seed dataset (JSON in repo) + plain filter matching
Phase 3  Persist results to Supabase + shareable result URL
Phase 4  Real dataset + ranked/weighted matching
Phase 5  (optional) accounts, saved roadmaps, voice mode
```

**Phases 1–2 need no backend at all.** Ship them behind the `post-launch` branch preview
URL and pressure-test the flow before writing a single table.

---

## Part 4 — Phase-by-phase build spec

### Phase 1 — Interview UI (no data, no backend)

**New route:** `/start`

`src/App.jsx` — add to the `Page()` router alongside the existing `/contact` and
`/how-it-works` branches. The interview should render **without** `Navbar`/`Footer` chrome
(full-screen focused flow) and **without** the `.compact-page` / `.landing-compact` zoom
wrappers.

**New files:**

| File | Responsibility |
|---|---|
| `src/components/interview/Interview.jsx` | Route shell. Owns all state, renders current step. |
| `src/components/interview/InterviewCard.jsx` | The card frame: progress bar, `Question N of 4`, mascot, heading, subtitle, options slot, Back/Continue footer. |
| `src/components/interview/OptionCard.jsx` | One selectable option: icon/badge, label, optional description, radio/check indicator. Handles `is-selected`. |
| `src/components/interview/steps.js` | **Pure data.** The question definitions array — no JSX. |
| `src/lib/interview.js` | State reducer + validation + `buildAnswerPayload()`. Framework-free, unit-testable. |

**State shape** (keep flat, serializable — it becomes the Supabase row and the URL param later):

```js
{
  focus:        'neuroscience',        // preset from entry point, not asked
  level:        'hs-11',               // hs-9|hs-10|hs-11|hs-12|ugrad-1|ugrad-2|ugrad-3|ugrad-4
  location:     { label: 'Boston, MA', lat: 42.36, lon: -71.06, remoteOnly: false },
  availability: 'summer',              // summer|year-round|both
  paid:         'either'               // paid|either  (unpaid-ok is not a real preference)
}
```

**`steps.js` shape** — each step is declarative so the renderer stays dumb:

```js
{
  id: 'level',
  question: 'What year are you in?',
  subtitle: 'This decides which programs you\'re eligible for more than anything else.',
  type: 'single',            // 'single' | 'multi' | 'location' | 'chips'
  autoAdvance: true,         // true for 'single' — matches the EC Database pattern
  optional: false,
  mascot: 'mascot-ask',      // reuse existing IconSprite symbols
  options: [
    { value: 'hs-9',  badge: '9',  label: 'Grade 9' },
    // …
  ],
}
```

**Behavior requirements:**
- One question per screen; `Continue` **disabled until the step validates**
- `type: 'single'` **auto-advances on click** and renders **no Continue button** (Back only)
- `Back` always present except on step 1
- A `Skip` affordance top-right; skipping a step leaves its value `null` (matching must
  tolerate nulls — treat as "no constraint", never as "no results")
- Progress bar + `Question N of 4` label
- Respect `prefersReducedMotion()` from `src/lib/motion.js` for step transitions
- Full keyboard support: options are real `<button>`s, arrow-key navigation within a group,
  Enter to advance. Visible focus ring (existing site has weak focus states — do better here)
- Deep-link each step (`/start?step=2`) so Back/Forward browser buttons work

**Styling:** all CSS goes in `src/index.css` under a new `/* ---------- interview ---------- */`
section, prefixed `.iv-*` (`.iv-card`, `.iv-progress`, `.iv-option`, `.iv-option.is-selected`).
Match existing conventions: CSS custom properties for color, no new dependencies, Poppins for
option labels, Fraunces reserved for the big question heading. Brand palette only —
`--cover` `#DD6B2E` for selection/progress fill, `--navy` for text, `--cream` for page.
**Do not** copy EC Database's white-card-on-gray look; use Researchly's warm cream ground.

**Definition of done for Phase 1:** you can click through all 4 questions on the preview
URL, Back works, refresh preserves position, and the final screen prints the collected
answer object to screen. No data, no matching yet.

---

### Phase 2 — Static dataset + filter matching

**`src/data/opportunities.json`** — hand-curate **20–40 real programs** to start. Do not
generate fake ones; the whole value proposition is that these are real. Schema:

```json
{
  "id": "mit-rsi",
  "name": "Research Science Institute (RSI)",
  "org": "MIT / Center for Excellence in Education",
  "url": "https://…",
  "focus": ["biology", "physics", "chemistry", "cs"],
  "levels": ["hs-11"],
  "mode": "in-person",
  "location": { "label": "Cambridge, MA", "lat": 42.36, "lon": -71.09 },
  "availability": "summer",
  "paid": true,
  "cost": 0,
  "deadline": "2027-01-15",
  "selectivity": "high",
  "blurb": "Six weeks of off-campus research…"
}
```

**`src/lib/matching.js`** — pure function, no network:

```js
matchOpportunities(answers, dataset) -> [{ opportunity, score, reasons[] }]
```

v1 scoring — keep it explainable, not clever:
- **Hard filter** on `levels` (eligibility — a 9th grader must never see an undergrad-only program)
- **Hard filter** on `availability` when the user picked `summer` or `year-round`
- **Score** on focus overlap (weight highest), distance (if location given and mode is in-person), paid match
- Always return `reasons[]` — the strings that render as the "why this matched" chips.
  This is what makes results feel earned rather than arbitrary.

**Results screen** (`src/components/interview/Results.jsx`) — reuse the visual language
already designed in `HowItWorksVisuals.jsx` (`MatchVisual`): percentage chip, name, org,
tag row. That mockup is already brand-correct; make it real.

Handle the empty state deliberately: if hard filters eliminate everything, **loosen and say
so** ("No summer-only programs near you — here are year-round ones") rather than showing
a blank page.

**Definition of done:** answers produce a real, correct, explainable list from the JSON file.

---

### Phase 3 — Persistence

Only now introduce Supabase. Table:

```sql
create table interview_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  focus text, level text, location jsonb,
  availability text, paid text,
  matched_ids text[],
  email text                      -- nullable; captured only if they ask to save it
);
alter table interview_responses enable row level security;
create policy "anon insert" on interview_responses for insert to anon with check (true);
grant insert on interview_responses to anon;
```

> **Known gotcha, learned the hard way on `contact_messages`:** the RLS policy *and* the
> `grant` are both required. The table existing with a policy but no grant fails silently
> at runtime. Verify with a real insert from the deployed preview, not just locally.

Follow the existing pattern in `Waitlist.jsx` / `Contact.jsx`: import the guarded client
from `src/lib/supabase.js`, handle `supabase === null`, handle error `23505`, never block
the UI on the write. **The interview must still work end-to-end if the insert fails** —
persistence is analytics, not a dependency.

---

### Phase 4 — Real dataset & better matching

See Part 6 — this is the real work.

---

## Part 5 — What NOT to build yet

- **Accounts / login.** Nothing in the v1 flow needs identity. Email capture at the results
  screen is enough.
- **AI / LLM matching.** With <500 opportunities, a deterministic filter beats an LLM on
  accuracy, latency, cost, and debuggability. Revisit only when the dataset is large enough
  that filters return too many results to rank sensibly.
- **Voice mode ("talk it out").** High cost, unclear payoff, and it needs a transcription
  service plus an extraction model. Note it as a differentiator for later.
- **A dashboard.** Results page + shareable link covers v1.

---

## Part 6 — The actual bottleneck: the dataset

**The interview UI is ~2–3 days of work. The dataset is the product.** EC Database's real
moat is a curated database of programs and verified profiles, not their form.

For every opportunity Researchly needs, at minimum: eligible academic levels, location +
remote/in-person, season/duration, paid or unpaid, deadline, application URL. That data is
scattered across university department pages and mostly not in any API.

Realistic options, in order of how fast they get to a working product:
1. **Hand-curate 30–50 flagship programs** (RSI, SIMR, Garcia, SSP, Clark Scholars, NIH
   HS-SIP, university-specific REUs…). Enough to make the interview genuinely useful for a
   demo and for early users. **Start here.**
2. **Semi-automated scraping + manual verification** — the NSF REU directory is the single
   highest-value structured source for undergrads.
3. **User submissions** later, with moderation.

**Do not let dataset size block Phases 1–3.** 30 real, correct entries beat 3,000 scraped
ones with wrong eligibility data — wrong eligibility is worse than no result, because a
student who applies to something they're not eligible for loses real time.

---

## Part 7 — Open questions for the user (answer before Phase 2)

1. **Where does "focal type" get set?** CLAUDE.md says it's preset before the interview. Is
   that a click from the landing page ("I'm interested in → Neuroscience"), or should the
   interview open with it as question 1? This changes whether the flow is 4 or 5 screens.
2. **High school and undergrad in one flow, or split?** The eligibility gap is huge and the
   program sets barely overlap. A single `level` question handles it, but the results screen
   may need different framing per audience.
3. **Geography scope for v1** — US-only? That determines whether location matching needs
   real geocoding or can start as a US state/metro dropdown (much cheaper).
4. **What happens at the end for a waitlist-stage product?** Show matches immediately
   (gives value, proves the concept, but spends the dataset), or show a teaser + email
   capture (builds the list, risks feeling like a bait-and-switch)? Recommend: **show real
   matches**, then offer to email the full roadmap.

---

## Immediate next action

Phase 1, step 1: create `src/components/interview/steps.js` with the 4 question definitions
and `src/lib/interview.js` with the reducer — no UI yet. Those two files pin down the data
model, and everything else renders off them.
