// The first three visuals are built from the SAME CSS classes the real, live screens use
// (interview option rows, the match-results card, an opportunity card) — never imported
// directly from those components, since Interview.jsx/InterviewMatches.jsx/
// OpportunityExplorer.jsx are all lazy-loaded behind the dev passphrase gate (see
// App.jsx) specifically so an unauthenticated visitor's browser never fetches that code
// or the opportunity dataset. Reusing the classnames keeps these panels pixel-true to
// production without pulling any of that gated code into the public landing-page
// bundle. Content is simplified/trimmed (fewer rows, shorter copy) for a quick, clean
// read — not a dense literal screenshot. ApplyVisual (the 4th, "checklist" panel) is
// the original hand-illustrated mockup, kept as-is per explicit request.

function PanelChrome({ label }) {
  return (
    <div className="how-panel-chrome">
      <span className="how-panel-dot" />
      <span className="how-panel-dot" />
      <span className="how-panel-dot" />
      <span className="how-panel-chrome-label">{label}</span>
    </div>
  )
}

// same ring/fill/checkmark markup as Interview.jsx's OptionCheck — visibility of the
// fill+mark vs the empty ring is driven entirely by the shared .is-selected CSS, so
// duplicating the (tiny, static) SVG here doesn't risk drifting from the real look
function MockOptionCheck() {
  return (
    <svg className="interview-option-check" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="interview-option-check-ring" cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle className="interview-option-check-fill" cx="12" cy="12" r="9" fill="currentColor" />
      <path className="interview-option-check-mark" d="M8 12.5l2.6 2.6L16 9.5" fill="none" stroke="var(--cream)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// a "demo logo" per real program name reused across panels — same program always gets
// the same icon+color wherever it reappears (seed2STEM shows up in both the matches and
// the browse/track panels), instead of every badge being the same repeated flask, so the
// set reads as real varied programs rather than one icon copy-pasted everywhere
const HOW_LOGO = {
  'seed2STEM': { icon: 'icon-flask', color: 'var(--pine)' },
  'Amgen Scholars Program': { icon: 'icon-grad-cap', color: 'var(--cover)' },
  'MITES': { icon: 'icon-badge-check', color: 'var(--navy)' },
}
const HOW_LOGO_FALLBACK = { icon: 'icon-flask', color: 'var(--cover)' }

// real step-3 options from Interview.jsx (OPP_TYPES) — trimmed to icons already in the
// sitewide IconSprite (#icon-search/calendar/replay) instead of pulling InterviewIcons.jsx
const HOW_OPP_TYPES = [
  { id: 'research-internship', icon: 'icon-search', label: 'Research internship', desc: 'Hands-on work in a real lab' },
  { id: 'summer-program', icon: 'icon-calendar', label: 'Summer program', desc: 'A structured multi-week program', selected: true },
  { id: 'year-round-program', icon: 'icon-replay', label: 'Year-round program', desc: 'An ongoing school-year commitment' },
]

export function InterviewVisual() {
  return (
    <div className="how-panel how-panel--01">
      <div className="how-mock-card">
        <div className="how-panel-chrome-row">
          <PanelChrome label="Your interview" />
          <span className="how-progress-label">Step 3 of 8</span>
        </div>
        <p className="interview-question">What kind of opportunity?</p>
        <div className="interview-option-list">
          {HOW_OPP_TYPES.map((t) => (
            <div key={t.id} className={`interview-option-row ${t.selected ? 'is-selected' : ''}`} style={{ '--field-color': 'var(--cover)' }}>
              <span className="interview-option-emoji">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href={`#${t.icon}`} /></svg>
              </span>
              <span className="interview-option-main">
                <span className="interview-option-label">{t.label}</span>
                <span className="interview-option-desc">{t.desc}</span>
              </span>
              <MockOptionCheck />
            </div>
          ))}
        </div>
        <button type="button" className="interview-continue-btn" tabIndex={-1}>
          Continue
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><use href="#icon-arrow" /></svg>
        </button>
      </div>
    </div>
  )
}

// real programs from the live dataset, real per-card language from InterviewMatches.jsx's
// pitch/field-tag/match-% treatment — trimmed to 2 rows instead of 4 for a quicker read.
// Deliberately one big recognizable name + one small/niche one, so the pair itself makes
// the point that matches range from Ivy-tier to hidden-gem, not just "here are 2 rows"
const HOW_MATCHES = [
  {
    org: 'Massachusetts Institute of Technology', name: 'MITES', field: 'Physics', color: 'var(--navy)',
    pitch: "Hard to ignore: it's Physics, plus you already qualify.", pct: 96,
  },
  {
    org: 'ICORD – University of British Columbia', name: 'seed2STEM', field: 'Pre-Med', color: 'var(--pine)',
    pitch: "Rare combo: it's Neuroscience, plus it's free to attend.", pct: 93,
  },
]

export function MatchVisual() {
  return (
    <div className="how-panel how-panel--02">
      <div className="how-mock-card">
        <p className="im-matches-eyebrow">Based on your answers</p>
        <h3 className="interview-question">
          We found <span className="im-matches-count is-settled">4</span> strong matches
        </h3>
        <div className="im-match-list">
          {HOW_MATCHES.map((m) => {
            const logo = HOW_LOGO[m.name] || HOW_LOGO_FALLBACK
            return (
            <div className="im-match-card" key={m.name} style={{ '--focus-color': m.color }}>
              <span className="im-match-logo" style={{ color: logo.color }}>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href={`#${logo.icon}`} /></svg>
              </span>
              <span className="im-match-main">
                <span className="im-match-top-row">
                  <span className="im-match-field-tag">{m.field}</span>
                </span>
                <span className="im-match-name">{m.name}</span>
                <span className="im-match-org">{m.org}</span>
                <span className="im-match-pitch">{m.pitch}</span>
              </span>
              <span className="im-match-pct">
                <span className="im-match-pct-num">{m.pct}%</span>
                <span className="im-match-pct-label">match</span>
              </span>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function BrowseVisual() {
  return (
    <div className="how-panel how-panel--03">
      <div className="how-mock-card">
        <div className="how-panel-chrome-row">
          <PanelChrome label="Opportunities" />
          <span className="how-progress-label">39 shown</span>
        </div>
        <div className="opp-card">
          <div className="opp-card-body">
            <div className="opp-card-head">
              <span className="opp-badge" style={{ color: HOW_LOGO['Amgen Scholars Program'].color }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24"><use href={`#${HOW_LOGO['Amgen Scholars Program'].icon}`} /></svg>
              </span>
              <div className="opp-card-heading">
                <h4 className="opp-title">Amgen Scholars Program</h4>
                <div className="opp-org">University of Toronto</div>
              </div>
              <div className="opp-card-actions">
                <button type="button" className="opp-save-btn is-saved" tabIndex={-1}>
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-bookmark-filled" /></svg>
                  <span className="opp-save-btn-label">Saved</span>
                </button>
              </div>
            </div>
            <div className="opp-detail-row">
              <span className="opp-detail-item">
                <span className="opp-detail-icon"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-dollar" /></svg></span>
                Paid
              </span>
              <span className="opp-detail-item">
                <span className="opp-detail-icon"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-pin" /></svg></span>
                Toronto, ON
              </span>
            </div>
            <div className="opp-tags">
              <span className="opp-tag opp-tag--premed">Pre-Med</span>
              <span className="opp-tag opp-tag--muted">Undergrad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// kept exactly as it was before the real-screen rework — the user asked for the other
// three panels to change, this one specifically not to
const APPLY_ITEMS = [
  { text: 'Submit transcript', done: true },
  { text: 'Upload writing sample', done: true },
  { text: 'Request recommendation', done: true },
  { text: 'Final application', done: false },
]

export function ApplyVisual() {
  return (
    <div className="how-panel how-panel--04">
      <div className="how-clipboard">
        <span className="how-clipboard-clip" aria-hidden="true" />
        <PanelChrome label="Your checklist" />
        {APPLY_ITEMS.map((item, i) => (
          <div className={`how-check-row${item.done ? ' is-done' : ''}`} key={item.text} style={{ '--d': `${i * 120}ms` }}>
            <span className="how-check-box" aria-hidden="true">
              {item.done && (
                <svg width="12" height="10" viewBox="0 0 11 9">
                  <path d="M1 4.5 4 7.5 10 1" fill="none" stroke="var(--ribbon)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span>{item.text}</span>
          </div>
        ))}
        <button type="button" className="how-mock-btn how-mock-btn--muted" tabIndex={-1}>
          Submit application
        </button>
      </div>
      <div className="how-cal-chip">
        <svg width="18" height="18" aria-hidden="true"><use href="#icon-calendar" /></svg>
        <span>Due Feb 1</span>
      </div>
    </div>
  )
}
