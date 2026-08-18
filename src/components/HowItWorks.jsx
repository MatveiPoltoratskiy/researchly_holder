import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'
import { useRouter } from '../lib/router'
import { goToWaitlist } from '../lib/waitlist'
import SymbolField from './SymbolField'
import { InterviewVisual, MatchVisual, RoadmapVisual, ApplyVisual } from './HowItWorksVisuals'

const STEPS = [
  {
    kicker: 'THE INTERVIEW',
    title: "Five questions. That's the whole setup.",
    desc: "We ask what you're into, what year you're in, where you are, when you're free, and whether pay matters. Each answer narrows the field. No long forms, no essays.",
    meta: 'Interest → Level → Location → Timing → Pay',
    mascot: 'mascot-ask',
    Visual: InterviewVisual,
  },
  {
    kicker: 'THE MATCH',
    title: "We do the searching, so you don't open 40 tabs.",
    desc: "Instead of thousands of links, you get a short list of research programs, labs, and internships you're actually eligible for. It's filtered by your grade, your area, and your schedule.",
    meta: 'Summer · Year-round · Paid · Remote',
    mascot: 'mascot-scout',
    Visual: MatchVisual,
  },
  {
    kicker: 'YOUR ROADMAP',
    title: 'A plan, not just a list.',
    desc: "Every match comes with an order to follow: what to prep, when applications open, and which deadline hits next. You always know your next step.",
    meta: 'Deadlines and next steps, in order',
    mascot: 'mascot-map',
    Visual: RoadmapVisual,
  },
  {
    kicker: 'THE APPLY',
    title: 'Then the part that actually counts.',
    desc: "Work down the roadmap with deadlines, links, and guidance in one place. We can't get you accepted, but you'll never miss an opportunity because you didn't know it existed.",
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
      <div className="how-copy">
        <div className="how-copy-top">
          <span className="how-node">{String(index + 1).padStart(2, '0')}</span>
          <p className="how-kicker">{step.kicker}</p>
        </div>
        <h3 className="how-title">{step.title}</h3>
        <p className="how-desc">{step.desc}</p>
        <p className="how-meta">{step.meta}</p>
      </div>
      <div className="how-spine-mascot">
        <svg
          className="how-mascot"
          width="88" height="88" viewBox="0 0 72 72" aria-hidden="true"
          style={{ '--bob-delay': `${index * 0.4}s` }}
        >
          <use href={`#${step.mascot}`} />
        </svg>
      </div>
      <div className="how-visual">
        <Visual />
      </div>
    </li>
  )
}

function HowLandscape() {
  const { navigate } = useRouter()

  return (
    <div className="how-landscape">
      <svg className="how-landscape-svg" viewBox="0 0 1400 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <polygon points="0,340 0,170 120,115 240,155 360,90 480,145 600,80 720,135 840,75 960,130 1080,90 1200,145 1320,110 1400,135 1400,340" fill="var(--sage-back)" />
        <polygon points="0,340 0,220 140,182 280,212 420,165 560,202 700,155 840,198 980,160 1120,205 1260,175 1400,212 1400,340" fill="var(--sage-mid)" />
        <polygon points="0,340 0,268 160,250 320,272 480,242 640,270 800,238 960,268 1120,242 1280,272 1400,250 1400,340" fill="var(--sage-front)" />

        <use href="#scene-trees" x="80" y="150" width="46" height="64" />
        <use href="#scene-trees" x="250" y="178" width="40" height="56" />
        <use href="#scene-trees" x="1110" y="168" width="44" height="60" />
        <use href="#scene-trees" x="1290" y="192" width="38" height="52" />

        <g transform="translate(658,148)">
          <rect x="10" y="42" width="60" height="58" fill="#EDE0C2" />
          <rect x="0" y="24" width="24" height="76" fill="#EDE0C2" />
          <rect x="56" y="24" width="24" height="76" fill="#EDE0C2" />
          <polygon points="0,24 12,4 24,24" fill="var(--cover-dark)" />
          <polygon points="56,24 68,4 80,24" fill="var(--cover-dark)" />
          <rect x="34" y="56" width="12" height="44" fill="var(--spine)" />
          <polygon points="30,56 40,36 50,56" fill="var(--cover-dark)" />
        </g>

        <path d="M690,340 C682,300 692,262 678,232" fill="none" stroke="var(--road-line)" strokeWidth="3" strokeDasharray="8 8" />
        <use href="#scene-pin" x="666" y="200" width="15" height="20" />
        <use href="#scene-pin" x="636" y="288" width="19" height="25" />
      </svg>

      <div className="how-landscape-cta">
        <p>Ready to find your path?</p>
        <button type="button" className="cta-btn" onClick={() => goToWaitlist(navigate)}>
          Join the waitlist
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <use href="#icon-arrow" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const sectionRef = useRef(null)
  usePauseAnimationsOffscreen(sectionRef)

  return (
    <section className="how-section container" id="how-it-works" ref={sectionRef}>
      <div className="how-symbol-field" aria-hidden="true">
        <SymbolField
          rows={3} cols={8}
          opacityRange={[0.22, 0.32]}
          fontSizeRange={[16, 24]}
          colors={['var(--symbol-tan)', 'var(--cover-dark)', 'var(--ribbon)', 'var(--navy)', '#5C3A1E', 'var(--gold)']}
        />
      </div>

      <div className="how-head">
        <p className="kicker">How it works</p>
        <h2 className="how-heading">
          Four steps, and you'll know exactly <span className="squiggle-underline">where to start</span>.
        </h2>
        <p className="sub how-sub">
          Researchly asks a handful of questions, then does the digging for you. It matches you to real research
          opportunities and lays out what to do next. Here's the whole thing, start to finish.
        </p>
      </div>

      <ol className="how-trail">
        {STEPS.map((step, i) => (
          <StepRow step={step} index={i} key={step.title} />
        ))}
      </ol>

      <HowLandscape />
    </section>
  )
}
