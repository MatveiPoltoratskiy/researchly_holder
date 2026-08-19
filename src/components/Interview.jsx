import { useRef, useState } from 'react'
import { useRouter } from '../lib/router'
import { FIELDS, FIELD_BY_ID } from '../data/fields'
import { burstConfetti } from '../lib/confetti'
import Glyph from './InterviewIcons'

// Order follows the "hook them, then narrow" logic: interest questions first (field,
// sub-focus, opportunity type) while curiosity is highest, then the harder eligibility
// filters (level, location) once they're invested, then the two finishing preference
// questions. See project notes — this deliberately reverses the "hard filters first"
// instinct in favor of engagement, since the product's whole pitch is "feels like a
// quiz, not a form."
const TOTAL_STEPS = 7

// steps where more than one answer legitimately applies — these render checkboxes and a
// bottom Continue button instead of auto-advancing on the first click
const MULTI_SELECT_STEPS = new Set([2, 3])

// every field in the taxonomy is offered here, not just the tier-1 ones the dataset can
// currently back — a thin/empty result for e.g. "Law" is an acceptable gap for now,
// showing students a narrower field list they can't pick from is not.
const FIELD_META = {
  biology: { glyph: 'dna', color: 'var(--pine)' },
  'pre-med': { glyph: 'stethoscope', color: 'var(--cover)' },
  neuroscience: { glyph: 'brain', color: 'var(--rose)' },
  chemistry: { glyph: 'flask', color: 'var(--gold)' },
  'computer-science': { glyph: 'laptop', color: 'var(--spine)' },
  physics: { glyph: 'atom', color: 'var(--navy)' },
  engineering: { glyph: 'wrench', color: 'var(--face)' },
  mathematics: { glyph: 'mathSymbol', color: 'var(--ribbon)' },
  psychology: { glyph: 'brain', color: 'var(--mauve)' },
  'environmental-science': { glyph: 'leaf', color: 'var(--sage-front)' },
  economics: { glyph: 'barChart', color: 'var(--cover-dark)' },
  'political-science': { glyph: 'flag', color: 'var(--slate-brown)' },
  humanitarian: { glyph: 'globe', color: 'var(--teal-deep)' },
  business: { glyph: 'briefcase', color: 'var(--amber-dark)' },
  law: { glyph: 'scale', color: 'var(--glass-rim-dark)' },
}

// keyed by subfocus id (unique across every field, see data/fields.js) — only tier-1
// fields have subfocus lists today, so this only ever needs to cover those
const SUBFOCUS_GLYPH = {
  'molecular-cell': 'magnifier', genetics: 'dna', ecology: 'leaf', 'micro-immuno': 'microbe', 'comp-bio': 'laptop',
  clinical: 'stethoscope', 'bench-medical': 'magnifier', 'public-health': 'globe', 'health-policy': 'clipboard', 'biomed-eng': 'wrench',
  cognitive: 'brain', 'molecular-neuro': 'magnifier', 'comp-neuro': 'laptop', 'clinical-neuro': 'stethoscope',
  organic: 'flask', biochem: 'dna', materials: 'cube', analytical: 'magnifier', 'comp-chem': 'laptop',
  'ai-ml': 'robot', software: 'laptop', 'systems-security': 'lock', 'computational-science': 'barChart', theory: 'integralSymbol', robotics: 'robot',
}

const OPP_TYPES = [
  { id: 'research-internship', glyph: 'magnifier', label: 'Research internship', desc: 'Hands-on work in a real lab or research group' },
  { id: 'summer-program', glyph: 'calendar', label: 'Summer program', desc: 'A structured multi-week program, often with a cohort' },
  { id: 'year-round-program', glyph: 'refresh', label: 'Year-round program', desc: 'An ongoing commitment during the school year' },
]

const LEVEL_GROUPS = [
  {
    label: 'High school',
    glyph: 'schoolBuilding',
    items: [
      { id: 'hs-9', label: '9th' },
      { id: 'hs-10', label: '10th' },
      { id: 'hs-11', label: '11th' },
      { id: 'hs-12', label: '12th' },
    ],
  },
  {
    label: 'Undergrad',
    glyph: 'gradCap',
    items: [
      { id: 'ugrad-1', label: '1st year' },
      { id: 'ugrad-2', label: '2nd year' },
      { id: 'ugrad-3', label: '3rd year' },
      { id: 'ugrad-4', label: '4th year' },
    ],
  },
]

const EXPERIENCE_LEVELS = [
  { id: 'exploring', glyph: 'sprout', label: 'Exploring', desc: "New to this — still figuring out what excites me" },
  { id: 'some-experience', glyph: 'magnifier', label: 'Some experience', desc: 'A class project, a club, or dabbling on my own' },
  { id: 'regular-practice', glyph: 'barChart', label: 'Regular practice', desc: "I've stuck with it — coursework, competitions, self-study" },
  { id: 'experienced', glyph: 'trophy', label: 'Experienced', desc: 'Prior research, publications, or advanced coursework' },
]

const PAID_PREFS = [
  { id: 'paid-only', glyph: 'dollarCoin', label: 'Paid only', desc: 'I need this to come with a stipend or salary' },
  { id: 'open-to-unpaid', glyph: 'target', label: 'Open to unpaid too', desc: 'The experience matters more than the pay' },
  { id: 'doesnt-matter', glyph: 'either', label: "Doesn't matter", desc: 'Show me everything, paid or not' },
]

const STEP_LABELS = ['Field', 'Focus', 'Format', 'Level', 'Location', 'Experience', 'Pay']

function levelLabel(id) {
  for (const group of LEVEL_GROUPS) {
    const hit = group.items.find((i) => i.id === id)
    if (hit) return hit.label + (group.label === 'High school' ? ' grade' : '')
  }
  return id
}

function hasSubfocus(fieldId) {
  return (FIELD_BY_ID[fieldId]?.subfocus?.length || 0) > 0
}

// shared tile used by steps 2/3/6/7 — a glyph badge (dark by default, inverts to white
// on a solid color fill once selected), a label + description, and a checkmark
function OptionRow({ glyph, color, label, desc, selected, onClick }) {
  return (
    <button type="button" className={`interview-option-row ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="interview-option-emoji" style={color ? { '--field-color': color } : undefined}>
        <Glyph name={glyph} size={24} />
      </span>
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
    subfocus: [],
    oppType: [],
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

  // most fields (everything past the original tier-1 five) don't have a sub-focus list
  // yet — step 2 only exists for fields that have one, so back navigation from step 3
  // needs to skip over it too
  function goBack() {
    if (step === 3 && !hasSubfocus(answers.field)) {
      goTo(1)
      return
    }
    goTo(step - 1)
  }

  // single-select steps advance automatically a beat after picking — feels like a quiz,
  // not a form you have to confirm your way through
  function selectAndAdvance(key, value, extra) {
    clearTimeout(advanceTimerRef.current)
    setAnswers((a) => ({ ...a, [key]: value, ...extra }))
    advanceTimerRef.current = setTimeout(() => goTo(step + 1), 320)
  }

  // multi-select steps (Focus, Format) toggle in place — no auto-advance, since the
  // whole point is picking more than one before continuing
  function toggleMulti(key, value) {
    setAnswers((a) => {
      const current = a[key] || []
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...a, [key]: next }
    })
  }

  function handleFieldPick(fieldId) {
    // changing field invalidates whatever sub-focus was picked for the OLD field, and
    // fields without a sub-focus list skip straight to step 3
    clearTimeout(advanceTimerRef.current)
    setAnswers((a) => ({ ...a, field: fieldId, subfocus: [] }))
    advanceTimerRef.current = setTimeout(() => goTo(hasSubfocus(fieldId) ? 2 : 3), 320)
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
      subfocus: [],
      oppType: [],
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
  const isMultiStep = MULTI_SELECT_STEPS.has(step)

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
                  <h1 className="interview-question">What pulls you in?</h1>
                  <p className="interview-subtext">Pick the field you'd want to spend a summer doing research in.</p>
                  <div className="interview-grid interview-grid--field">
                    {FIELDS.map((f) => {
                      const meta = FIELD_META[f.id] || { glyph: 'magnifier', color: 'var(--cover)' }
                      return (
                        <button
                          type="button"
                          key={f.id}
                          className={`interview-field-card ${answers.field === f.id ? 'is-selected' : ''}`}
                          style={{ '--field-color': meta.color }}
                          onClick={() => handleFieldPick(f.id)}
                        >
                          <span className="interview-field-icon">
                            <Glyph name={meta.glyph} size={30} />
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
                  <p className="interview-subtext">Pick every focus that fits — you can choose more than one.</p>
                  <div className="interview-option-list">
                    {subfocusOptions.map((sf) => (
                      <OptionRow
                        key={sf.id}
                        glyph={SUBFOCUS_GLYPH[sf.id] || 'magnifier'}
                        color={FIELD_META[field.id]?.color}
                        label={sf.label}
                        desc={sf.desc}
                        selected={answers.subfocus.includes(sf.id)}
                        onClick={() => toggleMulti('subfocus', sf.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="interview-question">What kind of opportunity?</h1>
                  <p className="interview-subtext">Pick as many as you'd take — this just sets the starting point.</p>
                  <div className="interview-option-list">
                    {OPP_TYPES.map((t) => (
                      <OptionRow
                        key={t.id}
                        glyph={t.glyph}
                        label={t.label}
                        desc={t.desc}
                        selected={answers.oppType.includes(t.id)}
                        onClick={() => toggleMulti('oppType', t.id)}
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
                        <Glyph name={group.glyph} size={17} /> {group.label}
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
                  <h1 className="interview-question">Where are you looking?</h1>
                  <p className="interview-subtext">City or zip works — we'll use it to find programs near you.</p>
                  <form className="interview-location-form" onSubmit={handleLocationContinue}>
                    <div className="interview-location-input-wrap">
                      <span className="interview-location-input-emoji">
                        <Glyph name="pin" size={20} />
                      </span>
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
                      <Glyph name="laptop" size={16} />
                      <span>Remote only — I don't need something nearby</span>
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
                        glyph={lvl.glyph}
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
                  <h1 className="interview-question">Paid or unpaid?</h1>
                  <p className="interview-subtext">Last question. Most students take either if the opportunity is strong enough.</p>
                  <div className="interview-option-list">
                    {PAID_PREFS.map((p) => (
                      <OptionRow
                        key={p.id}
                        glyph={p.glyph}
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

              {isMultiStep && (
                <div className="interview-step-actions">
                  <button
                    type="button"
                    className="interview-continue-btn"
                    disabled={(step === 2 ? answers.subfocus : answers.oppType).length === 0}
                    onClick={() => goTo(step + 1)}
                  >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="interview-done-card" ref={doneCardRef}>
            <span className="interview-done-badge">
              <Glyph name="party" size={40} />
            </span>
            <h1 className="interview-question">That's everything we need.</h1>
            <p className="interview-subtext">Here's what you told us — matching against it now.</p>
            <div className="interview-summary-chips">
              {field && (
                <span className="interview-summary-chip">
                  <Glyph name={FIELD_META[field.id]?.glyph} size={15} /> {field.label}
                </span>
              )}
              {answers.subfocus.map((sfId) => {
                const sf = subfocusOptions.find((s) => s.id === sfId)
                if (!sf) return null
                return (
                  <span className="interview-summary-chip" key={sfId}>
                    <Glyph name={SUBFOCUS_GLYPH[sfId] || 'magnifier'} size={15} /> {sf.label}
                  </span>
                )
              })}
              {answers.oppType.map((tId) => {
                const t = OPP_TYPES.find((o) => o.id === tId)
                if (!t) return null
                return (
                  <span className="interview-summary-chip" key={tId}>
                    <Glyph name={t.glyph} size={15} /> {t.label}
                  </span>
                )
              })}
              {answers.level && (
                <span className="interview-summary-chip">
                  <Glyph name="gradCap" size={15} /> {levelLabel(answers.level)}
                </span>
              )}
              <span className="interview-summary-chip">
                <Glyph name="pin" size={15} /> {answers.remoteOnly ? 'Remote only' : answers.location || 'Anywhere'}
              </span>
              {EXPERIENCE_LEVELS.find((l) => l.id === answers.experience) && (
                <span className="interview-summary-chip">
                  <Glyph name={EXPERIENCE_LEVELS.find((l) => l.id === answers.experience).glyph} size={15} />{' '}
                  {EXPERIENCE_LEVELS.find((l) => l.id === answers.experience).label}
                </span>
              )}
              {PAID_PREFS.find((p) => p.id === answers.paidPref) && (
                <span className="interview-summary-chip">
                  <Glyph name={PAID_PREFS.find((p) => p.id === answers.paidPref).glyph} size={15} />{' '}
                  {PAID_PREFS.find((p) => p.id === answers.paidPref).label}
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
