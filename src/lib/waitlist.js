export function focusWaitlistInput() {
  const input = document.getElementById('waitlist-email')
  if (input) {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input.focus({ preventScroll: true })
  }
  return Boolean(input)
}

// Scrolls to the waitlist form if one is already on the current page (home, or the
// standalone how-it-works route each have their own); otherwise navigates home first,
// where the real form always lives, then focuses it once the page has rendered.
export function goToWaitlist(navigate) {
  if (focusWaitlistInput()) return
  navigate('/')
  setTimeout(focusWaitlistInput, 60)
}
