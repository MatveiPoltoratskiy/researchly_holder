/**
 * Static roadmap definition — five stages a student moves through on their way to
 * independent research / competition. Deliberately structured as plain data (not
 * hardcoded into the component that renders it) so this can be swapped for a real
 * backend-fetched list later without touching any UI code — a component should only
 * ever need { id, label, milestones: [{ id, label }] } shaped like this, whatever the
 * source.
 *
 * Each milestone is either:
 *   - "auto": derived from real state elsewhere in the app (saved opportunities, applied
 *     status, goal/interests picked) — see deriveAutoMilestones() in
 *     src/lib/roadmapProgress.js for the actual rules. Nothing here computes that itself;
 *     this file only declares WHICH milestones are auto vs manual.
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
    id: 'learn',
    label: 'Learn',
    milestones: [
      { id: 'learn-how-matching-works', label: 'See how your match score is calculated' },
      { id: 'learn-explore-5', label: 'Look closely at 5 different opportunities', auto: 'viewed-5' },
      { id: 'learn-paid-vs-free', label: 'Compare a paid and a free opportunity' },
      { id: 'learn-eligibility', label: 'Understand eligibility for your grade level' },
    ],
  },
  {
    id: 'experience',
    label: 'Experience',
    milestones: [
      { id: 'experience-find', label: 'Find a research opportunity', auto: 'saved-1' },
      { id: 'experience-save-3', label: 'Save 3 opportunities', auto: 'saved-3' },
      { id: 'experience-apply', label: 'Apply to an opportunity', auto: 'applied-1' },
      { id: 'experience-complete-program', label: 'Complete a research-related program' },
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
