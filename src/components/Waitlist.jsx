import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { burstConfetti } from '../lib/confetti'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [message, setMessage] = useState('')
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
      setMessage("You're on the list! We'll email you when spots open.")
      setEmail('')
      if (buttonRef.current) burstConfetti(buttonRef.current, 16)
      return
    }

    if (error.code === '23505') {
      setStatus('success')
      setMessage("You're already on the list — we'll be in touch.")
      setEmail('')
      return
    }

    setStatus('error')
    setMessage('Something went wrong. Please try again.')
  }

  const isSubmitting = status === 'submitting'

  return (
    <div className="cta-wrap">
      <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
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
          onMouseEnter={(e) => burstConfetti(e.currentTarget, 5)}
        >
          {isSubmitting ? 'Joining…' : 'Join the waitlist →'}
        </button>
      </form>

      <p
        id="waitlist-status"
        className={`waitlist-status ${status === 'success' ? 'is-success' : status === 'error' ? 'is-error' : 'is-trust'}`}
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
