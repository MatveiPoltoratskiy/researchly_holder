import { useEffect } from 'react'
import { DISPLAYED_FIELDS, FIELD_DISPLAY } from '../data/fields'
import Glyph from './InterviewIcons'

// Same overlay/card chrome as InterviewModeModal.jsx (Esc + backdrop-click to close,
// body-scroll lock), but the choice inside is the interview's own step-1 field grid —
// literally the same tile classes (.interview-field-card etc), so a resume-upload
// student sees "that first interview question" verbatim rather than a re-skinned
// lookalike, per the ask.
export default function ProfessorFieldModal({ onPick, onClose }) {
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
      <div className="im-mode-card pff-card" role="dialog" aria-modal="true" aria-labelledby="pff-title">
        <button type="button" className="im-mode-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="pff-title" className="im-mode-title">What field are you drawn to?</h2>
        <p className="im-mode-sub">Pick one. We'll shuffle up matching professors from the directory.</p>

        <div className="interview-grid interview-grid--field pff-field-grid">
          {DISPLAYED_FIELDS.map((f) => {
            const meta = FIELD_DISPLAY[f.id] || { glyph: 'magnifier', color: 'var(--cover)' }
            return (
              <button
                type="button"
                key={f.id}
                className="interview-field-card"
                style={{ '--field-color': meta.color }}
                onClick={() => onPick(f.id)}
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
      </div>
    </div>
  )
}
