import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { burstConfetti } from '../lib/confetti'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = { name: '', email: '', subject: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const badgeRef = useRef(null)

  useEffect(() => {
    if (status === 'success' && badgeRef.current) {
      burstConfetti(badgeRef.current, 22)
    }
  }, [status])

  function updateField(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      if (status === 'error') { setStatus('idle'); setErrorMsg('') }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (status === 'submitting') return

    const name = form.name.trim()
    const email = form.email.trim()
    const subject = form.subject.trim()
    const message = form.message.trim()

    if (!name || !subject || !message) {
      setStatus('error')
      setErrorMsg('Please fill out every field.')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setStatus('error')
      setErrorMsg('Enter a valid email address.')
      return
    }

    if (!supabase) {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again later.')
      return
    }

    setStatus('submitting')
    setErrorMsg('')

    const { error } = await supabase.from('contact_messages').insert({ name, email, subject, message })

    if (!error) {
      setStatus('success')
      setForm(initialForm)
      return
    }

    console.error('contact_messages insert error:', error)
    setStatus('error')
    setErrorMsg('Something went wrong. Please try again.')
  }

  const isSubmitting = status === 'submitting'

  return (
    <section className="contact-section container">
      <div className="contact-head">
        <p className="kicker">Get in touch</p>
        <h1>Questions? We're here.</h1>
        <p className="sub contact-sub">Send us your message.</p>
      </div>

      {status === 'success' ? (
        <div className="contact-card contact-card-success" role="status" aria-live="polite">
          <div className="contact-success">
            <div className="contact-success-badge-wrap" ref={badgeRef}>
              <svg className="contact-success-badge" viewBox="0 0 80 80" aria-hidden="true">
                <circle className="contact-success-ring" cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="contact-success-check" d="M24 41l11 11 21-23" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="contact-spark contact-spark-1" aria-hidden="true" />
              <span className="contact-spark contact-spark-2" aria-hidden="true" />
              <span className="contact-spark contact-spark-3" aria-hidden="true" />
              <span className="contact-spark contact-spark-4" aria-hidden="true" />
            </div>
            <h2 className="contact-success-title">Message sent!</h2>
            <p className="contact-success-sub">We'll get back to you soon.</p>
          </div>
        </div>
      ) : (
      <div className="contact-card">
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-grid">
            <div className="contact-field">
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                className="contact-input"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={form.name}
                onChange={updateField('name')}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="contact-field">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                className="contact-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={updateField('email')}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="contact-field">
            <label htmlFor="contact-subject">Subject</label>
            <input
              id="contact-subject"
              className="contact-input"
              type="text"
              placeholder="What's this about?"
              value={form.subject}
              onChange={updateField('subject')}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Your question</label>
            <textarea
              id="contact-message"
              className="contact-input contact-textarea"
              placeholder="Ask us anything or share your thoughts…"
              rows={5}
              value={form.message}
              onChange={updateField('message')}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="contact-foot">
            <button className="waitlist-submit contact-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
            {status === 'error' && (
              <p className="waitlist-status is-error" role="alert" aria-live="polite">
                {errorMsg}
              </p>
            )}
          </div>
        </form>
      </div>
      )}
    </section>
  )
}
