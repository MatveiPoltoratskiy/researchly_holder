import { Link, useRouter } from '../lib/router'

export default function Navbar() {
  const { path, navigate } = useRouter()

  function handleJoinClick() {
    if (path !== '/') {
      navigate('/')
      setTimeout(() => {
        const input = document.getElementById('waitlist-email')
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' })
          input.focus({ preventScroll: true })
        }
      }, 60)
      return
    }
    const input = document.getElementById('waitlist-email')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input.focus({ preventScroll: true })
    }
  }

  return (
    <div className="site-nav container">
      <Link className="brand" to="/" aria-label="Researchly home">
        <img src="/assets/mascot-logo.png" alt="Researchly" />
        <span>Researchly</span>
      </Link>
      <div className="nav-right">
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
