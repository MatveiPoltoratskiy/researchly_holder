import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { burstConfetti } from '../lib/confetti'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [message, setMessage] = useState('')
  // honeypot: real visitors never see or fill this field (off-screen, aria-hidden,
  // excluded from tab order); a bot that blindly fills every input does. A non-empty
  // value means "skip the insert, but pretend it worked" so the bot doesn't learn to
  // adapt.
  const [hp, setHp] = useState('')
  const buttonRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return

    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    if (hp.trim()) {
      setStatus('success')
      setMessage("You're on the list. We'll reach out as spots open.")
      setEmail('')
      return
    }

    if (!supabase) {
      setStatus('error')
      setMessage('Something went wrong. Please try again later.')
      return
    }

    setStatus('submitting')
    setMessage('')

    const { error } = await supabase.from('waitlist').insert({ email: trimmed })

    if (!error) {
      setStatus('success')
      setMessage("You're on the list. We'll reach out as spots open.")
      setEmail('')
      if (buttonRef.current) burstConfetti(buttonRef.current, 16)
      return
    }

    if (error.code === '23505') {
      setStatus('success')
      setMessage("You're already on the list. We'll reach out as spots open.")
      setEmail('')
      return
    }

    setStatus('error')
    setMessage('Something went wrong. Please try again.')
  }

  const isSubmitting = status === 'submitting'

  if (status === 'success') {
    return (
      <div className="cta-wrap">
        <div className="waitlist-success" role="status" aria-live="polite">
          <svg className="waitlist-success-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="cta-wrap">
      <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
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
        <label htmlFor="waitlist-email" className="visually-hidden">Email address</label>
        <input
          id="waitlist-email"
          className="waitlist-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') { setStatus('idle'); setMessage('') }
          }}
          disabled={isSubmitting}
          aria-invalid={status === 'error'}
          aria-describedby="waitlist-status"
          required
        />
        <button
          ref={buttonRef}
          className="waitlist-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <svg className="btn-spinner" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="34 100" />
            </svg>
          ) : (
            'Join the waitlist →'
          )}
        </button>
      </form>

      <p
        id="waitlist-status"
        className={`waitlist-status ${status === 'error' ? 'is-error' : 'is-trust'}`}
        role={status === 'error' ? 'alert' : undefined}
        aria-live="polite"
      >
        {status === 'idle' || status === 'submitting' ? (
          <span className="waitlist-count">
            <span className="waitlist-count-dot" aria-hidden="true" />
            50+ people have already joined the waitlist
          </span>
        ) : (
          message
        )}
      </p>
    </div>
  )
}
