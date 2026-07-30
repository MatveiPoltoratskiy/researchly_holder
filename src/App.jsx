import IconSprite from './components/IconSprite'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ReviewCarousel from './components/ReviewCarousel'
import Contact from './components/Contact'
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
      ) : (
        <>
          <Hero />
          <ReviewCarousel />
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
