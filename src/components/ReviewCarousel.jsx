const REVIEWS = [
  { color: 'var(--cover)', text: "Bro this is actually sick, I found research internships that I didn’t know even existed even with my resume being cooked." },
  { color: 'var(--pine)', text: "Clean layout overall. Didn’t feel overwhelming, which is rare for research and all of these websites in one." },
  { color: 'var(--navy)', text: "ngl I thought this was gonna be another ChatGPT wrapper but it’s actually saving my med school requirements." },
  { color: 'var(--cover)', text: "Everything just makes sense. It’s like a mix of Khan Academy and research opportunities in one." },
  { color: 'var(--pine)', text: "This would’ve saved me days when I was looking for summer research a few months ago, crazy find." },
  { color: 'var(--navy)', text: "Finally something that is a free tool for students, and I actually understand what I’m supposed to do next instead of opening 15 tabs." },
  { color: 'var(--cover)', text: "I didn’t even realize there were research programs for high school students. This roadmap helped me understand where I could start!" },
  { color: 'var(--pine)', text: "It feels like the kind of tool I wish existed when I first started looking into research, would’ve saved me hours." },
  { color: 'var(--navy)', text: "I finally know where to start, I’m so mad I didn’t have this during summer internship season…" },
]

function ReviewCard({ color, text }) {
  return (
    <div className="review-card">
      <div className="review-head">
        <span className="review-quote" style={{ background: color }}>&ldquo;</span>
        <span className="review-stars">★★★★★</span>
      </div>
      <p className="review-text">{text}</p>
    </div>
  )
}

export default function ReviewCarousel() {
  // rendered twice back-to-back so a -50% translateX loop is seamless
  const looped = [...REVIEWS, ...REVIEWS]

  return (
    <section className="reviews-section">
      <p className="reviews-kicker">Beta testers say&hellip;</p>
      <div className="reviews-track-wrap">
        <div className="reviews-track">
          {looped.map((review, i) => (
            <ReviewCard key={i} {...review} />
          ))}
        </div>
      </div>
    </section>
  )
}
