import { useRef, useState } from 'react'
import { useRouter } from '../lib/router'
import { ACTIVE_FIELDS, FIELD_BY_ID } from '../data/fields'
import { burstConfetti } from '../lib/confetti'

// Order follows the "hook them, then narrow" logic: interest questions first (field,
// sub-focus, opportunity type) while curiosity is highest, then the harder eligibility
// filters (level, location) once they're invested, then the two finishing preference
// questions. See project notes — this deliberately reverses the "hard filters first"
// instinct in favor of engagement, since the product's whole pitch is "feels like a
// quiz, not a form."
const TOTAL_STEPS = 7

const FIELD_STYLE = {
  biology: { icon: 'flask', color: 'var(--pine)' },
  'pre-med': { icon: 'stethoscope', color: 'var(--cover)' },
  neuroscience: { icon: 'compass', color: 'var(--navy)' },
  chemistry: { icon: 'flask', color: 'var(--gold)' },
  'computer-science': { icon: 'list', color: 'var(--spine)' },
}

const OPP_TYPES = [
  { id: 'research-internship', label: 'Research internship', desc: 'Hands-on work in a real lab or research group' },
  { id: 'summer-program', label: 'Summer program', desc: 'A structured multi-week program, often with a cohort' },
  { id: 'year-round-program', label: 'Year-round program', desc: 'An ongoing commitment during the school year' },
]

const LEVEL_GROUPS = [
  {
    label: 'High school',
    items: [
      { id: 'hs-9', label: '9th' },
      { id: 'hs-10', label: '10th' },
      { id: 'hs-11', label: '11th' },
      { id: 'hs-12', label: '12th' },
    ],
  },
  {
    label: 'Undergrad',
    items: [
      { id: 'ugrad-1', label: '1st year' },
      { id: 'ugrad-2', label: '2nd year' },
      { id: 'ugrad-3', label: '3rd year' },
      { id: 'ugrad-4', label: '4th year' },
    ],
  },
]

const EXPERIENCE_LEVELS = [
  { id: 'exploring', label: 'Exploring', desc: "New to this — still figuring out what excites me" },
  { id: 'some-experience', label: 'Some experience', desc: 'A class project, a club, or dabbling on my own' },
  { id: 'regular-practice', label: 'Regular practice', desc: "I've stuck with it — coursework, competitions, self-study" },
  { id: 'experienced', label: 'Experienced', desc: 'Prior research, publications, or advanced coursework' },
]

const PAID_PREFS = [
  { id: 'paid-only', label: 'Paid only', desc: 'I need this to come with a stipend or salary' },
  { id: 'open-to-unpaid', label: 'Open to unpaid too', desc: 'The experience matters more than the pay' },
  { id: 'doesnt-matter', label: "Doesn't matter", desc: 'Show me everything, paid or not' },
]

const STEP_LABELS = ['Field', 'Focus', 'Format', 'Level', 'Location', 'Experience', 'Pay']

function levelLabel(id) {
  for (const group of LEVEL_GROUPS) {
    const hit = group.items.find((i) => i.id === id)
    if (hit) return hit.label + (group.label === 'High school' ? ' grade' : '')
  }
  return id
}

export default function Interview() {
  const { navigate } = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    field: null,
    subfocus: null,
    oppType: null,
    level: null,
    location: '',
    remoteOnly: false,
    experience: null,
    paidPref: null,
  })
  const doneCardRef = useRef(null)
  const advanceTimerRef = useRef(null)

  function set(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  function goTo(n) {
    setStep(Math.max(1, Math.min(TOTAL_STEPS + 1, n)))
  }

  function goBack() {
    goTo(step - 1)
  }

  // single-select steps advance automatically a beat after picking — feels like a quiz,
  // not a form you have to confirm your way through
  function selectAndAdvance(key, value, extra) {
    clearTimeout(advanceTimerRef.current)
    setAnswers((a) => ({ ...a, [key]: value, ...extra }))
    advanceTimerRef.current = setTimeout(() => goTo(step + 1), 320)
  }

  function handleFieldPick(fieldId) {
    // changing field invalidates whatever sub-focus was picked for the OLD field
    selectAndAdvance('field', fieldId, { subfocus: null })
  }

  function handleLocationContinue(e) {
    e.preventDefault()
    goTo(step + 1)
  }

  function handleFinish() {
    if (doneCardRef.current) burstConfetti(doneCardRef.current, 20)
  }

  function restart() {
    clearTimeout(advanceTimerRef.current)
    setAnswers({
      field: null,
      subfocus: null,
      oppType: null,
      level: null,
      location: '',
      remoteOnly: false,
      experience: null,
      paidPref: null,
    })
    goTo(1)
  }

  const field = answers.field ? FIELD_BY_ID[answers.field] : null
  const subfocusOptions = field?.subfocus || []
  const isDone = step > TOTAL_STEPS

  return (
    <section className="interview-page">
      <div className="container interview-container">
        {!isDone ? (
          <>
            <div className="interview-progress-row">
              <button
                type="button"
                className="interview-back"
                onClick={goBack}
                style={{ visibility: step > 1 ? 'visible' : 'hidden' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#icon-arrow" transform="rotate(180 12 12)" />
                </svg>
                Back
              </button>
              <span className="interview-progress-label">
                {STEP_LABELS[step - 1]} · {step} of {TOTAL_STEPS}
              </span>
            </div>
            <div className="interview-progress-track" aria-hidden="true">
              <div className="interview-progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
            </div>

            <div className="interview-card" key={step}>
              {step === 1 && (
                <>
                  <h1 className="interview-question">What pulls you in?</h1>
                  <p className="interview-subtext">Pick the field you'd want to spend a summer doing research in.</p>
                  <div className="interview-grid interview-grid--field">
                    {ACTIVE_FIELDS.map((f) => {
                      const style = FIELD_STYLE[f.id] || { icon: 'flask', color: 'var(--cover)' }
                      return (
                        <button
                          type="button"
                          key={f.id}
                          className={`interview-field-card ${answers.field === f.id ? 'is-selected' : ''}`}
                          style={{ '--field-color': style.color }}
                          onClick={() => handleFieldPick(f.id)}
                        >
                          <span className="interview-field-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                              <use href={`#icon-${style.icon}`} />
                            </svg>
                          </span>
                          <span className="interview-field-label">{f.label}</span>
                          <span className="interview-field-blurb">{f.blurb}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {step === 2 && field && (
                <>
                  <h1 className="interview-question">What part of {field.label.toLowerCase()} pulls you in?</h1>
                  <p className="interview-subtext">This is the difference between a wet-lab placement and a hospital shadowing program.</p>
                  <div className="interview-option-list">
                    {subfocusOptions.map((sf) => (
                      <button
                        type="button"
                        key={sf.id}
                        className={`interview-option-row ${answers.subfocus === sf.id ? 'is-selected' : ''}`}
                        onClick={() => selectAndAdvance('subfocus', sf.id)}
                      >
                        <span className="interview-option-main">
                          <span className="interview-option-label">{sf.label}</span>
                          <span className="interview-option-desc">{sf.desc}</span>
                        </span>
                        <svg className="interview-option-check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <use href="#icon-check" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="interview-question">What kind of opportunity?</h1>
                  <p className="interview-subtext">You can always widen this later — this just sets the starting point.</p>
                  <div className="interview-option-list">
                    {OPP_TYPES.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className={`interview-option-row ${answers.oppType === t.id ? 'is-selected' : ''}`}
                        onClick={() => selectAndAdvance('oppType', t.id)}
                      >
                        <span className="interview-option-main">
                          <span className="interview-option-label">{t.label}</span>
                          <span className="interview-option-desc">{t.desc}</span>
                        </span>
                        <svg className="interview-option-check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <use href="#icon-check" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h1 className="interview-question">What grade are you in?</h1>
                  <p className="interview-subtext">This narrows the list more than almost anything else — a 9th grader and a college sophomore qualify for very different programs.</p>
                  {LEVEL_GROUPS.map((group) => (
                    <div className="interview-chip-group" key={group.label}>
                      <span className="interview-chip-group-label">{group.label}</span>
                      <div className="interview-chip-row">
                        {group.items.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className={`interview-chip ${answers.level === item.id ? 'is-selected' : ''}`}
                            onClick={() => selectAndAdvance('level', item.id)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {step === 5 && (
                <>
                  <h1 className="interview-question">Where are you looking?</h1>
                  <p className="interview-subtext">City or zip works — we'll use it to find programs near you.</p>
                  <form className="interview-location-form" onSubmit={handleLocationContinue}>
                    <input
                      type="text"
                      className="interview-location-input"
                      placeholder="City or zip code"
                      value={answers.location}
                      disabled={answers.remoteOnly}
                      onChange={(e) => set('location', e.target.value)}
                      autoFocus
                    />
                    <label className="interview-remote-toggle">
                      <input
                        type="checkbox"
                        checked={answers.remoteOnly}
                        onChange={(e) => set('remoteOnly', e.target.checked)}
                      />
                      <span>Remote only — I don't need something nearby</span>
                    </label>
                    <button
                      type="submit"
                      className="interview-continue-btn"
                      disabled={!answers.remoteOnly && !answers.location.trim()}
                    >
                      Continue
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                    </button>
                  </form>
                </>
              )}

              {step === 6 && (
                <>
                  <h1 className="interview-question">How much experience do you already have?</h1>
                  <p className="interview-subtext">Be honest — this decides whether we surface entry-level or competitive-lab programs.</p>
                  <div className="interview-option-list">
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <button
                        type="button"
                        key={lvl.id}
                        className={`interview-option-row ${answers.experience === lvl.id ? 'is-selected' : ''}`}
                        onClick={() => selectAndAdvance('experience', lvl.id)}
                      >
                        <span className="interview-option-main">
                          <span className="interview-option-label">{lvl.label}</span>
                          <span className="interview-option-desc">{lvl.desc}</span>
                        </span>
                        <svg className="interview-option-check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <use href="#icon-check" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 7 && (
                <>
                  <h1 className="interview-question">Paid or unpaid?</h1>
                  <p className="interview-subtext">Last question. Most students take either if the opportunity is strong enough.</p>
                  <div className="interview-option-list">
                    {PAID_PREFS.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        className={`interview-option-row ${answers.paidPref === p.id ? 'is-selected' : ''}`}
                        onClick={() => {
                          set('paidPref', p.id)
                          clearTimeout(advanceTimerRef.current)
                          advanceTimerRef.current = setTimeout(() => {
                            goTo(TOTAL_STEPS + 1)
                            handleFinish()
                          }, 320)
                        }}
                      >
                        <span className="interview-option-main">
                          <span className="interview-option-label">{p.label}</span>
                          <span className="interview-option-desc">{p.desc}</span>
                        </span>
                        <svg className="interview-option-check" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <use href="#icon-check" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="interview-done-card" ref={doneCardRef}>
            <span className="interview-done-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-badge-check" /></svg>
            </span>
            <h1 className="interview-question">That's everything we need.</h1>
            <p className="interview-subtext">Here's what you told us — matching against it now.</p>
            <div className="interview-summary-chips">
              {field && <span className="interview-summary-chip">{field.label}</span>}
              {subfocusOptions.find((s) => s.id === answers.subfocus) && (
                <span className="interview-summary-chip">{subfocusOptions.find((s) => s.id === answers.subfocus).label}</span>
              )}
              {OPP_TYPES.find((t) => t.id === answers.oppType) && (
                <span className="interview-summary-chip">{OPP_TYPES.find((t) => t.id === answers.oppType).label}</span>
              )}
              {answers.level && <span className="interview-summary-chip">{levelLabel(answers.level)}</span>}
              <span className="interview-summary-chip">{answers.remoteOnly ? 'Remote only' : answers.location || 'Anywhere'}</span>
              {EXPERIENCE_LEVELS.find((l) => l.id === answers.experience) && (
                <span className="interview-summary-chip">{EXPERIENCE_LEVELS.find((l) => l.id === answers.experience).label}</span>
              )}
              {PAID_PREFS.find((p) => p.id === answers.paidPref) && (
                <span className="interview-summary-chip">{PAID_PREFS.find((p) => p.id === answers.paidPref).label}</span>
              )}
            </div>
            <div className="interview-done-actions">
              <button type="button" className="interview-continue-btn" onClick={() => navigate('/opportunities')}>
                See my matches
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
              </button>
              <button type="button" className="interview-restart-btn" onClick={restart}>
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-replay" /></svg>
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
