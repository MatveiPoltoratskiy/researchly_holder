import { lazy, Suspense } from 'react'
import IconSprite from './components/IconSprite'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ReviewCarousel from './components/ReviewCarousel'
import Faq from './components/Faq'
import Contact from './components/Contact'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import { RouterProvider, useRouter } from './lib/router'
import { DevAccessProvider, useDevAccess } from './lib/devAccessContext'

// Lazy-loaded, NOT statically imported, so each gets its own chunk that only ever ships
// to a browser that actually navigates there — the single main JS bundle never carries
// this code/data regardless of gating. For the still-gated components below, that
// chunk is also only ever *requested* after verifyDevAccess() succeeds (see DEV_ROUTES).
// Interview and OpportunityExplorer are public now, so their chunks — and the full
// opportunity dataset both need — ship to anyone who visits those routes, gated or not.
const OpportunityExplorer = lazy(() => import('./components/OpportunityExplorer'))
const Interview = lazy(() => import('./components/Interview'))
const MyOpportunities = lazy(() => import('./components/MyOpportunities'))
const ProfessorFinder = lazy(() => import('./components/ProfessorFinder'))

// /interview and /opportunities are public — anyone can take the quiz and browse the
// full list. /my-opportunities (a signed-in-feeling saved list) and /professor-finder
// (directory/email-drafting not built yet) stay behind the passphrase gate.
const DEV_ROUTES = new Set(['/my-opportunities', '/professor-finder'])

// deliberately plain and uninteresting — this is a real server-verified gate (see
// lib/devAccess.js + api/dev-verify.js), but the page still shouldn't invite curiosity
// by looking like it's hiding something worth finding
function RouteUnavailable() {
  return (
    <div className="route-unavailable">
      <p>This page isn't available right now.</p>
      <a href="/">Back home</a>
    </div>
  )
}

function Page() {
  const { path } = useRouter()
  const isDevRoute = DEV_ROUTES.has(path)
  // shared with Navbar/Footer (see DevAccessProvider) so there's one verify round-trip
  // for the whole app, not a separate one per gated route. `checked` stays false only
  // for the instant that round-trip is in flight, so a legitimately unlocked visitor
  // never flashes the "unavailable" page before it resolves.
  const { unlocked, checked } = useDevAccess()

  if (isDevRoute && !unlocked) {
    return (
      <>
        <IconSprite />
        {checked && <RouteUnavailable />}
      </>
    )
  }

  // the interview, the opportunities explorer, and My Opportunities are all fully
  // standalone, distraction-free screens: no nav, no footer, no zoom-out wrapper. Each
  // manages its own fixed, exactly-one-viewport layout (no page-level scroll at all) —
  // the site chrome above/below would either get clipped by that or force scroll back in,
  // so it's left out entirely rather than fought with via CSS.
  if (path === '/interview') {
    return (
      <>
        <IconSprite />
        <Suspense fallback={null}>
          <Interview />
        </Suspense>
      </>
    )
  }

  if (path === '/opportunities' || path === '/my-opportunities') {
    return (
      <>
        <IconSprite />
        <Suspense fallback={null}>
          {path === '/opportunities' ? <OpportunityExplorer /> : <MyOpportunities />}
        </Suspense>
      </>
    )
  }

  if (path === '/professor-finder') {
    return (
      <>
        <IconSprite />
        <Suspense fallback={null}>
          <ProfessorFinder />
        </Suspense>
      </>
    )
  }

  const isLanding = path !== '/contact' && path !== '/how-it-works'

  const content = (
    <>
      <Navbar />
      {path === '/contact' ? (
        <Contact />
      ) : path === '/how-it-works' ? (
        <HowItWorks />
      ) : (
        <>
          <Hero />
          <ReviewCarousel />
          {/* these two run noticeably larger than the rest of the page at a normal browser
              zoom — scale them down independently of .compact-page (which only wraps the
              other routes, so it never interacts with this) */}
          <div className="landing-compact">
            <HowItWorks />
            <Faq />
          </div>
        </>
      )}
      <Footer />
    </>
  )

  return (
    <>
      <IconSprite />
      {/* every page but the landing page renders a touch smaller, so a reader at a standard
          100% browser zoom sees more of the page at once instead of feeling zoomed-in */}
      {isLanding ? content : <div className="compact-page">{content}</div>}
    </>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <DevAccessProvider>
        <Page />
      </DevAccessProvider>
    </RouterProvider>
  )
}
