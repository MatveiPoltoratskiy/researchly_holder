import { useState } from 'react'
import { supabase } from '../lib/supabase'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = { name: '', email: '', subject: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

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

    setStatus('error')
    setErrorMsg('Something went wrong. Please try again.')
  }

  const isSubmitting = status === 'submitting'

  return (
    <section className="contact-section container">
      <div className="contact-head">
        <p className="kicker">Get in touch</p>
        <h1>Questions? We're here.</h1>
        <p className="sub contact-sub">Reach out anytime — we read every message.</p>
      </div>

      <div className="contact-card">
        {status === 'success' ? (
          <div className="contact-success">
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check" /></svg>
            <div>
              <p className="contact-success-title">Message sent!</p>
              <p className="contact-success-sub">Thanks for reaching out — we'll get back to you soon.</p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </section>
  )
}
