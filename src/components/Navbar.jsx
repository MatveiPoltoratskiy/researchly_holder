import { Link, useRouter } from '../lib/router'
import { useDevAccess } from '../lib/devAccessContext'

export default function Navbar() {
  const { path, navigate } = useRouter()
  const { unlocked } = useDevAccess()

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
            Contact
          </Link>
          {/* the directory/email-drafting behind this isn't built yet, so the link itself
              stays inert until the footer's passphrase prompt unlocks it (see
              lib/devAccessContext.jsx) — same gate as /opportunities, just enforced here
              too so it doesn't read as a live, clickable nav item to a random visitor */}
          {unlocked ? (
            <Link className="nav-link" to="/professor-finder">
              Professor Finder
            </Link>
          ) : (
            <span className="nav-link nav-link--locked" aria-disabled="true" title="Coming soon">
              Professor Finder
            </span>
          )}
          <Link className="nav-cta" to="/interview">
            Get your Opportunities
          </Link>
        </div>
      </div>
    </div>
  )
}
