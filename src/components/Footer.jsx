import { useEffect, useState } from 'react'
import { Link, useRouter } from '../lib/router'
import { verifyDevAccess, unlockDevAccess } from '../lib/devAccess'

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

  // real server-verified access (see lib/devAccess.js) — keeps the in-progress
  // prototype routes off the public internet before launch, so a cofounder can test
  // without them being publicly linked yet
  const [devPromptOpen, setDevPromptOpen] = useState(false)
  const [devPassInput, setDevPassInput] = useState('')
  const [devUnlocked, setDevUnlocked] = useState(false)
  const [devSubmitting, setDevSubmitting] = useState(false)
  const [devError, setDevError] = useState(false)

  useEffect(() => {
    let cancelled = false
    verifyDevAccess().then((ok) => {
      if (!cancelled) setDevUnlocked(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDevSubmit(e) {
    e.preventDefault()
    if (devSubmitting) return
    setDevSubmitting(true)
    const ok = await unlockDevAccess(devPassInput)
    setDevSubmitting(false)
    if (ok) {
      setDevUnlocked(true)
      setDevPromptOpen(false)
      setDevPassInput('')
      setDevError(false)
    } else {
      setDevError(true)
    }
  }

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
            <button type="submit" className="footer-dev-submit" disabled={devSubmitting}>
              {devSubmitting ? '...' : 'Unlock'}
            </button>
            {devError && <span className="footer-dev-error">Not it.</span>}
          </form>
        )}
        {devUnlocked && (
          <p className="footer-dev-links">
            <Link to="/interview">Interview</Link>
            <Link to="/opportunities">Opportunities</Link>
            <Link to="/professor-finder">Professor Finder</Link>
          </p>
        )}
      </div>
    </footer>
  )
}
