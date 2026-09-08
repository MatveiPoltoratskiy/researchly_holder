import { Link, useRouter } from '../lib/router'

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
          <p className="footer-copyright">&copy; {new Date().getFullYear()} Researchly. All rights reserved.</p>
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
      </div>
    </footer>
  )
}
