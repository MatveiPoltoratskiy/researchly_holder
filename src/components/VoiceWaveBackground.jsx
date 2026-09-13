import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// A grid of dots whose size/brightness ripples like a rolling wave (sin/cos interference
// over time), echoing the reference image's perspective wave-mesh but rendered flat and in
// the brand's orange/gold rather than a stark white-on-black — kept in the page's own warm
// cream, not swapped to black, per the "background colour should remain the same" ask.
export default function VoiceWaveBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduceMotion = prefersReducedMotion()

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let rafId = null
    let t = 0
    let visible = true

    const SPACING = 26
    const DOT_BASE = 1.1
    const DOT_AMP = 1.6

    function resize() {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const cols = Math.ceil(width / SPACING) + 1
      const rows = Math.ceil(height / SPACING) + 1
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * SPACING
          const y = j * SPACING
          const wave = Math.sin(i * 0.35 + t) * Math.cos(j * 0.3 + t * 0.8)
          const r = DOT_BASE + DOT_AMP * ((wave + 1) / 2)
          const alpha = 0.06 + 0.16 * ((wave + 1) / 2)
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(221,107,46,${alpha.toFixed(3)})`
          ctx.fill()
        }
      }
    }

    function tick() {
      if (!visible) {
        rafId = requestAnimationFrame(tick)
        return
      }
      t += 0.012
      draw()
      rafId = requestAnimationFrame(tick)
    }

    resize()
    draw()
    if (!reduceMotion) rafId = requestAnimationFrame(tick)

    function handleResize() { resize(); draw() }
    function handleVisibility() { visible = document.visibilityState === 'visible' }
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return <canvas className="voice-wave-canvas" ref={canvasRef} aria-hidden="true" />
}
