import { useEffect, useRef, useState } from 'react'
import { useRouter } from '../lib/router'
import { parseSpokenAnswers } from '../lib/parseSpokenAnswers'
import { setVoiceAnswers } from '../lib/voiceInterviewHandoff'
import VoiceWaveBackground from './VoiceWaveBackground'

const BOARD_TOPICS = [
  { icon: 'icon-compass', label: 'Interests' },
  { icon: 'icon-grad-cap', label: 'Grade' },
  { icon: 'icon-pin', label: 'Location' },
  { icon: 'icon-calendar', label: 'Timing' },
  { icon: 'icon-dollar', label: 'Paid?' },
]

// Same order as BOARD_TOPICS above (the idle screen's promise) and CLAUDE.md's stated
// interview order (level, then location, then timing, then paid) so the guided voice
// flow actually delivers on what the idle screen told the student to expect.
const VOICE_STEPS = [
  { key: 'interest', icon: 'icon-compass', question: "What are you interested in?", hint: 'Say a field, like biology or computer science.' },
  { key: 'level', icon: 'icon-grad-cap', question: 'What grade or year are you in?', hint: 'A high school grade or a college year both work.' },
  { key: 'location', icon: 'icon-pin', question: 'Where are you located?', hint: 'Say your city, or say remote only.' },
  { key: 'timing', icon: 'icon-calendar', question: 'When are you available?', hint: 'Summer, year round, or both.' },
  { key: 'paid', icon: 'icon-dollar', question: 'Does it need to be paid?', hint: 'Paid, unpaid, or say it does not matter.' },
]

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// How long a question waits after the student stops talking before auto-advancing, and a
// hard cap per question in case they never pause (or recognition never fires a result at
// all) so the flow can't get stuck forever on one step.
const SILENCE_ADVANCE_MS = 1500
const MAX_QUESTION_MS = 20000

const EMPTY_ANSWERS = parseSpokenAnswers('')

// Each question's transcript is parsed independently (same free-form parser, just handed a
// much shorter, focused utterance), then merged in — a later step never blanks out
// something an earlier step already caught, it only adds to it.
function mergeAnswers(base, patch) {
  return {
    field: patch.field || base.field,
    subfocus: patch.subfocus?.length ? patch.subfocus : base.subfocus,
    oppType: patch.oppType?.length ? patch.oppType : base.oppType,
    level: patch.level || base.level,
    location: patch.location || base.location,
    locationCoords: patch.locationCoords || base.locationCoords,
    remoteOnly: patch.remoteOnly || base.remoteOnly,
    experience: patch.experience || base.experience,
    applyStart: patch.applyStart || base.applyStart,
    applyEnd: patch.applyEnd || base.applyEnd,
    paidPref: patch.paidPref || base.paidPref,
  }
}

export default function InterviewVoice() {
  const { navigate } = useRouter()
  // idle | question | analyzing | unsupported
  // (no "recap" screen — as little friction as possible, straight into /interview once
  // the last question's silence-timer or hard cap fires)
  const [status, setStatus] = useState(SpeechRecognitionCtor ? 'idle' : 'unsupported')
  const [stepIndex, setStepIndex] = useState(0)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [micDenied, setMicDenied] = useState(false)

  const recognitionRef = useRef(null)
  const answersRef = useRef(EMPTY_ANSWERS)
  const stepFinalRef = useRef('')
  const interimRef = useRef('')
  const hasSpeechRef = useRef(false)
  const advancingRef = useRef(false)
  const lastSpeechAtRef = useRef(0)
  const stepStartedAtRef = useRef(0)
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

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
        if (result.isFinal) stepFinalRef.current += `${result[0].transcript} `
        else interim += result[0].transcript
      }
      interimRef.current = interim
      hasSpeechRef.current = true
      lastSpeechAtRef.current = Date.now()
      setInterimText(interim)
      setFinalText(stepFinalRef.current)
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicDenied(true)
      }
    }
    recognition.onend = () => {
      // continuous recognition can still stop on its own (a network hiccup, a browser's
      // own idle timeout) — restart it as long as the question flow is still going, so a
      // dropped connection doesn't just silently strand the student mid-question
      if (statusRef.current === 'question') {
        try {
          recognition.start()
        } catch {
          // already starting — fine
        }
      }
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
    answersRef.current = EMPTY_ANSWERS
    setStepIndex(0)
    setStatus('question')
    try {
      recognition.start()
    } catch {
      // start() throws if a session is already active — already listening either way
    }
  }

  // Runs once per question: resets that question's transcript buffers, then polls for
  // either 1.5s of silence after the student has said something, or a 20s hard cap, and
  // advances to the next question (or finishes) either way.
  useEffect(() => {
    if (status !== 'question') return
    advancingRef.current = false
    hasSpeechRef.current = false
    stepFinalRef.current = ''
    interimRef.current = ''
    setInterimText('')
    setFinalText('')
    const now = Date.now()
    lastSpeechAtRef.current = now
    stepStartedAtRef.current = now

    const id = setInterval(() => {
      if (advancingRef.current) return
      const silentLongEnough = hasSpeechRef.current && Date.now() - lastSpeechAtRef.current >= SILENCE_ADVANCE_MS
      const timedOut = Date.now() - stepStartedAtRef.current >= MAX_QUESTION_MS
      if (silentLongEnough || timedOut) {
        advancingRef.current = true
        completeStep()
      }
    }, 300)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stepIndex])

  function completeStep() {
    const stepText = (stepFinalRef.current || interimRef.current).trim()
    const parsed = parseSpokenAnswers(stepText)
    const merged = mergeAnswers(answersRef.current, parsed)
    answersRef.current = merged
    if (stepIndex + 1 >= VOICE_STEPS.length) {
      try {
        recognitionRef.current?.stop()
      } catch {
        // already stopped
      }
      setStatus('analyzing')
      // a short, deliberate pause (matches the loading beat every other transition in
      // this app has, even though the parse itself is instant), then straight into the
      // guided interview — no confirmation screen/extra tap in between, as little
      // friction as possible
      setTimeout(() => {
        setVoiceAnswers(merged)
        navigate('/interview')
      }, 700)
    } else {
      setStepIndex(stepIndex + 1)
    }
  }

  function triggerAdvance() {
    if (advancingRef.current) return
    advancingRef.current = true
    completeStep()
  }

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
  // a real denial. So this attempt never sets micDenied on failure; only a denial during
  // an actual question (a real gesture already happened to get there) is trustworthy.
  useEffect(() => {
    if (!SpeechRecognitionCtor || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop())
      })
      .catch(() => {
        // Ignored — see comment above.
      })
  }, [])

  const liveTranscript = [finalText, interimText].filter(Boolean).join(' ').trim()
  const currentStep = VOICE_STEPS[stepIndex]

  return (
    <section className="interview-page voice-page">
      {/* animated wave-dot background, orange highlights on the page's own cream (not the
          black the reference used) — replaces the earlier symbol-field background */}
      <VoiceWaveBackground />
      {/* warm-lit background glow, no book/plant props anymore, just the mascot itself now */}
      <div className="voice-scene" aria-hidden="true">
        <span className="voice-scene-glow" />
      </div>

      <button type="button" className="voice-brand" onClick={() => navigate('/')} aria-label="Researchly home">
        <img src="/assets/mascot-straight.png" alt="" />
        <span>Researchly</span>
      </button>

      <button type="button" className="interview-back-float" onClick={() => navigate('/')}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-home" /></svg>
        Home
      </button>

      <div className={`container interview-container${status === 'idle' ? ' interview-container--compact' : ''}`}>
        <div className={`interview-card voice-card${status === 'idle' ? ' voice-card--idle' : ''}`}>
          {status === 'unsupported' && (
            <div className="voice-center">
              <span className="voice-icon-badge voice-icon-badge--muted">
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-mic" /></svg>
              </span>
              <h1 className="interview-question">Voice isn't available here</h1>
              <p className="interview-subtext">
                Voice input needs Chrome or Edge. Take the guided interview instead, it only takes about a minute.
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
                  <img src="/assets/mascot-straight.png" alt="Researchly" />
                </div>
              </div>

              <div className="voice-board">
                <span className="voice-board-label">What I'll ask about</span>
                <div className="voice-board-grid">
                  {BOARD_TOPICS.map((t) => (
                    <div className="voice-board-item" key={t.label}>
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href={`#${t.icon}`} /></svg>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button type="button" className="voice-start-btn" onClick={handleStart}>
                <span className="voice-start-ring" aria-hidden="true" />
                <span className="voice-start-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-mic" /></svg>
                </span>
                Start talking
                <span className="voice-start-wave" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24"><use href="#icon-waveform" /></svg>
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
            </div>
          )}

          {status === 'question' && (
            <div className="voice-center voice-question">
              <div className="voice-steps" aria-hidden="true">
                {VOICE_STEPS.map((s, i) => (
                  <div className="voice-step-track" key={s.key}>
                    <span className={`voice-step-dot${i < stepIndex ? ' is-done' : ''}${i === stepIndex ? ' is-current' : ''}`}>
                      {i < stepIndex ? (
                        <svg width="12" height="12" viewBox="0 0 24 24"><use href="#icon-check" /></svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    {i < VOICE_STEPS.length - 1 && (
                      <span className={`voice-step-line${i < stepIndex ? ' is-done' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="voice-step-label">Step {stepIndex + 1} of {VOICE_STEPS.length}</p>

              <h1 className="voice-question-title">{currentStep.question}</h1>
              <p className="interview-subtext voice-question-hint">{currentStep.hint}</p>

              <div className="voice-record-panel">
                <div className="voice-record-status">
                  <span className="voice-record-mic">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-mic" /></svg>
                  </span>
                  <span className="voice-record-wave" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-waveform" /></svg>
                  </span>
                  <span className="voice-record-live">
                    <span className="voice-record-dot" aria-hidden="true" />
                    Listening
                  </span>
                </div>
                <div className="voice-record-transcript" aria-live="polite">
                  {liveTranscript || (
                    <span className="voice-transcript-placeholder">Go ahead, we're listening.</span>
                  )}
                </div>
              </div>

              {micDenied && (
                <p className="voice-error">
                  Microphone access was denied. Allow it in your browser's site settings, then try again.
                </p>
              )}

              <button type="button" className="interview-continue-btn" onClick={triggerAdvance}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
              </button>
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
        </div>
      </div>
    </section>
  )
}
