/**
 * Static roadmap definition — the stages a student moves through on their way to
 * independent research / competition. Deliberately structured as plain data (not
 * hardcoded into the component that renders it) so this can be swapped for a real
 * backend-fetched list later without touching any UI code — a component should only
 * ever need { id, label, milestones: [{ id, label }] } shaped like this, whatever the
 * source.
 *
 * Each milestone is either:
 *   - "auto": derived from real state elsewhere in the app (interview completion,
 *     browsing activity) — see evaluateAutoFlags() in src/lib/roadmapProgress.js for the
 *     actual rules. Nothing here computes that itself; this file only declares WHICH
 *     milestones are auto vs manual.
 *   - manual (no `auto` key): the student checks it off themselves. Honest choice for
 *     anything this app has no way to actually verify (reading papers, finding a mentor,
 *     submitting a competition entry) rather than pretending to auto-detect those too.
 */
export const ROADMAP_STAGES = [
  {
    id: 'explore',
    label: 'Explore',
    milestones: [
      { id: 'explore-interview', label: 'Take the matching interview', auto: 'interview-done' },
      { id: 'explore-browse', label: 'Browse the opportunities list', auto: 'browsed' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    milestones: [
      { id: 'research-question', label: 'Identify a research question' },
      { id: 'research-read-3', label: 'Read 3 relevant papers' },
      { id: 'research-mentor', label: 'Find a mentor / research connection' },
      { id: 'research-project', label: 'Complete a project' },
    ],
  },
  {
    id: 'compete',
    label: 'Compete',
    milestones: [
      { id: 'compete-find', label: 'Find a science competition' },
      { id: 'compete-select', label: 'Select a project' },
      { id: 'compete-submit', label: 'Submit project' },
      { id: 'compete-present', label: 'Present research' },
    ],
  },
]

export const ROADMAP_STAGE_IDS = ROADMAP_STAGES.map((s) => s.id)
