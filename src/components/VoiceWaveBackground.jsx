import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// Short research glyphs only — long strings like "E = mc²" don't read cleanly at small
// wave-grid sizes, unlike SymbolField's landing/quiz use where cells are bigger.
const SYMBOL_POOL = [
  'α', 'β', 'γ', 'δ', 'λ', 'μ', 'π', 'Ω', 'Σ', 'Δ', 'θ', 'φ',
  'H₂O', 'CO₂', 'NaCl', 'O₂', 'DNA', 'RNA', 'ATP',
  '∫', '∇', '∂', '∞', '√', '±',
]

// A grid of research symbols whose size/brightness ripples like a rolling wave (sin/cos
// interference over time) — the reference image's perspective wave-mesh, rendered flat and
// in the brand's orange rather than a stark white-on-black, and stocked with research
// glyphs instead of plain dots. Each cell's symbol is picked once (stable), only its size/
// opacity animates, so the grid doesn't flicker with new characters every frame.
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
    let cells = []

    const SPACING = 84
    const FONT_BASE = 12
    const FONT_AMP = 8

    function seededSymbol(i, j) {
      // deterministic pseudo-random pick per cell, so a resize rebuild doesn't reshuffle
      // symbols the student has already glanced at
      const n = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
      const frac = n - Math.floor(n)
      return SYMBOL_POOL[Math.floor(frac * SYMBOL_POOL.length)]
    }

    function resize() {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cols = Math.ceil(width / SPACING) + 1
      const rows = Math.ceil(height / SPACING) + 1
      cells = []
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          cells.push({ x: i * SPACING, y: j * SPACING, i, j, symbol: seededSymbol(i, j) })
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const c of cells) {
        const wave = Math.sin(c.i * 0.32 + t) * Math.cos(c.j * 0.28 + t * 0.75)
        const size = FONT_BASE + FONT_AMP * ((wave + 1) / 2)
        const alpha = 0.07 + 0.16 * ((wave + 1) / 2)
        ctx.font = `700 ${size.toFixed(1)}px "Segoe UI", system-ui, sans-serif`
        ctx.fillStyle = `rgba(221,107,46,${alpha.toFixed(3)})`
        ctx.fillText(c.symbol, c.x, c.y)
      }
    }

    function tick() {
      if (!visible) {
        rafId = requestAnimationFrame(tick)
        return
      }
      t += 0.014
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
