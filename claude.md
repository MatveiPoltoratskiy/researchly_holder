# Researchly:  Brand Brief Product: Researchly (researchly.space) Helps high school and undergrad students discover research opportunities (internships, summer programs, year-round programs, paid programs) matched to their interests through a short guided interview. This interview consists of a process of the following: Focal type (already set) — pre-med, humanitarian, biology, chemistry, physics, neuroscience, etc.
Academic level (grade or year) — this filters eligibility harder than almost anything else. A 9th grader and a college sophomore qualify for almost entirely different programs. Ask this second, not later.
Location (city/zip, or "remote only") — needed for the "hospital 4km away" feature. Ask ais therfter academic level, since level narrows the list before location filters it further.
Time commitment / availability — summer only, year-round, or both. This is the third major eligibility filter (some programs are 8-week summer intensives, others are ongoing weekly commitments).
Paid vs. unpaid preference — last, because it's a refinement filter, not an eligibility one. Most users will take either if the opportunity is strong enough.
 Emotional promise: "I finally know where to start." Users should feel: curiosity, guidance, possibility — not overwhelmed or "impressed by AI but a sense of easiness due to the minimalist yet gamified and clear ui." Current phase: waitlist landing page only. Build only: navbar, hero, problem/solution section, waitlist CTA. Do not build: auth, dashboards, APIs, databases, search, AI features. Aesthetic: Low-poly illustration style, warm and soft-shaded (not sharp or geometric), premium-feeling, friendly. Mascot: a low-poly book character not pixel art. Should feel like a guide/companion, not a static logo. Homepage intro: book opens, pages turn, but you can experiment, soft jiggly motion that settles and stops, constant animations on vectors and such (not jittery/bouncy). Avoid sky/cloud imagery — use warm lighting, blurred bookshelves, or floating pages instead. Tone: friendly, encouraging, calm. Not corporate, not salesy, not gimmicky. Never use: purple/blue gradients, glassmorphism, floating abstract blobs, Inter font, generic "AI spark" icons, stock photography, sky/cloud imagery.

## Current Build State (as of live site)

### Pages built
Home (hero → testimonials → how-it-works ×4 → FAQ → footer), Contact page.

### Typography
- **Headlines:** serif, bold, large — dark navy (#1a2744-ish). Confident, editorial weight.
- **Body/UI:** sans-serif, clean, rounded — gray-navy for body text, warm gray for secondary captions.
- **Numbers/badges:** sans-serif, tight tracking, used in step markers (01, 02...) and match percentages.

### Color system
- **Background:** warm cream/off-white (#F5EFE0-ish) throughout every section.
- **Primary accent:** burnt orange/rust — used for kickers, underlines, mascot, tag highlights, some CTAs.
- **Secondary accent:** dark brown — used for primary "Join the waitlist" buttons (deeper/more grounded than the rust).
- **Support:** sage green (mountain illustrations, some match badges), navy (headlines, primary text, some UI tags).
- Note: two different button colors exist (rust pill nav CTA vs. dark brown hero/footer CTA) — decide if intentional (primary vs. secondary action) or needs unifying.

### Background motifs
- Layered sage-green mountain illustration anchors the bottom of the hero and reappears at the "castle/journey" CTA section — a visual quest metaphor (path + flag + castle at the peak).
- Faint scientific/academic watermarks (chemical formulas, constellations, equations) scattered at low opacity across hero and contact backgrounds — reinforces "research" without being literal iconography.
- Small handwritten-style annotations ("curiosity leads to discovery") as texture, not primary copy.

### Mascot
Low-poly book character, rust-orange with cream page edges, green ribbon "sprout" on top, simple dot eyes + smile, stick limbs. Appears throughout in contextual poses: waving (interview step), magnifying glass (search/match step), clipboard (roadmap step), sparkle/celebration (application step), full-body with pause/replay controls in hero (confirms homepage intro animation is built and user-controllable).

### Section-by-section inventory

**Nav:** mascot icon + "Researchly" wordmark, links (How it works, Contact), rust pill CTA "Join the waitlist."

**Hero:** kicker "JOIN THE WAITLIST" → headline "Come lost. Leave with research opportunities." (marker-underline on "lost") → subhead with highlighted phrase "in just a few minutes" → email capture + CTA → social proof ("50+ people have already joined") → live product mockup card ("Your Research Path" with % match list) → mascot with pause/replay on the mountain.

**Testimonials:** 5 rotating star-rated quote cards, beta-tester language, positioned between hero and how-it-works.

**How it works (4 numbered steps, alternating layout, each with mascot + mockup):**
1. **The Interview** — "Five questions, then you're done." Interest → Level → Location → Timing → Pay.
2. **The Match** — "We search so you don't open 40 tabs." Filters: Summer/Year-round/Paid/Remote.
3. **Your Roadmap** — "Every match arrives in order." Deadlines/next-steps checklist with progress bar.
4. **The Application** — "Then you apply." Honest framing: "We can't get you accepted, but you won't miss something because you never heard of it." Ends in mountain/castle journey CTA.

**FAQ:** accordion, 7 questions (how it works, opportunity types, pricing, start date, guarantee disclaimer, non-pre-med use case, vs. Google differentiation), large circular mascot portrait.

**Footer:** logo + tagline, Product/Company/Resources columns, email capture ("No spam. Ever."), legal links, Instagram + LinkedIn icons.

**Contact page:** "Questions? We're here." — Name/Email/Subject/Message form, direct email fallback, same watermark background as hero.