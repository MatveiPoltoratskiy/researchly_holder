const STEPS = [
  {
    badge: 'a',
    icon: 'icon-compass',
    title: 'Answer a few quick questions',
    text: "Your grade level, location, availability, and paid vs. unpaid preference. Takes about two minutes.",
  },
  {
    badge: 'b',
    icon: 'icon-list',
    title: 'Get matched to real opportunities',
    text: 'Internships, summer programs, and research positions that actually fit you — nearby or remote.',
  },
  {
    badge: 'c',
    icon: 'icon-check',
    title: 'Follow your personalized roadmap',
    text: "See exactly what to apply to and when, so you always know your next step.",
  },
]

function StepCard({ badge, icon, title, text }) {
  return (
    <div className="how-card">
      <span className={`u-badge how-badge u-badge--${badge}`}>
        <svg width="18" height="18"><use href={`#${icon}`} /></svg>
      </span>
      <h3 className="how-title">{title}</h3>
      <p className="how-text">{text}</p>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section className="how-section container">
      <p className="kicker how-kicker">How it works</p>
      <h2 className="how-heading">From lost to a plan, in three steps.</h2>
      <div className="how-grid">
        {STEPS.map((step) => (
          <StepCard key={step.badge} {...step} />
        ))}
      </div>
    </section>
  )
}
