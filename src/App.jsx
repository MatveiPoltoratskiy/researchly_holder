import { lazy, Suspense, useEffect, useState } from 'react'
import IconSprite from './components/IconSprite'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ReviewCarousel from './components/ReviewCarousel'
import Faq from './components/Faq'
import Contact from './components/Contact'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import { RouterProvider, useRouter } from './lib/router'
import { verifyDevAccess } from './lib/devAccess'

// Lazy-loaded, NOT statically imported: everything reachable from these two components
// (the interview flow, the map, the ~180-program dataset) previously shipped in the
// single main JS bundle regardless of the passphrase gate, since Vite bundles static
// imports together by default — meaning anyone could pull the full dataset and UI code
// out of the network tab without ever unlocking anything. Dynamic import() gives each
// its own chunk that's only ever requested after verifyDevAccess() below succeeds, so an
// unauthenticated visitor's browser never fetches this code or data in the first place.
const OpportunityExplorer = lazy(() => import('./components/OpportunityExplorer'))
const Interview = lazy(() => import('./components/Interview'))
const MyOpportunities = lazy(() => import('./components/MyOpportunities'))

const DEV_ROUTES = new Set(['/interview', '/opportunities', '/my-opportunities'])

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
  // checking | granted | denied — starts at "checking" so a legitimately unlocked
  // visitor never flashes the "unavailable" page while the server round-trip resolves
  const [devAccess, setDevAccess] = useState('checking')

  useEffect(() => {
    if (!isDevRoute) return
    let cancelled = false
    setDevAccess('checking')
    verifyDevAccess().then((ok) => {
      if (!cancelled) setDevAccess(ok ? 'granted' : 'denied')
    })
    return () => {
      cancelled = true
    }
  }, [path, isDevRoute])

  if (isDevRoute && devAccess !== 'granted') {
    return (
      <>
        <IconSprite />
        {devAccess === 'denied' && <RouteUnavailable />}
      </>
    )
  }

  // the interview is a fully standalone, distraction-free screen: no nav, no footer, no
  // zoom-out wrapper (its own layout math already targets the real viewport height so it
  // never scrolls, which would be thrown off by the .compact-page zoom every other
  // non-landing route gets)
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

  const isLanding =
    path !== '/contact' && path !== '/how-it-works' && path !== '/opportunities' && path !== '/my-opportunities'

  const content = (
    <>
      <Navbar />
      {path === '/contact' ? (
        <Contact />
      ) : path === '/how-it-works' ? (
        <HowItWorks />
      ) : path === '/opportunities' ? (
        <Suspense fallback={null}>
          <OpportunityExplorer />
        </Suspense>
      ) : path === '/my-opportunities' ? (
        <Suspense fallback={null}>
          <MyOpportunities />
        </Suspense>
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
