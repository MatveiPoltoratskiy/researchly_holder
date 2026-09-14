import { useEffect } from 'react'
import { buildGoogleCalendarUrl, buildOutlookWebUrl, downloadIcs, formatDeadlineLong } from '../lib/calendarEvent'

const OPTIONS = [
  { id: 'google', label: 'Google Calendar', hint: 'Opens in a new tab', icon: 'icon-calendar' },
  { id: 'apple', label: 'Apple Calendar', hint: 'Downloads a calendar file', icon: 'icon-calendar' },
  { id: 'outlook', label: 'Microsoft Outlook', hint: 'Opens in a new tab', icon: 'icon-mail' },
  { id: 'ics', label: 'Download .ics file', hint: 'For any other calendar app', icon: 'icon-download' },
]

/**
 * The "which calendar?" menu opened by the bell/reminder button. No calendar account is
 * ever connected here (no OAuth in this project) — each option either hands off to a
 * calendar provider's own "add event" web link, pre-filled from this opportunity, or
 * downloads a plain .ics file the OS's own calendar app opens. onPicked only records that
 * a reminder was set (for the Deadlines tab); it never confirms the event actually landed
 * anywhere, since Researchly has no way to know that without a real integration.
 */
export default function CalendarPickerModal({ o, pageUrl, onClose, onPicked }) {
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

  function pick(id) {
    if (id === 'google') {
      const url = buildGoogleCalendarUrl(o, pageUrl)
      if (url) window.open(url, '_blank', 'noopener')
    } else if (id === 'outlook') {
      const url = buildOutlookWebUrl(o, pageUrl)
      if (url) window.open(url, '_blank', 'noopener')
    } else {
      downloadIcs(o, pageUrl)
    }
    onPicked(id)
  }

  return (
    <div className="cal-picker-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cal-picker-card" role="dialog" aria-modal="true" aria-labelledby="cal-picker-title">
        <button type="button" className="cal-picker-close" onClick={onClose} aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="cal-picker-title" className="cal-picker-title">Add deadline reminder</h2>
        <p className="cal-picker-sub">{o.name} — deadline {formatDeadlineLong(o.deadline)}</p>

        <div className="cal-picker-options">
          {OPTIONS.map((opt) => (
            <button key={opt.id} type="button" className="cal-picker-option" onClick={() => pick(opt.id)}>
              <span className="cal-picker-option-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                  <use href={`#${opt.icon}`} />
                </svg>
              </span>
              <span className="cal-picker-option-text">
                <span className="cal-picker-option-label">{opt.label}</span>
                <span className="cal-picker-option-hint">{opt.hint}</span>
              </span>
              <svg className="cal-picker-option-chevron" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#icon-chevron-down" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
