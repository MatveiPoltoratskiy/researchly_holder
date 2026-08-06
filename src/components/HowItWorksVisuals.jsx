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

const INTERVIEW_ROWS = [
  { label: 'Interest', value: 'Neuroscience', state: 'done' },
  { label: 'Level', value: 'Junior', state: 'done' },
  { label: 'Location', value: 'New York, NY', state: 'active' },
  { label: 'Timing', value: 'Summer', state: 'pending' },
  { label: 'Paid?', value: "Doesn't matter", state: 'pending' },
]

export function InterviewVisual() {
  return (
    <div className="how-panel how-panel--01">
      <div className="how-cardstack">
        <span className="how-cardstack-back how-cardstack-back-2" aria-hidden="true" />
        <span className="how-cardstack-back how-cardstack-back-1" aria-hidden="true" />
        <div className="how-cardstack-front">
          <PanelChrome label="Your interview" />
          {INTERVIEW_ROWS.map((row) => (
            <div className={`how-qrow is-${row.state}`} key={row.label}>
              <span className="how-qrow-label">{row.label}</span>
              {row.state === 'done' && <span className="how-qrow-chip">{row.value}</span>}
              {row.state === 'active' && (
                <span className="how-qrow-field">
                  {row.value}
                  <span className="how-qrow-cursor" aria-hidden="true" />
                </span>
              )}
              {row.state === 'pending' && (
                <span className="how-qrow-select">
                  {row.value}
                  <svg width="12" height="12" aria-hidden="true"><use href="#icon-chevron-down" /></svg>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MatchVisual() {
  return (
    <div className="how-panel how-panel--02">
      <PanelChrome label="Your matches" />
      <div className="how-funnel">
        <div className="how-funnel-noise" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ '--d': `${(i % 8) * 40}ms` }} />
          ))}
        </div>
        <svg className="how-funnel-chevron" width="22" height="22" aria-hidden="true"><use href="#icon-chevron-down" /></svg>
        <div className="how-funnel-result">
          <div className="how-match-row">
            <span className="how-chip how-chip--cover">96%</span>
            <div>
              <p className="how-match-name">Summer Research Program</p>
              <p className="how-match-tags">Summer · In-person</p>
            </div>
          </div>
          <div className="how-match-row">
            <span className="how-chip how-chip--ribbon">91%</span>
            <div>
              <p className="how-match-name">Undergrad Fellows Program</p>
              <p className="how-match-tags">Year-round · Paid</p>
            </div>
          </div>
          <div className="how-match-row">
            <span className="how-chip how-chip--navy">88%</span>
            <div>
              <p className="how-match-name">Remote Research Apprenticeship</p>
              <p className="how-match-tags">Remote · High school</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MILESTONES = [
  { text: 'Shortlist ready', done: true },
  { text: 'Deadline: Feb 1', done: true },
  { text: 'Ask for a rec letter', done: false },
  { text: 'Submit application', done: false },
]

export function RoadmapVisual() {
  return (
    <div className="how-panel how-panel--03">
      <PanelChrome label="Your roadmap" />
      <div className="how-timeline">
        {MILESTONES.map((m, i) => (
          <div className={`how-timeline-item${m.done ? ' is-done' : ''}`} key={m.text} style={{ '--d': `${i * 110}ms` }}>
            <svg width="17" height="22" aria-hidden="true"><use href="#scene-pin" /></svg>
            <span>{m.text}</span>
            {m.done && (
              <svg className="how-timeline-check" width="13" height="10" viewBox="0 0 13 10" aria-hidden="true">
                <path d="M1 5 5 9 12 1" fill="none" stroke="var(--ribbon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

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
      </div>
      <div className="how-cal-chip">
        <svg width="18" height="18" aria-hidden="true"><use href="#icon-calendar" /></svg>
        <span>Due Feb 1</span>
      </div>
    </div>
  )
}
