import { useEffect } from 'react'

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Toggles an "is-offscreen" class (see index.css) on the ref'd element whenever it
// scrolls out of view, so its continuous CSS animations (bobbing, swaying, shimmer,
// etc.) pause instead of running forever in the background — only what's actually on
// screen keeps animating.
export function usePauseAnimationsOffscreen(ref, className = 'is-offscreen') {
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle(className, !entry.isIntersecting)
      },
      { rootMargin: '200px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, className])
}
