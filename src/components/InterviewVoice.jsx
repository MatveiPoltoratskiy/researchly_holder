import { useEffect, useRef, useState } from 'react'
import { useRouter } from '../lib/router'
import { FIELD_BY_ID } from '../data/fields'
import { LEVEL_GROUPS, EXPERIENCE_LEVELS, PAID_PREFS, OPP_TYPES } from './Interview'
import { parseSpokenAnswers } from '../lib/parseSpokenAnswers'
import { setVoiceAnswers } from '../lib/voiceInterviewHandoff'

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

const MAX_SECONDS = 90
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const LEVEL_LABEL_BY_ID = Object.fromEntries(
  LEVEL_GROUPS.flatMap((g) => g.items.map((item) => [item.id, `${g.label} · ${item.label}`]))
)

// `new Date("2027-06-01")` parses as UTC midnight, which reads back as May 31st in any
// timezone behind UTC — the same footgun Interview.jsx's own fromISODate avoids. Split
// the string manually instead of trusting the Date constructor with a bare ISO string.
function fromISODate(s) {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function formatSeconds(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Turns the parsed answers into a short list of plain-English chips for the recap
// screen — so a student sees exactly what got caught before committing to it, instead
// of the parse just silently steering the rest of the quiz.
function describeAnswers(a) {
  const chips = []
  if (a.field) chips.push(FIELD_BY_ID[a.field]?.label || a.field)
  if (a.subfocus?.length) {
    const field = FIELD_BY_ID[a.field]
    const labels = field?.subfocus?.filter((sf) => a.subfocus.includes(sf.id)).map((sf) => sf.label)
    if (labels?.length) chips.push(labels.join(', '))
  }
  if (a.oppType?.length) {
    chips.push(OPP_TYPES.filter((t) => a.oppType.includes(t.id)).map((t) => t.label).join(', '))
  }
  if (a.level) chips.push(LEVEL_LABEL_BY_ID[a.level] || a.level)
  if (a.remoteOnly) chips.push('Remote only')
  else if (a.location) chips.push(a.location)
  if (a.experience) chips.push(EXPERIENCE_LEVELS.find((l) => l.id === a.experience)?.label)
  if (a.applyStart) {
    const d = fromISODate(a.applyStart)
    chips.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`)
  }
  if (a.paidPref) chips.push(PAID_PREFS.find((p) => p.id === a.paidPref)?.label)
  return chips.filter(Boolean)
}

export default function InterviewVoice() {
  const { navigate } = useRouter()
  // idle | listening | stopped | analyzing | recap | unsupported
  const [status, setStatus] = useState(SpeechRecognitionCtor ? 'idle' : 'unsupported')
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [micDenied, setMicDenied] = useState(false)
  const [parsedAnswers, setParsedAnswers] = useState(null)

  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const finishRef = useRef(() => {})

  function ensureRecognition() {
    if (recognitionRef.current || !SpeechRecognitionCtor) return recognitionRef.current
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalTranscriptRef.current += `${result[0].transcript} `
        else interim += result[0].transcript
      }
      setInterimText(interim)
      setFinalText(finalTranscriptRef.current)
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicDenied(true)
        setStatus('idle')
      }
    }
    recognition.onend = () => {
      setStatus((s) => (s === 'listening' ? 'stopped' : s))
    }
    recognitionRef.current = recognition
    return recognition
  }

  function handleStart() {
    const recognition = ensureRecognition()
    if (!recognition) {
      setStatus('unsupported')
      return
    }
    setMicDenied(false)
    setElapsed(0)
    try {
      recognition.start()
      setStatus('listening')
    } catch {
      // start() throws if a session is already active — treat as already listening
      setStatus('listening')
    }
  }

  function handleFinish() {
    try {
      recognitionRef.current?.stop()
    } catch {
      // already stopped — nothing to do
    }
    setStatus('analyzing')
    const transcript = (finalTranscriptRef.current || interimText).trim()
    const parsed = parseSpokenAnswers(transcript)
    setParsedAnswers(parsed)
    // a short, deliberate pause rather than an instant jump — matches the loading beat
    // every other transition in this app has, even though the parse itself is instant
    setTimeout(() => setStatus('recap'), 700)
  }
  finishRef.current = handleFinish

  useEffect(() => {
    if (status !== 'listening') return
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= MAX_SECONDS) finishRef.current()
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status])

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.stop()
      } catch {
        // unmounting — nothing left to clean up beyond this
      }
    },
    []
  )

  // Ask for the mic right away, on page load, instead of waiting for the "tap to start"
  // click — so a student sees the browser's permission prompt the moment they land here,
  // in browsers (Chrome/Edge) that don't require a click first. Safari/WebKit, though,
  // requires an actual user gesture to show that dialog at all — calling getUserMedia
  // without one gets an instant NotAllowedError with NO dialog ever shown, which is NOT
  // a real denial. So this attempt never sets micDenied on failure; only the user's own
  // tap (handleStart -> recognition.start(), via the onerror handler below) can report a
  // genuine denial — otherwise Safari users would see "access denied" before ever being asked.
  useEffect(() => {
    if (!SpeechRecognitionCtor || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop())
      })
      .catch(() => {
        // Ignored — see comment above. A real denial still surfaces via handleStart's
        // own recognition.onerror once the user actually taps.
      })
  }, [])

  function handleContinue() {
    setVoiceAnswers(parsedAnswers)
    navigate('/interview')
  }

  const liveTranscript = [finalText, interimText].filter(Boolean).join(' ').trim()
  const chips = parsedAnswers ? describeAnswers(parsedAnswers) : []

  return (
    <section className="interview-page voice-page">
      {/* warm-lit desk scene, not the mockup's sky/mountains — this brand avoids sky/cloud
          imagery, so the "more enthusiastic background" ask is met with a warm glow plus
          the existing (previously unused) prop-books/prop-plant desk props instead, blurred
          into the background like the brand guide's "blurred bookshelves" suggestion */}
      <div className="voice-scene" aria-hidden="true">
        <span className="voice-scene-glow" />
        <svg className="voice-scene-books" viewBox="0 0 210 150"><use href="#prop-books" /></svg>
        <svg className="voice-scene-plant" viewBox="0 0 130 160"><use href="#prop-plant" /></svg>
        <svg className="voice-scene-page voice-scene-page--a" viewBox="0 0 40 52"><use href="#deco-page" /></svg>
        <svg className="voice-scene-page voice-scene-page--b" viewBox="0 0 40 52"><use href="#deco-page" /></svg>
        <svg className="voice-scene-page voice-scene-page--c" viewBox="0 0 40 52"><use href="#deco-page" /></svg>
      </div>

      <button type="button" className="voice-brand" onClick={() => navigate('/')} aria-label="Researchly home">
        <img src="/assets/mascot-logo.png" alt="" />
        <span>Researchly</span>
      </button>

      <button type="button" className="interview-back-float" onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-home" /></svg>
        Home
      </button>

      <div className="container interview-container">
        <div className="interview-card voice-card">
          {status === 'unsupported' && (
            <div className="voice-center">
              <span className="voice-icon-badge voice-icon-badge--muted">
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-mic" /></svg>
              </span>
              <h1 className="interview-question">Voice isn't available here</h1>
              <p className="interview-subtext">
                Voice input needs Chrome or Edge. Take the guided interview instead — it only takes about a minute.
              </p>
              <button type="button" className="interview-continue-btn" onClick={() => navigate('/interview')}>
                Start the guided interview
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
              </button>
            </div>
          )}

          {status === 'idle' && (
            <div className="voice-center voice-hero">
              <div className="voice-mascot-stage">
                <span className="voice-mascot-shadow" aria-hidden="true" />
                <div className="voice-mascot-figure">
                  <img src="/assets/mascot-logo.png" alt="" />
                </div>
                <span className="voice-mascot-callout" aria-hidden="true">Ask me anything!</span>
              </div>

              <div className="voice-bubble">
                <span className="voice-bubble-tail" aria-hidden="true" />
                <p className="voice-bubble-lead">
                  Hi! I'm <span className="voice-bubble-brand">Researchly</span> — your AI research companion.
                </p>
                <p className="voice-bubble-sub">
                  Talk for about a minute about your interests, grade, location, timing, and whether it
                  needs to pay. We'll turn it into your interview automatically.
                </p>
              </div>

              <button type="button" className="voice-start-btn" onClick={handleStart}>
                <span className="voice-start-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-mic" /></svg>
                </span>
                Start talking
                <span className="voice-start-wave" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24"><use href="#icon-waveform" /></svg>
                </span>
              </button>
              <p className="voice-start-hint">Your microphone is used only to build your roadmap.</p>

              {micDenied && (
                <p className="voice-error">
                  Microphone access was denied. Allow it in your browser's site settings, then try again.
                </p>
              )}

              <button type="button" className="voice-skip-link voice-skip-pill" onClick={() => navigate('/interview')}>
                Prefer typing? Take the guided interview instead
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
              </button>

              <div className="voice-feature-strip">
                <div className="voice-feature">
                  <span className="voice-feature-icon voice-feature-icon--a">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-search" /></svg>
                  </span>
                  <div>
                    <strong>Find opportunities</strong>
                    <p>Research, internships, programs.</p>
                  </div>
                </div>
                <div className="voice-feature">
                  <span className="voice-feature-icon voice-feature-icon--b">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-grad-cap" /></svg>
                  </span>
                  <div>
                    <strong>Get matched</strong>
                    <p>AI tailored to your goals.</p>
                  </div>
                </div>
                <div className="voice-feature">
                  <span className="voice-feature-icon voice-feature-icon--c">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-compass" /></svg>
                  </span>
                  <div>
                    <strong>Build your future</strong>
                    <p>Make informed decisions.</p>
                  </div>
                </div>
                <div className="voice-feature">
                  <span className="voice-feature-icon voice-feature-icon--d">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-people" /></svg>
                  </span>
                  <div>
                    <strong>For high schoolers + undergrads</strong>
                    <p>All in one place.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(status === 'listening' || status === 'stopped') && (
            <div className="voice-center">
              <button
                type="button"
                className={`voice-mic-btn ${status === 'listening' ? 'is-listening' : ''}`}
                onClick={status === 'listening' ? undefined : handleStart}
                aria-label={status === 'listening' ? 'Listening' : 'Resume speaking'}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                  <use href={status === 'listening' ? '#icon-waveform' : '#icon-mic'} />
                </svg>
              </button>
              <p className="voice-timer">{formatSeconds(elapsed)} / {formatSeconds(MAX_SECONDS)}</p>
              <div className="voice-transcript" aria-live="polite">
                {liveTranscript || (
                  <span className="voice-transcript-placeholder">
                    {status === 'listening' ? "We're listening — go ahead." : 'Nothing caught yet.'}
                  </span>
                )}
              </div>
              <div className="voice-actions">
                {status === 'stopped' && (
                  <button type="button" className="voice-secondary-btn" onClick={handleStart}>
                    Keep talking
                  </button>
                )}
                <button type="button" className="interview-continue-btn" onClick={handleFinish}>
                  {status === 'stopped' ? 'Analyze what I said' : "Done, find my matches"}
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
                </button>
              </div>
              <button type="button" className="voice-skip-link" onClick={() => navigate('/interview')}>
                Prefer typing? Take the guided interview instead
              </button>
            </div>
          )}

          {status === 'analyzing' && (
            <div className="voice-center">
              <span className="voice-analyzing-spinner" aria-hidden="true" />
              <h1 className="interview-question">Turning that into your interview…</h1>
            </div>
          )}

          {status === 'recap' && (
            <div className="voice-center">
              <div className="voice-icon-badge">
                <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check" /></svg>
              </div>
              <h1 className="interview-question">
                {chips.length ? "Here's what we picked up" : "We didn't catch much"}
              </h1>
              <p className="interview-subtext">
                {chips.length
                  ? "We'll skip straight past these and ask about anything we missed."
                  : "No worries — let's fill it in together, one question at a time."}
              </p>
              {chips.length > 0 && (
                <div className="voice-chip-row">
                  {chips.map((chip, i) => (
                    <span className="voice-chip" key={i}>{chip}</span>
                  ))}
                </div>
              )}
              <button type="button" className="interview-continue-btn" onClick={handleContinue}>
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
