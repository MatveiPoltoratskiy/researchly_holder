import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'
import Waitlist from './Waitlist'
import { InterviewVisual, MatchVisual, RoadmapVisual, ApplyVisual } from './HowItWorksVisuals'

const STEPS = [
  {
    kicker: 'THE INTERVIEW',
    title: "Five questions. That's the whole setup.",
    desc: "We ask what you're into, what year you're in, where you are, when you're free, and whether pay matters. Each answer narrows the field — no long forms, no essays.",
    meta: 'Interest → Level → Location → Timing → Pay',
    mascot: 'mascot-ask',
    Visual: InterviewVisual,
  },
  {
    kicker: 'THE MATCH',
    title: "We do the searching, so you don't open 40 tabs.",
    desc: "Instead of thousands of links, you get a short list of research programs, labs, and internships you're actually eligible for — filtered by your grade, your area, and your schedule.",
    meta: 'Summer · Year-round · Paid · Remote',
    mascot: 'mascot-scout',
    Visual: MatchVisual,
  },
  {
    kicker: 'YOUR ROADMAP',
    title: 'A plan, not just a list.',
    desc: 'Every match comes with the order to do things in: what to prepare, when applications open, and which deadline is coming next. You always know your next step.',
    meta: 'Deadlines and next steps, in order',
    mascot: 'mascot-map',
    Visual: RoadmapVisual,
  },
  {
    kicker: 'THE APPLY',
    title: 'Then the part that actually counts.',
    desc: "Work down the roadmap with deadlines, links, and guidance in one place. We can't get you accepted — but you'll never miss an opportunity because you didn't know it existed.",
    meta: 'Links, dates, and guidance in one place',
    mascot: 'mascot-cheer',
    Visual: ApplyVisual,
  },
]

function StepRow({ step, index }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Visual = step.Visual

  return (
    <li className={`how-step${inView ? ' is-in' : ''}`} ref={ref}>
      <span className="how-node">{String(index + 1).padStart(2, '0')}</span>
      <div className="how-copy">
        <svg className="how-mascot" width="60" height="60" viewBox="0 0 72 72" aria-hidden="true">
          <use href={`#${step.mascot}`} />
        </svg>
        <p className="how-kicker">{step.kicker}</p>
        <h3 className="how-title">{step.title}</h3>
        <p className="how-desc">{step.desc}</p>
        <p className="how-meta">{step.meta}</p>
      </div>
      <div className="how-visual">
        <Visual />
      </div>
    </li>
  )
}

export default function HowItWorks() {
  return (
    <section className="how-section container">
      <div className="how-head">
        <p className="kicker">How it works</p>
        <h1>
          Four steps, and you'll know exactly <span className="squiggle-underline">where to start</span>.
        </h1>
        <p className="sub how-sub">
          Researchly asks a handful of questions, then does the digging for you — matching you to real research
          opportunities and laying out what to do next. Here's the whole thing, start to finish.
        </p>
      </div>

      <ol className="how-trail">
        {STEPS.map((step, i) => (
          <StepRow step={step} index={i} key={step.title} />
        ))}
      </ol>

      <div className="how-cta">
        <svg className="how-cta-mascot" viewBox="0 0 60 60" aria-hidden="true">
          <use href="#mascot-tiny" />
        </svg>
        <h2>Researchly isn't open yet.</h2>
        <p className="sub">We're building it now. Join the waitlist and we'll reach out as spots open.</p>
        <Waitlist />
      </div>
    </section>
  )
}
