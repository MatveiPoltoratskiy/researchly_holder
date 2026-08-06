import { Link, useRouter } from '../lib/router'

export default function Navbar() {
  const { navigate } = useRouter()

  function focusWaitlistInput() {
    const input = document.getElementById('waitlist-email')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input.focus({ preventScroll: true })
    }
  }

  function handleJoinClick() {
    // some pages (home, how-it-works) have their own waitlist form; use it if present
    // instead of always bouncing to "/", which would ignore a form already on screen
    if (document.getElementById('waitlist-email')) {
      focusWaitlistInput()
      return
    }
    navigate('/')
    setTimeout(focusWaitlistInput, 60)
  }

  return (
    <div className="site-nav container">
      <Link className="brand" to="/" aria-label="Researchly home">
        <img src="/assets/mascot-logo.png" alt="Researchly" />
        <span>Researchly</span>
      </Link>
      <div className="nav-right">
        <Link className="nav-link" to="/how-it-works">
          How it works
        </Link>
        <Link className="nav-link" to="/contact">
          Contact
        </Link>
        <button className="nav-cta" type="button" onClick={handleJoinClick}>
          Join the waitlist
        </button>
      </div>
    </div>
  )
}
