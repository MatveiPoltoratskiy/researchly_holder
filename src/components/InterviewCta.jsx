import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from '../lib/router'
import InterviewModeModal from './InterviewModeModal'

// Drop-in replacement for `<Link to="/interview">` — same visual result (an <a>
// pointing at /interview, so it degrades sensibly with JS disabled or a middle-click),
// but a real click opens the mode-picker modal instead of navigating straight there.
// Portaled to document.body rather than rendered in place, so it always sits above
// whatever stacking context each of the three call sites (Navbar, Hero, HowItWorks)
// happens to have, without needing to reason about each one individually.
export default function InterviewCta({ className, children }) {
  const { navigate } = useRouter()
  const [open, setOpen] = useState(false)

  function handleClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    setOpen(true)
  }

  return (
    <>
      <a href="/interview" className={className} onClick={handleClick}>
        {children}
      </a>
      {open &&
        createPortal(
          <InterviewModeModal
            onClose={() => setOpen(false)}
            onPickVoice={() => navigate('/interview-voice')}
            onPickGuided={() => navigate('/interview')}
          />,
          document.body
        )}
    </>
  )
}
