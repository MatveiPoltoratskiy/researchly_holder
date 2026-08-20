import { useState } from 'react'
import { Link, useRouter } from '../lib/router'
import { supabase } from '../lib/supabase'
import { isDevUnlocked, tryUnlock } from '../lib/devAccess'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Scrolls to a homepage section id, navigating home first if we're on another route —
// same pattern Navbar uses for its "How it works" link.
function scrollToSection(id, path, navigate) {
  return (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (path === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/')
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
}

export default function Footer() {
  const { path, navigate } = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [message, setMessage] = useState('')

  // not a real security gate (see lib/devAccess.js) — just keeps the in-progress
  // prototype routes from being stumbled on before launch, so a cofounder can test
  // without it being publicly linked yet
  const [devPromptOpen, setDevPromptOpen] = useState(false)
  const [devPassInput, setDevPassInput] = useState('')
  const [devUnlocked, setDevUnlocked] = useState(() => isDevUnlocked())
  const [devError, setDevError] = useState(false)

  function handleDevSubmit(e) {
    e.preventDefault()
    if (tryUnlock(devPassInput)) {
      setDevUnlocked(true)
      setDevPromptOpen(false)
      setDevPassInput('')
      setDevError(false)
    } else {
      setDevError(true)
    }
  }

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
      setMessage("You're on the list.")
      setEmail('')
      return
    }
    if (error.code === '23505') {
      setStatus('success')
      setMessage("You're already on the list.")
      setEmail('')
      return
    }
    setStatus('error')
    setMessage('Something went wrong. Please try again.')
  }

  const isSubmitting = status === 'submitting'

  return (
    <footer className="site-footer">
      <div className="footer-card">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="footer-brand-mark" to="/" aria-label="Researchly home">
              <img src="/assets/mascot-logo.png" alt="" />
              <span>Researchly</span>
            </Link>
            <p className="footer-tagline">Your roadmap to research opportunities.</p>
          </div>

          <nav className="footer-col" aria-label="Product">
            <p className="footer-col-title">Product</p>
            <a className="footer-link" href="/how-it-works" onClick={scrollToSection('how-it-works', path, navigate)}>
              How it works
            </a>
            <span className="footer-link footer-link--static">For Schools</span>
          </nav>

          <nav className="footer-col" aria-label="Company">
            <p className="footer-col-title">Company</p>
            <span className="footer-link footer-link--static">About us</span>
          </nav>

          <nav className="footer-col" aria-label="Resources">
            <p className="footer-col-title">Resources</p>
            <a className="footer-link" href="/#faq" onClick={scrollToSection('faq', path, navigate)}>
              FAQ
            </a>
          </nav>

          <div className="footer-newsletter">
            <p className="footer-col-title footer-col-title--accent">Stay in the loop</p>
            <p className="footer-newsletter-copy">Join the waitlist and be the first to know when we launch.</p>

            {status === 'success' ? (
              <p className="footer-newsletter-success">{message}</p>
            ) : (
              <form className="footer-email-form" onSubmit={handleSubmit} noValidate>
                <svg className="footer-email-icon" width="18" height="18" aria-hidden="true"><use href="#icon-mail" /></svg>
                <label htmlFor="footer-email" className="visually-hidden">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status === 'error') { setStatus('idle'); setMessage('') }
                  }}
                  disabled={isSubmitting}
                  aria-invalid={status === 'error'}
                  required
                />
                <button className="footer-email-submit" type="submit" disabled={isSubmitting} aria-label="Join the waitlist">
                  {isSubmitting ? (
                    <svg className="btn-spinner" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="34 100" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" aria-hidden="true"><use href="#icon-arrow" /></svg>
                  )}
                </button>
              </form>
            )}

            {status === 'error' && (
              <p className="footer-newsletter-error" role="alert">{message}</p>
            )}
            {status !== 'success' && (
              <p className="footer-newsletter-note">
                <svg width="12" height="12" aria-hidden="true"><use href="#icon-lock" /></svg>
                No spam. Ever. Unsubscribe anytime.
              </p>
            )}
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Researchly. All rights reserved.
            {' '}
            <button
              type="button"
              className="footer-dev-dot"
              aria-label="."
              tabIndex={-1}
              onClick={() => setDevPromptOpen((v) => !v)}
            />
          </p>
          <div className="footer-legal">
            <span className="footer-link footer-link--static">Privacy Policy</span>
            <span className="footer-link footer-link--static">Terms of Service</span>
            <span className="footer-legal-divider" aria-hidden="true" />
            <span className="footer-social" aria-hidden="true">
              <svg width="18" height="18"><use href="#icon-instagram" /></svg>
            </span>
            <span className="footer-social" aria-hidden="true">
              <svg width="18" height="18"><use href="#icon-linkedin" /></svg>
            </span>
          </div>
        </div>

        {devPromptOpen && !devUnlocked && (
          <form className="footer-dev-prompt" onSubmit={handleDevSubmit}>
            <input
              type="password"
              className="footer-dev-input"
              placeholder="Passphrase"
              value={devPassInput}
              onChange={(e) => { setDevPassInput(e.target.value); setDevError(false) }}
              autoFocus
              aria-invalid={devError}
            />
            <button type="submit" className="footer-dev-submit">Unlock</button>
            {devError && <span className="footer-dev-error">Not it.</span>}
          </form>
        )}
        {devUnlocked && (
          <p className="footer-dev-links">
            <Link to="/interview">Interview</Link>
            <Link to="/opportunities">Opportunities</Link>
          </p>
        )}
      </div>
    </footer>
  )
}
