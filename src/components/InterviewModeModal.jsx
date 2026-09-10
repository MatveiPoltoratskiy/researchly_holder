import { useEffect } from 'react'

const VOICE_SUPPORTED = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

export default function InterviewModeModal({ onClose, onPickVoice, onPickGuided }) {
  // Esc to close, and lock body scroll while open — this is a real modal over a normal
  // scrolling page (unlike the fixed one-viewport app screens), so without the lock the
  // page underneath keeps scrolling behind it.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div className="im-mode-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="im-mode-card" role="dialog" aria-modal="true" aria-labelledby="im-mode-title">
        <button type="button" className="im-mode-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="im-mode-title" className="im-mode-title">How would you like to start?</h2>
        <p className="im-mode-sub">Either way gets you to real matches. You can always switch if it's not working for you.</p>

        <div className="im-mode-options">
          <button
            type="button"
            className="im-mode-option"
            onClick={onPickVoice}
            disabled={!VOICE_SUPPORTED}
            title={VOICE_SUPPORTED ? undefined : 'Voice input needs Chrome or Edge'}
          >
            <span className="im-mode-option-icon im-mode-option-icon--voice">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-mic" /></svg>
            </span>
            <span className="im-mode-option-title">Just speak for a minute</span>
            <span className="im-mode-option-desc">
              Talk naturally about your interests, grade, and what you're looking for.
            </span>
            {!VOICE_SUPPORTED && <span className="im-mode-option-note">Needs Chrome or Edge</span>}
            <span className="im-mode-option-btn im-mode-option-btn--voice">Start speaking</span>
          </button>

          <button type="button" className="im-mode-option" onClick={onPickGuided}>
            <span className="im-mode-option-icon im-mode-option-icon--guided">
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-list" /></svg>
            </span>
            <span className="im-mode-option-title">Actual interview</span>
            <span className="im-mode-option-desc">Answer guided questions one stage at a time.</span>
            <span className="im-mode-option-btn im-mode-option-btn--guided">Start interview</span>
          </button>
        </div>
      </div>
    </div>
  )
}
