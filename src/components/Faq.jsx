import { useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'What is Researchly?',
    a: "Researchly is a short, guided interview that matches high school and undergrad students with research opportunities, internships, and summer programs that fit their interests, academic level, location, and availability.",
  },
  {
    q: 'Who is this for?',
    a: 'Any high schooler or undergrad curious about research — whether you’re pre-med, into biology, chemistry, physics, neuroscience, or just not sure where to start yet.',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes. Researchly is free to join the waitlist and free to use once we launch.',
  },
  {
    q: 'When does Researchly launch?',
    a: "We're onboarding students from the waitlist in small batches. Join now and we'll reach out as spots open.",
  },
  {
    q: 'How does the matching work?',
    a: 'We ask about your focal interest, academic level, location, and availability, then match you against real research programs — no generic lists, just opportunities you actually qualify for.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="faq-section container">
      <div className="faq-head">
        <p className="kicker">FAQ</p>
        <h2>Questions, answered.</h2>
        <p className="sub faq-sub">Everything you need to know before you join the waitlist.</p>
      </div>

      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={item.q}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
                <svg className="faq-caret" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="faq-answer-wrap">
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
