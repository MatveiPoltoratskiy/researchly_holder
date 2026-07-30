export default function Navbar() {
  function handleClick() {
    const input = document.getElementById('waitlist-email')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input.focus({ preventScroll: true })
    }
  }

  return (
    <div className="site-nav container">
      <a className="brand" href="/" aria-label="Researchly home">
        <img src="/assets/mascot-logo.png" alt="Researchly" />
        <span>Researchly</span>
      </a>
      <button className="nav-cta" type="button" onClick={handleClick}>
        Join the waitlist
      </button>
    </div>
  )
}
