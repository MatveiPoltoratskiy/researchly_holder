import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'
import { useRouter } from '../lib/router'
import { goToWaitlist } from '../lib/waitlist'
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
  return (
    <div className="how-landscape">
      <svg className="how-landscape-svg" viewBox="0 0 1400 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {/* four irregular ridgelines, deliberately off-phase from each other so a tall back peak
            can rise through a gap in a nearer layer instead of every layer reading as a scaled
            copy of the last — that repetition is what made it look like a flat 2D wall */}
        <polygon points="0,340 0,180 30,186 60,150 80,162 140,90 200,130 250,181 330,100 400,70 480,120 552,206 620,60 700,110 792,202 870,90 950,65 1030,115 1110,170 1180,95 1290,196 1340,154 1400,175 1400,340" fill="var(--sage-back)" />
        <polygon points="0,340 0,210 90,175 170,205 260,150 340,190 430,145 510,185 600,150 680,195 760,155 840,200 920,160 1000,195 1080,150 1160,190 1240,155 1320,185 1400,205 1400,340" fill="var(--sage-mid)" />
        <polygon points="0,340 0,260 100,225 200,250 300,205 400,240 500,200 600,235 700,195 800,230 900,200 1000,238 1100,205 1200,232 1300,208 1400,240 1400,340" fill="var(--sage-front)" />
        <polygon points="0,340 0,270 150,248 300,268 450,242 600,265 750,240 900,262 1050,244 1200,264 1400,250 1400,340" fill="var(--pine)" />

        {/* dashed thread continuing the step-trail's connector line down from the top of the
            frame into the castle flag, so the trail reads as running all the way to it */}
        <line x1="698" y1="0" x2="698" y2="112" stroke="var(--cover-light)" strokeWidth="2" strokeDasharray="6 6" />

        <use href="#scene-trees" x="30" y="166" width="68" height="94" />
        <use href="#scene-trees" x="80" y="142" width="60" height="83" />
        <use href="#scene-trees" x="250" y="161" width="52" height="73" />
        <use href="#scene-trees" x="552" y="186" width="44" height="62" />
        <use href="#scene-trees" x="792" y="182" width="42" height="60" />

        {/* rounded bush cluster — a different silhouette from the pointed pine trees, breaking
            up the tree-only rhythm on the right side of the castle */}
        <g>
          <ellipse cx="962" cy="212" rx="24" ry="17" fill="var(--sage-front)" />
          <ellipse cx="990" cy="206" rx="28" ry="19" fill="var(--pine)" />
          <ellipse cx="1022" cy="214" rx="21" ry="15" fill="var(--sage-front)" />
        </g>

        <use href="#scene-trees" x="1110" y="150" width="57" height="78" />
        <use href="#scene-trees" x="1290" y="176" width="49" height="68" />
        <use href="#scene-trees" x="1340" y="134" width="65" height="91" />

        {/* hilltop mound the castle sits on, distinct from the mountain bands behind it */}
        <ellipse cx="698" cy="248" rx="92" ry="20" fill="var(--pine)" />

        <g transform="translate(658,148)">
          <rect x="10" y="42" width="60" height="58" fill="#EDE0C2" />
          <rect x="0" y="24" width="24" height="76" fill="#EDE0C2" />
          <rect x="56" y="24" width="24" height="76" fill="#EDE0C2" />
          <polygon points="0,24 12,4 24,24" fill="var(--cover-dark)" />
          <polygon points="56,24 68,4 80,24" fill="var(--cover-dark)" />
          <rect x="7" y="40" width="6" height="9" fill="var(--face)" />
          <rect x="67" y="40" width="6" height="9" fill="var(--face)" />
          {/* tall center keep — rises above both side towers, unlike the small door-gable this replaced */}
          <rect x="30" y="6" width="20" height="94" fill="#EDE0C2" />
          <polygon points="30,6 40,-18 50,6" fill="var(--cover-dark)" />
          <rect x="38" y="30" width="4" height="4" fill="var(--face)" transform="rotate(45 40 32)" />
          <path d="M34,100 L34,84 A6,6 0 0 1 46,84 L46,100Z" fill="var(--spine)" />
          {/* flag at the peak, picking up the dashed thread that runs down from the top of the frame */}
          <line x1="40" y1="-18" x2="40" y2="-38" stroke="var(--spine)" strokeWidth="2" />
          <polygon points="40,-38 40,-29 53,-33.5" fill="var(--cover)" />
        </g>

        <path d="M698,248 C693,258 688,264 682,271" fill="none" stroke="var(--road-line)" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M682,271 C666,268 652,260 645,255" fill="none" stroke="var(--road-line)" strokeWidth="3" strokeDasharray="8 8" />
        <path d="M682,271 C698,268 710,260 716,254" fill="none" stroke="var(--road-line)" strokeWidth="3" strokeDasharray="8 8" />
        <use href="#scene-pin" x="636" y="240" width="15" height="20" />
        <use href="#scene-pin" x="672" y="266" width="18" height="24" />
        <use href="#scene-pin" x="708" y="240" width="15" height="20" />

        {/* foreground cutoff: a wide, shallow curve in the page's cream color standing in
            for a near hillside — dips lowest at center so the castle/path stay visible,
            rises at the edges to cover more of the tree line, instead of a straight cut */}
        <path d="M0,205 C350,305 1050,305 1400,205 L1400,340 L0,340Z" fill="var(--cream)" />
      </svg>
    </div>
  )
}

function HowCta() {
  const { navigate } = useRouter()

  return (
    <div className="how-landscape-cta">
      <p>Ready to find your path?</p>
      <span className="cta-btn-shake">
        <button type="button" className="cta-btn" onClick={() => goToWaitlist(navigate)}>
          Join the waitlist
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <use href="#icon-arrow" />
          </svg>
        </button>
      </span>
    </div>
  )
}

export default function HowItWorks() {
  const sectionRef = useRef(null)
  usePauseAnimationsOffscreen(sectionRef)

  return (
    <section className="how-section container" id="how-it-works" ref={sectionRef}>
      <div className="how-head">
        <h2 className="how-statement">
          Researchly asks a handful of questions, then does<br />
          <span className="how-statement-underline">the digging for you...</span>
        </h2>
      </div>

      <ol className="how-trail">
        {STEPS.map((step, i) => (
          <StepRow step={step} index={i} key={step.title} />
        ))}
      </ol>

      <HowCta />
      <HowLandscape />
    </section>
  )
}
