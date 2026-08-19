import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'

const HOW_IT_WORKS_STEPS = [
  { icon: 'chat', title: '1. Interview', sub: 'Tell us about you' },
  { icon: 'search', title: '2. Match', sub: 'We find the best opportunities' },
  { icon: 'map', title: '3. Roadmap', sub: 'Your step-by-step plan' },
  { icon: 'rocket', title: '4. Apply', sub: 'Get deadlines, links, and guidance' },
]

const FAQS = [
  {
    q: 'How does it work?',
    a: "We start with a quick interview about your interests and goals. Researchly then matches you with the best research opportunities, internships, and programs. Finally, we build a personalized roadmap so you know exactly what to do next.",
    steps: HOW_IT_WORKS_STEPS,
  },
  {
    q: 'What kinds of opportunities will I find?',
    a: 'Research opportunities may include:',
    list: [
      'University research labs',
      'Summer research programs',
      'Research internships',
      'Paid internships',
      'Virtual research programs',
      'Nonprofit and humanitarian research',
      'STEM, humanities, social science, and interdisciplinary opportunities',
    ],
  },
  {
    q: 'Is Researchly free?',
    a: "The waitlist is completely free. Pricing for the full platform hasn't been announced yet.",
  },
  {
    q: 'When can I start?',
    a: "Researchly is in early access. Join the waitlist and we'll reach out as spots open. We're building it for students, and we'll share the details on access as we get closer.",
  },
  {
    q: "Does Researchly guarantee I'll get accepted?",
    a: 'No. Researchly helps you discover and prioritize opportunities that fit your profile, but admissions and hiring decisions are made by each organization.',
  },
  {
    q: "Can I use Researchly if I don't want to go into medicine?",
    a: 'Absolutely. Researchly supports opportunities across STEM, social sciences, humanities, business, engineering, psychology, AI, law, public policy, and more.',
  },
  {
    q: 'How is Researchly different from Google?',
    a: 'Google gives you thousands of links. Researchly does those searches for you, then simplifies and boils down the most optimal options for you.',
  },
]

function FaqItem({ index, q, a, list, steps, isOpen, onToggle, revealDelay }) {
  const panelId = `faq-panel-${index}`

  return (
    <div className="faq-item-reveal" style={{ transitionDelay: revealDelay }}>
      <div className={`faq-item${isOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="faq-row"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="faq-tag">{String(index + 1).padStart(2, '0')}</span>
          <span className="faq-q">{q}</span>
          <svg className="faq-toggle" width="16" height="16" aria-hidden="true"><use href="#icon-chevron-down" /></svg>
        </button>
        <div className="faq-panel-wrap" id={panelId} role="region" aria-hidden={!isOpen}>
          <div className="faq-panel">
            <p className="faq-a">{a}</p>
            {list && (
              <ul className="faq-list">
                {list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {steps && (
              <div className="faq-steps">
                {steps.map((step, si) => (
                  <div className="faq-step" key={step.title}>
                    {si > 0 && <span className="faq-step-connector" aria-hidden="true" />}
                    <span className="faq-step-badge">
                      <svg width="22" height="22" aria-hidden="true"><use href={`#icon-${step.icon}`} /></svg>
                    </span>
                    <p className="faq-step-title">{step.title}</p>
                    <p className="faq-step-sub">{step.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const sectionRef = useRef(null)
  const maxSectionHeightRef = useRef(0)

  usePauseAnimationsOffscreen(sectionRef)

  // .faq-intro is sticky within .faq-section, so when an open accordion item collapses and
  // .faq-list-col shrinks, the section (and the sticky intro's travel range) would shrink
  // with it — pushing the intro column up and, via the browser's scroll-anchoring, making
  // the list column appear to jump down. Floor the section's own height at the tallest it's
  // ever been so it only grows, never shrinks, and closing an item can't trigger that jump.
  // Watches the section itself (not just the list column) since min-height needs to cover
  // whichever column — intro or list — is actually tallest, padding included.
  useEffect(() => {
    const sectionEl = sectionRef.current
    if (!sectionEl || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      if (height > maxSectionHeightRef.current) {
        maxSectionHeightRef.current = height
        sectionEl.style.minHeight = `${height}px`
      }
    })
    observer.observe(sectionEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (prefersReducedMotion()) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: '0px 0px -5% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={`faq-section container${revealed ? ' is-revealed' : ''}`} id="faq" ref={sectionRef}>
      <div className="faq-intro faq-reveal">
        <p className="kicker faq-kicker">
          Questions, answered
          <svg className="faq-kicker-mark" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M7 0 L8.4 5.6 14 7 8.4 8.4 7 14 5.6 8.4 0 7 5.6 5.6Z" fill="currentColor" />
          </svg>
        </p>
        <h2 className="faq-heading">Everything you need to know before you start.</h2>
        <span className="faq-heading-underline" aria-hidden="true" />
        <p className="faq-sub">The questions we get asked the most, answered.</p>

        <div className="faq-mascot-wrap" aria-hidden="true">
          <span className="faq-mascot-backdrop" />
          <div className="faq-mascot-figure">
            <img className="faq-mascot" src="/assets/mascot-logo.png" alt="" />
            <svg className="faq-mascot-glass" viewBox="0 0 40 40">
              <circle cx="16" cy="16" r="11" fill="var(--glass-lens)" stroke="var(--glass-rim)" strokeWidth="2.5" />
              <path d="M24.5,24.5 L35,35" stroke="var(--glass-rim-dark)" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="faq-mascot-shadow" />
        </div>
      </div>

      <div className="faq-list-col">
        {FAQS.map((item, i) => (
          <FaqItem
            key={item.q}
            index={i}
            {...item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            revealDelay={`${80 + i * 70}ms`}
          />
        ))}
      </div>
    </section>
  )
}
