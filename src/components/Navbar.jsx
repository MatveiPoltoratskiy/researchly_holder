import { burstConfetti } from '../lib/confetti'

export default function Navbar() {
  function handleClick(e) {
    burstConfetti(e.currentTarget, 16)
    const input = document.getElementById('waitlist-email')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input.focus({ preventScroll: true })
    }
  }

  function handleMouseEnter(e) {
    burstConfetti(e.currentTarget, 5)
  }

  return (
    <div className="site-nav container">
      <div className="brand">
        <img src="/assets/mascot-logo.png" alt="Researchly" />
        <span>Researchly</span>
      </div>
      <button
        className="nav-cta"
        type="button"
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        Join the waitlist
      </button>
    </div>
  )
}
