import { Link, useRouter } from '../lib/router'
import { goToWaitlist } from '../lib/waitlist'

export default function Navbar() {
  const { path, navigate } = useRouter()

  function handleJoinClick() {
    goToWaitlist(navigate)
  }

  // "How it works" now lives as a section on the homepage — scroll to it directly when
  // already there, otherwise navigate home first and land on it once rendered. Can't use
  // the shared <Link>, which always navigates before this handler runs.
  function handleHowItWorksClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (path === '/') {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/')
    setTimeout(() => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <div className="site-nav-bar">
      <div className="site-nav container">
        <Link className="brand" to="/" aria-label="Researchly home">
          <img src="/assets/mascot-logo.png" alt="Researchly" />
          <span>Researchly</span>
        </Link>
        <div className="nav-right">
          <a className="nav-link" href="/how-it-works" onClick={handleHowItWorksClick}>
            How it works
          </a>
          <Link className="nav-link" to="/contact">
            Contact us
          </Link>
          {/* dev links to the private prototypes moved to a gated entry point in the
              footer (see devAccess.js) — no longer shown here unconditionally */}
          <button className="nav-cta" type="button" onClick={handleJoinClick}>
            Join the waitlist
          </button>
        </div>
      </div>
    </div>
  )
}
