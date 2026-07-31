import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const FAQS = [
  {
    q: 'How does it work?',
    a: "You'll answer a few questions about your interests, goals, and experience. Researchly then builds a personalized roadmap and recommends opportunities that match you.",
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
    q: 'When will it launch?',
    a: "We're currently building Researchly. Join the waitlist to be among the first to receive updates and early access announcements.",
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

function FaqItem({ index, q, a, list, isOpen, onToggle, revealDelay }) {
  const panelId = `faq-panel-${index}`
  const panelRef = useRef(null)
  const [maxHeight, setMaxHeight] = useState(0)

  useLayoutEffect(() => {
    const el = panelRef.current
    if (!el) return
    setMaxHeight(isOpen ? el.scrollHeight : 0)
  }, [isOpen])

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
          <span className="faq-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="faq-q">{q}</span>
          <span className="faq-toggle" aria-hidden="true">
            <svg width="16" height="16"><use href="#icon-plusminus" /></svg>
          </span>
        </button>
        <div
          className="faq-panel"
          id={panelId}
          role="region"
          aria-hidden={!isOpen}
          style={{ maxHeight }}
        >
          <p className="faq-a">{a}</p>
          {list && (
            <ul className="faq-list">
              {list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(-1)
  const [revealed, setRevealed] = useState(false)
  const sectionRef = useRef(null)

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
    <section className={`faq-section container${revealed ? ' is-revealed' : ''}`} ref={sectionRef}>
      <div className="faq-intro faq-reveal">
        <p className="kicker">Questions, answered</p>
        <h2 className="faq-heading">Everything you need to know before you start.</h2>
        <p className="faq-sub">How the interview, matches, and roadmap fit together.</p>
        <div className="faq-hint">
          <span className="faq-hint-bubble">Pick a question to get started.</span>
          <svg className="faq-hint-mascot" viewBox="0 0 60 60" aria-hidden="true"><use href="#mascot-tiny" /></svg>
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
