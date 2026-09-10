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

// Lazy-loaded, NOT statically imported, so each gets its own chunk that only ever ships
// to a browser that actually navigates there, instead of bloating the single main JS
// bundle everyone downloads on page load — pure code-splitting, no access gate involved
// (the passphrase gate that used to sit in front of these routes was removed; all four
// are public now).
const OpportunityExplorer = lazy(() => import('./components/OpportunityExplorer'))
const Interview = lazy(() => import('./components/Interview'))
const InterviewVoice = lazy(() => import('./components/InterviewVoice'))
const MyOpportunities = lazy(() => import('./components/MyOpportunities'))
const ProfessorFinder = lazy(() => import('./components/ProfessorFinder'))

function Page() {
  const { path } = useRouter()

  // the interview, the opportunities explorer, and My Opportunities are all fully
  // standalone, distraction-free screens: no nav, no footer, no zoom-out wrapper. Each
  // manages its own fixed, exactly-one-viewport layout (no page-level scroll at all) —
  // the site chrome above/below would either get clipped by that or force scroll back in,
  // so it's left out entirely rather than fought with via CSS.
  if (path === '/interview' || path === '/interview-voice') {
    return (
      <>
        <IconSprite />
        <Suspense fallback={null}>
          {path === '/interview' ? <Interview /> : <InterviewVoice />}
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
      <Page />
    </RouterProvider>
  )
}
