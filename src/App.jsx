import IconSprite from './components/IconSprite'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ReviewCarousel from './components/ReviewCarousel'
import Faq from './components/Faq'
import Contact from './components/Contact'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import { RouterProvider, useRouter } from './lib/router'

function Page() {
  const { path } = useRouter()

  return (
    <>
      <IconSprite />
      <Navbar />
      {path === '/contact' ? (
        <Contact />
      ) : path === '/how-it-works' ? (
        <HowItWorks />
      ) : (
        <>
          <Hero />
          <ReviewCarousel />
          <Faq />
        </>
      )}
      <Footer />
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
