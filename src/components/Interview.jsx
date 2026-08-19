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

const FIELD_META = {
  biology: { emoji: '🧬', color: 'var(--pine)' },
  'pre-med': { emoji: '🩺', color: 'var(--cover)' },
  neuroscience: { emoji: '🧠', color: 'var(--navy)' },
  chemistry: { emoji: '🧪', color: 'var(--gold)' },
  'computer-science': { emoji: '💻', color: 'var(--spine)' },
}

// keyed by subfocus id (unique across every field, see data/fields.js)
const SUBFOCUS_EMOJI = {
  'molecular-cell': '🔬', genetics: '🧬', ecology: '🌿', 'micro-immuno': '🦠', 'comp-bio': '💻',
  clinical: '🩺', 'bench-medical': '🔬', 'public-health': '🌍', 'health-policy': '📋', 'biomed-eng': '⚙️',
  cognitive: '🧠', 'molecular-neuro': '🔬', 'comp-neuro': '💻', 'clinical-neuro': '🩺',
  organic: '⚗️', biochem: '🧬', materials: '🧱', analytical: '🔍', 'comp-chem': '💻',
  'ai-ml': '🤖', software: '💻', 'systems-security': '🔒', 'computational-science': '📊', theory: '📐', robotics: '🦾',
}

const OPP_TYPES = [
  { id: 'research-internship', emoji: '🔬', label: 'Research internship', desc: 'Hands-on work in a real lab or research group' },
  { id: 'summer-program', emoji: '📅', label: 'Summer program', desc: 'A structured multi-week program, often with a cohort' },
  { id: 'year-round-program', emoji: '🔄', label: 'Year-round program', desc: 'An ongoing commitment during the school year' },
]

const LEVEL_GROUPS = [
  {
    label: 'High school',
    emoji: '🏫',
    items: [
      { id: 'hs-9', label: '9th' },
      { id: 'hs-10', label: '10th' },
      { id: 'hs-11', label: '11th' },
      { id: 'hs-12', label: '12th' },
    ],
  },
  {
    label: 'Undergrad',
    emoji: '🎓',
    items: [
      { id: 'ugrad-1', label: '1st year' },
      { id: 'ugrad-2', label: '2nd year' },
      { id: 'ugrad-3', label: '3rd year' },
      { id: 'ugrad-4', label: '4th year' },
    ],
  },
]

const EXPERIENCE_LEVELS = [
  { id: 'exploring', emoji: '🌱', label: 'Exploring', desc: "New to this — still figuring out what excites me" },
  { id: 'some-experience', emoji: '🔍', label: 'Some experience', desc: 'A class project, a club, or dabbling on my own' },
  { id: 'regular-practice', emoji: '📈', label: 'Regular practice', desc: "I've stuck with it — coursework, competitions, self-study" },
  { id: 'experienced', emoji: '🏆', label: 'Experienced', desc: 'Prior research, publications, or advanced coursework' },
]

const PAID_PREFS = [
  { id: 'paid-only', emoji: '💰', label: 'Paid only', desc: 'I need this to come with a stipend or salary' },
  { id: 'open-to-unpaid', emoji: '🎯', label: 'Open to unpaid too', desc: 'The experience matters more than the pay' },
  { id: 'doesnt-matter', emoji: '🤷', label: "Doesn't matter", desc: 'Show me everything, paid or not' },
]

const STEP_LABELS = ['Field', 'Focus', 'Format', 'Level', 'Location', 'Experience', 'Pay']

function levelLabel(id) {
  for (const group of LEVEL_GROUPS) {
    const hit = group.items.find((i) => i.id === id)
    if (hit) return hit.label + (group.label === 'High school' ? ' grade' : '')
  }
  return id
}

// shared row used by steps 2/3/6/7 — an emoji badge, label + description, and a
// checkmark that lights up once selected
function OptionRow({ emoji, label, desc, selected, onClick }) {
  return (
    <button type="button" className={`interview-option-row ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="interview-option-emoji" aria-hidden="true">{emoji}</span>
      <span className="interview-option-main">
        <span className="interview-option-label">{label}</span>
        <span className="interview-option-desc">{desc}</span>
      </span>
      <svg className="interview-option-check" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <use href="#icon-check" />
      </svg>
    </button>
  )
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
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
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
                  <h1 className="interview-question">What pulls you in? 👀</h1>
                  <p className="interview-subtext">Pick the field you'd want to spend a summer doing research in.</p>
                  <div className="interview-grid interview-grid--field">
                    {ACTIVE_FIELDS.map((f) => {
                      const meta = FIELD_META[f.id] || { emoji: '🔬', color: 'var(--cover)' }
                      return (
                        <button
                          type="button"
                          key={f.id}
                          className={`interview-field-card ${answers.field === f.id ? 'is-selected' : ''}`}
                          style={{ '--field-color': meta.color }}
                          onClick={() => handleFieldPick(f.id)}
                        >
                          <span className="interview-field-icon">{meta.emoji}</span>
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
                      <OptionRow
                        key={sf.id}
                        emoji={SUBFOCUS_EMOJI[sf.id] || '🔬'}
                        label={sf.label}
                        desc={sf.desc}
                        selected={answers.subfocus === sf.id}
                        onClick={() => selectAndAdvance('subfocus', sf.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="interview-question">What kind of opportunity? 🎒</h1>
                  <p className="interview-subtext">You can always widen this later — this just sets the starting point.</p>
                  <div className="interview-option-list">
                    {OPP_TYPES.map((t) => (
                      <OptionRow
                        key={t.id}
                        emoji={t.emoji}
                        label={t.label}
                        desc={t.desc}
                        selected={answers.oppType === t.id}
                        onClick={() => selectAndAdvance('oppType', t.id)}
                      />
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
                      <span className="interview-chip-group-label">
                        <span aria-hidden="true">{group.emoji}</span> {group.label}
                      </span>
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
                  <h1 className="interview-question">Where are you looking? 📍</h1>
                  <p className="interview-subtext">City or zip works — we'll use it to find programs near you.</p>
                  <form className="interview-location-form" onSubmit={handleLocationContinue}>
                    <div className="interview-location-input-wrap">
                      <span className="interview-location-input-emoji" aria-hidden="true">📍</span>
                      <input
                        type="text"
                        className="interview-location-input"
                        placeholder="City or zip code"
                        value={answers.location}
                        disabled={answers.remoteOnly}
                        onChange={(e) => set('location', e.target.value)}
                        autoFocus
                      />
                    </div>
                    <label className="interview-remote-toggle">
                      <input
                        type="checkbox"
                        checked={answers.remoteOnly}
                        onChange={(e) => set('remoteOnly', e.target.checked)}
                      />
                      <span>💻 Remote only — I don't need something nearby</span>
                    </label>
                    <button
                      type="submit"
                      className="interview-continue-btn"
                      disabled={!answers.remoteOnly && !answers.location.trim()}
                    >
                      Continue
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
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
                      <OptionRow
                        key={lvl.id}
                        emoji={lvl.emoji}
                        label={lvl.label}
                        desc={lvl.desc}
                        selected={answers.experience === lvl.id}
                        onClick={() => selectAndAdvance('experience', lvl.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 7 && (
                <>
                  <h1 className="interview-question">Paid or unpaid? 💸</h1>
                  <p className="interview-subtext">Last question. Most students take either if the opportunity is strong enough.</p>
                  <div className="interview-option-list">
                    {PAID_PREFS.map((p) => (
                      <OptionRow
                        key={p.id}
                        emoji={p.emoji}
                        label={p.label}
                        desc={p.desc}
                        selected={answers.paidPref === p.id}
                        onClick={() => {
                          set('paidPref', p.id)
                          clearTimeout(advanceTimerRef.current)
                          advanceTimerRef.current = setTimeout(() => {
                            goTo(TOTAL_STEPS + 1)
                            handleFinish()
                          }, 320)
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="interview-done-card" ref={doneCardRef}>
            <span className="interview-done-badge" aria-hidden="true">🎉</span>
            <h1 className="interview-question">That's everything we need.</h1>
            <p className="interview-subtext">Here's what you told us — matching against it now.</p>
            <div className="interview-summary-chips">
              {field && <span className="interview-summary-chip">{FIELD_META[field.id]?.emoji} {field.label}</span>}
              {subfocusOptions.find((s) => s.id === answers.subfocus) && (
                <span className="interview-summary-chip">
                  {SUBFOCUS_EMOJI[answers.subfocus]} {subfocusOptions.find((s) => s.id === answers.subfocus).label}
                </span>
              )}
              {OPP_TYPES.find((t) => t.id === answers.oppType) && (
                <span className="interview-summary-chip">
                  {OPP_TYPES.find((t) => t.id === answers.oppType).emoji} {OPP_TYPES.find((t) => t.id === answers.oppType).label}
                </span>
              )}
              {answers.level && <span className="interview-summary-chip">🎓 {levelLabel(answers.level)}</span>}
              <span className="interview-summary-chip">📍 {answers.remoteOnly ? 'Remote only' : answers.location || 'Anywhere'}</span>
              {EXPERIENCE_LEVELS.find((l) => l.id === answers.experience) && (
                <span className="interview-summary-chip">
                  {EXPERIENCE_LEVELS.find((l) => l.id === answers.experience).emoji} {EXPERIENCE_LEVELS.find((l) => l.id === answers.experience).label}
                </span>
              )}
              {PAID_PREFS.find((p) => p.id === answers.paidPref) && (
                <span className="interview-summary-chip">
                  {PAID_PREFS.find((p) => p.id === answers.paidPref).emoji} {PAID_PREFS.find((p) => p.id === answers.paidPref).label}
                </span>
              )}
            </div>
            <div className="interview-done-actions">
              <button type="button" className="interview-continue-btn" onClick={() => navigate('/opportunities')}>
                See my matches
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
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
