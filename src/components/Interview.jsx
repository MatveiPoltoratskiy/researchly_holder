import { useEffect, useRef, useState } from 'react'
import { useRouter } from '../lib/router'
import { FIELDS, FIELD_BY_ID } from '../data/fields'
import { searchCities } from '../data/worldCities'
import { burstConfetti } from '../lib/confetti'
import Glyph from './InterviewIcons'
import InterviewLoading from './InterviewLoading'

// Order follows the "hook them, then narrow" logic: interest questions first (field,
// sub-focus, opportunity type) while curiosity is highest, then the harder eligibility
// filters (level, location) once they're invested, then the two finishing preference
// questions. This deliberately reverses the "hard filters first" instinct in favor of
// engagement, since the product's whole pitch is "feels like a quiz, not a form."
const TOTAL_STEPS = 7

// steps where more than one answer legitimately applies, rendered as checkboxes plus a
// bottom Continue button instead of auto-advancing on the first click
const MULTI_SELECT_STEPS = new Set([2, 3])

// trimmed from the full taxonomy: economics, political science, business, and law are
// real fields but have the thinnest, least popular research-opportunity pools of the
// bunch for this age group (mostly internships/shadowing, not bench or lab research) —
// cut to keep the list from padding itself with options that will mostly disappoint.
// Humanitarian stays: it's named explicitly in the brand brief as a core focal type.
const HIDDEN_FIELD_IDS = new Set(['economics', 'political-science', 'business', 'law'])
const DISPLAYED_FIELDS = FIELDS.filter((f) => !HIDDEN_FIELD_IDS.has(f.id))

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

// keyed by subfocus id (unique across every field, see data/fields.js). only tier-1
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
    items: [
      { id: 'hs-9', num: '9', label: 'Grade 9' },
      { id: 'hs-10', num: '10', label: 'Grade 10' },
      { id: 'hs-11', num: '11', label: 'Grade 11' },
      { id: 'hs-12', num: '12', label: 'Grade 12' },
    ],
  },
  {
    label: 'Undergrad',
    items: [
      { id: 'ugrad-1', num: '1', label: '1st year' },
      { id: 'ugrad-2', num: '2', label: '2nd year' },
      { id: 'ugrad-3', num: '3', label: '3rd year' },
      { id: 'ugrad-4', num: '4', label: '4th year' },
    ],
  },
]

const EXPERIENCE_LEVELS = [
  { id: 'exploring', num: '1', label: 'Exploring', desc: "New to this, still figuring out what excites me" },
  { id: 'some-experience', num: '2', label: 'Some experience', desc: 'A class project, a club, or dabbling on my own' },
  { id: 'regular-practice', num: '3', label: 'Regular practice', desc: "Stuck with it: coursework, competitions, self-study" },
  { id: 'experienced', num: '4', label: 'Experienced', desc: 'Prior research, publications, or advanced coursework' },
]

const PAID_PREFS = [
  { id: 'paid-only', glyph: 'dollarCoin', label: 'Paid only', desc: 'I need this to come with a stipend or salary' },
  { id: 'open-to-unpaid', glyph: 'target', label: 'Open to unpaid too', desc: 'The experience matters more than the pay' },
  { id: 'doesnt-matter', glyph: 'either', label: "Doesn't matter", desc: 'Show me everything, paid or not' },
]

const STEP_LABELS = ['Field', 'Focus', 'Format', 'Level', 'Location', 'Experience', 'Pay']

function hasSubfocus(fieldId) {
  return (FIELD_BY_ID[fieldId]?.subfocus?.length || 0) > 0
}

// shared tile used by steps 2/3 (grid) and 7 (vertical) — a glyph badge tinted by
// whatever color it's given, inverting to a solid fill + white glyph once selected
function OptionRow({ glyph, color, label, desc, selected, onClick }) {
  return (
    <button type="button" className={`interview-option-row ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="interview-option-emoji" style={color ? { '--field-color': color } : undefined}>
        <Glyph name={glyph} size={26} />
      </span>
      <span className="interview-option-main">
        <span className="interview-option-label">{label}</span>
        <span className="interview-option-desc">{desc}</span>
      </span>
      <svg className="interview-option-check" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <use href="#icon-check" />
      </svg>
    </button>
  )
}

// shared tile used by step 4 (grade) and step 6 (experience) — a big number badge
// instead of a glyph, always in a single vertical column
function NumberRow({ num, label, desc, selected, onClick }) {
  return (
    <button type="button" className={`interview-option-row interview-option-row--num ${selected ? 'is-selected' : ''}`} onClick={onClick}>
      <span className="interview-num-badge">{num}</span>
      <span className="interview-option-main">
        <span className="interview-option-label">{label}</span>
        {desc && <span className="interview-option-desc">{desc}</span>}
      </span>
      <svg className="interview-option-check" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
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
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | granted | denied | unsupported
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  const locationCheckRef = useRef(null)
  const advanceTimerRef = useRef(null)
  const locationAdvanceTimerRef = useRef(null)

  function set(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  function goTo(n) {
    setStep(Math.max(1, Math.min(TOTAL_STEPS + 1, n)))
  }

  // most fields (everything past the original tier-1 five) don't have a sub-focus list
  // yet, so step 2 only exists for fields that have one, and back navigation from step 3
  // needs to skip over it too
  function goBack() {
    if (step === 3 && !hasSubfocus(answers.field)) {
      goTo(1)
      return
    }
    goTo(step - 1)
  }

  // single-select steps advance automatically a beat after picking. feels like a quiz,
  // not a form you have to confirm your way through
  function selectAndAdvance(key, value, extra) {
    clearTimeout(advanceTimerRef.current)
    setAnswers((a) => ({ ...a, [key]: value, ...extra }))
    advanceTimerRef.current = setTimeout(() => goTo(step + 1), 320)
  }

  // multi-select steps (Focus, Format) toggle in place, no auto-advance, since the whole
  // point is picking more than one before continuing
  function toggleMulti(key, value) {
    setAnswers((a) => {
      const current = a[key] || []
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...a, [key]: next }
    })
  }

  function handleFieldPick(fieldId) {
    clearTimeout(advanceTimerRef.current)
    setAnswers((a) => ({ ...a, field: fieldId, subfocus: [] }))
    advanceTimerRef.current = setTimeout(() => goTo(hasSubfocus(fieldId) ? 2 : 3), 320)
  }

  // fires the confetti + green check moment, then auto-advances shortly after, whether
  // the location came from geolocation, an autocomplete pick, or "remote only"
  function confirmLocation() {
    setLocationConfirmed(true)
    setShowSuggestions(false)
    if (locationCheckRef.current) burstConfetti(locationCheckRef.current, 14)
    clearTimeout(locationAdvanceTimerRef.current)
    locationAdvanceTimerRef.current = setTimeout(() => goTo(step + 1), 900)
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { Accept: 'application/json' } }
          )
          const data = await res.json()
          const a = data?.address || {}
          const city = a.city || a.town || a.village || a.municipality || a.county
          const region = a.state || a.region || a.country
          const label = [city, region].filter(Boolean).join(', ')
          set('location', label || 'Current location')
        } catch {
          set('location', 'Current location')
        }
        setLocationStatus('granted')
        confirmLocation()
      },
      () => setLocationStatus('denied'),
      { timeout: 8000 }
    )
  }

  // auto-request the moment this step is reached, so the browser's permission prompt
  // shows up without the student having to find and press a button first
  useEffect(() => {
    if (step === 5 && locationStatus === 'idle' && !answers.remoteOnly) {
      requestLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function handleLocationInputChange(value) {
    set('location', value)
    setLocationConfirmed(false)
    const matches = searchCities(value)
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
  }

  function pickSuggestion(city) {
    set('location', city)
    setSuggestions([])
    confirmLocation()
  }

  function handleLocationContinue(e) {
    e.preventDefault()
    if (answers.location.trim() && !locationConfirmed) {
      confirmLocation()
      return
    }
    goTo(step + 1)
  }

  function handleRemoteToggle(checked) {
    set('remoteOnly', checked)
    if (checked) {
      set('location', '')
      confirmLocation()
    } else {
      setLocationConfirmed(false)
    }
  }

  // the last question hands off straight to the loading transition — no "see your
  // matches" click required, no summary screen to stop at first
  function finishInterview(value) {
    clearTimeout(advanceTimerRef.current)
    setAnswers((a) => ({ ...a, paidPref: value }))
    advanceTimerRef.current = setTimeout(() => setShowLoading(true), 320)
  }

  const field = answers.field ? FIELD_BY_ID[answers.field] : null
  const subfocusOptions = field?.subfocus || []
  const isMultiStep = MULTI_SELECT_STEPS.has(step)

  if (showLoading) {
    return <InterviewLoading onDone={() => navigate('/opportunities')} />
  }

  return (
    <section className="interview-page">
      <div className="container interview-container">
        <div className="interview-progress-row">
              <button type="button" className="interview-back" onClick={goBack} disabled={step === 1}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
              <div className="interview-card-head">
                {step === 1 && (
                  <>
                    <h1 className="interview-question">What pulls you in?</h1>
                    <p className="interview-subtext">Pick the field you would want to spend a summer doing research in.</p>
                  </>
                )}
                {step === 2 && field && (
                  <>
                    <h1 className="interview-question">What part of {field.label.toLowerCase()} pulls you in?</h1>
                    <p className="interview-subtext">Pick every focus that fits. You can choose more than one.</p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h1 className="interview-question">What kind of opportunity?</h1>
                    <p className="interview-subtext">Pick as many as you would take. This just sets the starting point.</p>
                  </>
                )}
                {step === 4 && (
                  <>
                    <h1 className="interview-question">What grade are you in?</h1>
                    <p className="interview-subtext">This narrows the list more than almost anything else.</p>
                  </>
                )}
                {step === 5 && (
                  <>
                    <h1 className="interview-question">Where are you looking?</h1>
                    <p className="interview-subtext">
                      {locationStatus === 'loading'
                        ? "Finding your location now, hang tight."
                        : 'City or zip works. We will use it to find programs near you.'}
                    </p>
                  </>
                )}
                {step === 6 && (
                  <>
                    <h1 className="interview-question">How much experience do you already have?</h1>
                    <p className="interview-subtext">Be honest. This decides whether we surface entry-level or competitive programs.</p>
                  </>
                )}
                {step === 7 && (
                  <>
                    <h1 className="interview-question">Paid or unpaid?</h1>
                    <p className="interview-subtext">Last question. Most students take either if the opportunity is strong enough.</p>
                  </>
                )}
              </div>

              <div className="interview-card-scroll">
                {step === 1 && (
                  <div className="interview-grid interview-grid--field">
                    {DISPLAYED_FIELDS.map((f) => {
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
                            <Glyph name={meta.glyph} size={28} />
                          </span>
                          <span className="interview-field-label">{f.label}</span>
                          <span className="interview-field-blurb">{f.blurb}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {step === 2 && field && (
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
                )}

                {step === 3 && (
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
                )}

                {step === 4 && (
                  <>
                    {LEVEL_GROUPS.map((group) => (
                      <div className="interview-level-group" key={group.label}>
                        <span className="interview-level-group-label">{group.label}</span>
                        <div className="interview-option-list interview-option-list--vertical">
                          {group.items.map((item) => (
                            <NumberRow
                              key={item.id}
                              num={item.num}
                              label={item.label}
                              selected={answers.level === item.id}
                              onClick={() => selectAndAdvance('level', item.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {step === 5 && (
                  <form className="interview-location-form" onSubmit={handleLocationContinue}>
                    <div className="interview-location-input-wrap">
                      <span className="interview-location-input-emoji">
                        <Glyph name="pin" size={20} />
                      </span>
                      <input
                        type="text"
                        className="interview-location-input"
                        placeholder={locationStatus === 'loading' ? 'Locating you...' : 'City or zip code'}
                        value={answers.location}
                        disabled={answers.remoteOnly || locationStatus === 'loading'}
                        onChange={(e) => handleLocationInputChange(e.target.value)}
                        onFocus={() => setSuggestions(searchCities(answers.location))}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                        autoFocus
                      />
                      {locationStatus === 'loading' && <span className="interview-location-spinner" aria-hidden="true" />}
                      {locationConfirmed && (
                        <span className="interview-location-check" ref={locationCheckRef}>
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check" /></svg>
                        </span>
                      )}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="interview-location-suggestions">
                          {suggestions.map((city) => (
                            <button
                              type="button"
                              key={city}
                              className="interview-location-suggestion"
                              onMouseDown={() => pickSuggestion(city)}
                            >
                              <Glyph name="pin" size={15} />
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {answers.location.trim() && locationConfirmed && (
                      <button type="button" className="interview-update-location-btn" onClick={requestLocation}>
                        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-replay" /></svg>
                        Update location
                      </button>
                    )}

                    {locationStatus === 'denied' && !locationConfirmed && (
                      <p className="interview-location-note">
                        Location access was denied. Type your city above, or check remote only.
                      </p>
                    )}

                    <label className="interview-remote-toggle">
                      <input
                        type="checkbox"
                        checked={answers.remoteOnly}
                        onChange={(e) => handleRemoteToggle(e.target.checked)}
                      />
                      <Glyph name="laptop" size={16} />
                      <span>Remote only, I do not need something nearby</span>
                    </label>

                    <button
                      type="submit"
                      className="interview-continue-btn"
                      disabled={!answers.remoteOnly && !answers.location.trim()}
                    >
                      Continue
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                    </button>
                  </form>
                )}

                {step === 6 && (
                  <div className="interview-option-list interview-option-list--vertical">
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <NumberRow
                        key={lvl.id}
                        num={lvl.num}
                        label={lvl.label}
                        desc={lvl.desc}
                        selected={answers.experience === lvl.id}
                        onClick={() => selectAndAdvance('experience', lvl.id)}
                      />
                    ))}
                  </div>
                )}

                {step === 7 && (
                  <div className="interview-option-list interview-option-list--vertical">
                    {PAID_PREFS.map((p) => (
                      <OptionRow
                        key={p.id}
                        glyph={p.glyph}
                        label={p.label}
                        desc={p.desc}
                        selected={answers.paidPref === p.id}
                        onClick={() => finishInterview(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {isMultiStep && (
                <div className="interview-step-actions">
                  <button
                    type="button"
                    className="interview-continue-btn"
                    disabled={(step === 2 ? answers.subfocus : answers.oppType).length === 0}
                    onClick={() => goTo(step + 1)}
                  >
                    Continue
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                  </button>
                </div>
              )}
            </div>
      </div>
    </section>
  )
}
