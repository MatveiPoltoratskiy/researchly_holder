const INTERVIEW_ROWS = [
  { label: 'Interest', value: 'Neuroscience', state: 'done' },
  { label: 'Level', value: 'Junior', state: 'done' },
  { label: 'Location', value: '', state: 'active' },
  { label: 'Timing', value: '', state: 'pending' },
  { label: 'Paid?', value: '', state: 'pending' },
]

export function InterviewVisual() {
  return (
    <div className="how-panel how-panel--01">
      <div className="how-cardstack">
        <span className="how-cardstack-back how-cardstack-back-2" aria-hidden="true" />
        <span className="how-cardstack-back how-cardstack-back-1" aria-hidden="true" />
        <div className="how-cardstack-front">
          {INTERVIEW_ROWS.map((row) => (
            <div className={`how-qrow is-${row.state}`} key={row.label}>
              <span className="how-qrow-label">{row.label}</span>
              {row.state === 'done' && <span className="how-qrow-chip">{row.value}</span>}
              {row.state === 'active' && <span className="how-qrow-cursor" aria-hidden="true" />}
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
      <div className="how-funnel">
        <div className="how-funnel-noise" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{ '--d': `${(i % 6) * 40}ms` }} />
          ))}
        </div>
        <svg className="how-funnel-chevron" width="20" height="20" aria-hidden="true"><use href="#icon-chevron-down" /></svg>
        <div className="how-funnel-result">
          <span className="how-chip how-chip--cover">Summer · In-person</span>
          <span className="how-chip how-chip--ribbon">Year-round · Paid</span>
          <span className="how-chip how-chip--navy">Remote · High school</span>
        </div>
      </div>
    </div>
  )
}

const MILESTONES = ['Shortlist ready', 'Deadline: Feb 1', 'Ask for a rec letter', 'Submit']

export function RoadmapVisual() {
  return (
    <div className="how-panel how-panel--03">
      <div className="how-timeline">
        {MILESTONES.map((m, i) => (
          <div className="how-timeline-item" key={m} style={{ '--d': `${i * 110}ms` }}>
            <svg width="15" height="19" aria-hidden="true"><use href="#scene-pin" /></svg>
            <span>{m}</span>
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
        {APPLY_ITEMS.map((item, i) => (
          <div className={`how-check-row${item.done ? ' is-done' : ''}`} key={item.text} style={{ '--d': `${i * 120}ms` }}>
            <span className="how-check-box" aria-hidden="true">
              {item.done && (
                <svg width="11" height="9" viewBox="0 0 11 9">
                  <path d="M1 4.5 4 7.5 10 1" fill="none" stroke="var(--ribbon)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <div className="how-cal-chip">
        <svg width="17" height="17" aria-hidden="true"><use href="#icon-calendar" /></svg>
        <span>Feb 1</span>
      </div>
    </div>
  )
}
