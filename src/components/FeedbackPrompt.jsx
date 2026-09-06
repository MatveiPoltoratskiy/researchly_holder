import { useEffect, useRef, useState } from 'react'
import { submitFeedback } from '../lib/formSubmit'

const STORAGE_KEY = 'rsly_feedback_prompted'

// shows once per browser — ever, not once per session — since the whole point is an
// occasional, low-key check-in rather than something a returning visitor gets nagged by.
// Dismissing it (or the X, or Escape) counts the same as answering it: either way, the
// visitor has "seen" the ask, and that's what this is tracking.
function alreadyShown() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
function markShown() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // localStorage unavailable — worst case it can show again next visit, not worth
    // failing over
  }
}

const RATINGS = [
  { id: 'very-bad', label: 'Very bad', color: 'var(--rose)' },
  { id: 'bad', label: 'Bad', color: 'var(--cover-dark)' },
  { id: 'okay', label: 'Okay', color: 'var(--gold)' },
  { id: 'good', label: 'Good', color: 'var(--sage-front)' },
  { id: 'great', label: 'Great', color: 'var(--match-green)' },
]
// one shared face shell (eyes never move) — only the mouth curve changes between
// ratings, so the five read as one character's expression shifting, not five icons
const MOUTH_PATH = {
  'very-bad': 'M8,15.5 Q12,10.5 16,15.5',
  bad: 'M8,14.5 Q12,12.3 16,14.5',
  okay: 'M8,14 L16,14',
  good: 'M8,12.8 Q12,15.8 16,12.8',
  great: 'M7,12 Q12,18.5 17,12',
}

function FaceIcon({ id, color }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.6" cy="9.3" r="1.3" fill={color} />
      <circle cx="15.4" cy="9.3" r="1.3" fill={color} />
      <path d={MOUTH_PATH[id]} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Fires once, after a random 6-10 minute stretch of actual time spent on whichever page
// mounts this (the opportunities explorer) — timed against this component's own mount,
// not wall-clock time, so navigating away and back resets the clock rather than firing
// the moment someone returns. See alreadyShown/markShown above for the once-ever gate.
const MIN_DELAY_MS = 6 * 60 * 1000
const MAX_DELAY_MS = 10 * 60 * 1000

export default function FeedbackPrompt() {
  const [visible, setVisible] = useState(false)
  const [rating, setRating] = useState(null)
  const [note, setNote] = useState('')
  const [hp, setHp] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (alreadyShown()) return
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
    timerRef.current = setTimeout(() => {
      setVisible(true)
      markShown()
    }, delay)
    return () => clearTimeout(timerRef.current)
  }, [])

  // Escape-to-close, and lock page scroll while open — same pattern as the opportunity
  // detail modal this reuses styling from
  useEffect(() => {
    if (!visible) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setVisible(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [visible])

  if (!visible) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return
    if (!rating && !note.trim()) {
      setStatus('error')
      setErrorMsg('Pick a rating or add a note first.')
      return
    }
    if (hp.trim()) {
      setStatus('done')
      return
    }
    setStatus('submitting')
    setErrorMsg('')
    const { ok, data } = await submitFeedback({ rating, note: note.trim(), hp })
    if (ok && data.ok) {
      setStatus('done')
      return
    }
    setStatus('error')
    setErrorMsg(data.error || 'Something went wrong. Please try again.')
  }

  return (
    <div
      className="opp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setVisible(false)
      }}
    >
      <div className="opp-modal opp-modal--feedback" role="dialog" aria-modal="true" aria-label="Feedback">
        <button type="button" className="opp-modal-close" onClick={() => setVisible(false)} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {status === 'done' ? (
          <div className="feedback-done">
            <img className="feedback-mascot" src="/assets/mascot-logo.png" alt="" />
            <h2 className="feedback-title">Thank you!</h2>
            <p className="feedback-subtext">That actually helps a lot — we appreciate you taking the time.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="company"
              className="hp-field"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
            <img className="feedback-mascot" src="/assets/mascot-logo.png" alt="" />
            <h2 className="feedback-title">How are we doing?</h2>
            <p className="feedback-subtext">Your feedback helps us make Researchly better for you.</p>

            <div className="feedback-rating-row">
              {RATINGS.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className={`feedback-rating-btn ${rating === r.id ? 'is-selected' : ''}`}
                  style={{ '--rating-color': r.color }}
                  onClick={() => {
                    setRating(r.id)
                    if (status === 'error') {
                      setStatus('idle')
                      setErrorMsg('')
                    }
                  }}
                >
                  <FaceIcon id={r.id} color={r.color} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            <textarea
              className="feedback-note"
              placeholder="Any tips, bugs, or other thoughts? (optional)"
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                if (status === 'error') {
                  setStatus('idle')
                  setErrorMsg('')
                }
              }}
              disabled={status === 'submitting'}
            />

            {status === 'error' && (
              <p className="waitlist-status is-error feedback-error" role="alert">
                {errorMsg}
              </p>
            )}

            <button type="submit" className="interview-continue-btn feedback-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Submit'}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
            </button>
            <p className="feedback-anon-note">No email needed — this is completely anonymous.</p>
          </form>
        )}
      </div>
    </div>
  )
}
