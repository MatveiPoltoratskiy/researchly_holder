import { useEffect, useState } from 'react'
import IconSprite from './components/IconSprite'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ReviewCarousel from './components/ReviewCarousel'
import Faq from './components/Faq'
import Contact from './components/Contact'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import OpportunityExplorer from './components/OpportunityExplorer'
import Interview from './components/Interview'
import { RouterProvider, useRouter } from './lib/router'
import { verifyDevAccess } from './lib/devAccess'

const DEV_ROUTES = new Set(['/interview', '/opportunities'])

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
        <Interview />
      </>
    )
  }

  const isLanding = path !== '/contact' && path !== '/how-it-works' && path !== '/opportunities'

  const content = (
    <>
      <Navbar />
      {path === '/contact' ? (
        <Contact />
      ) : path === '/how-it-works' ? (
        <HowItWorks />
      ) : path === '/opportunities' ? (
        <OpportunityExplorer />
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
