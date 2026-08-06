import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'
import SymbolField from './SymbolField'

const HOW_IT_WORKS_STEPS = [
  { icon: 'chat', title: '1. Interview', sub: 'Tell us about you' },
  { icon: 'search', title: '2. Match', sub: 'We find the best opportunities' },
  { icon: 'map', title: '3. Roadmap', sub: 'Your step-by-step plan' },
  { icon: 'rocket', title: '4. Apply', sub: 'Get deadlines, links, and guidance' },
]

const FAQS = [
  {
    q: 'How does it work?',
    icon: 'book',
    a: "We start with a quick interview about your interests and goals. Researchly then matches you with the best research opportunities, internships, and programs. Finally, we build a personalized roadmap so you know exactly what to do next.",
    steps: HOW_IT_WORKS_STEPS,
  },
  {
    q: 'What kinds of opportunities will I find?',
    icon: 'grad-cap',
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
    icon: 'dollar',
    a: "The waitlist is completely free. Pricing for the full platform hasn't been announced yet.",
  },
  {
    q: 'When will it launch?',
    icon: 'rocket',
    a: "We're currently building Researchly. Join the waitlist to be among the first to receive updates and early access announcements.",
  },
  {
    q: "Does Researchly guarantee I'll get accepted?",
    icon: 'badge-check',
    a: 'No. Researchly helps you discover and prioritize opportunities that fit your profile, but admissions and hiring decisions are made by each organization.',
  },
  {
    q: "Can I use Researchly if I don't want to go into medicine?",
    icon: 'stethoscope',
    a: 'Absolutely. Researchly supports opportunities across STEM, social sciences, humanities, business, engineering, psychology, AI, law, public policy, and more.',
  },
  {
    q: 'How is Researchly different from Google?',
    icon: 'search',
    a: 'Google gives you thousands of links. Researchly does those searches for you, then simplifies and boils down the most optimal options for you.',
  },
]

function FaqItem({ index, q, a, list, icon, steps, isOpen, onToggle, revealDelay }) {
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
          <svg className="faq-topic-icon" width="20" height="20" aria-hidden="true"><use href={`#icon-${icon}`} /></svg>
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
      <div className="faq-symbol-field" aria-hidden="true">
        <SymbolField
          rows={6} cols={22}
          opacityRange={[0.32, 0.44]}
          fontSizeRange={[18, 27]}
          colors={['var(--symbol-tan)', 'var(--cover-dark)', 'var(--ribbon)', 'var(--navy)', '#5C3A1E', 'var(--gold)']}
        />
      </div>

      <div className="faq-intro faq-reveal">
        <p className="kicker">Questions, answered</p>
        <h2 className="faq-heading">Everything you need to know before you start.</h2>
        <span className="faq-heading-underline" aria-hidden="true" />
        <p className="faq-sub">Quick answers to the most common questions about Researchly.</p>

        <div className="faq-tip">
          <span className="faq-tip-pin" aria-hidden="true" />
          <p className="faq-tip-label">✳ Tip</p>
          <p className="faq-tip-text">
            Most students don't know where to start.
            <br />
            Start with <strong>Question 1</strong>.
          </p>
        </div>

        <img className="faq-mascot" src="/assets/mascot-logo.png" alt="Researchly mascot" />
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
