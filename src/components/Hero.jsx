import { useEffect, useRef } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'
import RoadmapPreview from './RoadmapPreview'
import Waitlist from './Waitlist'

const SYMBOL_POOL = [
  'α', 'β', 'γ', 'δ', 'λ', 'μ', 'π', 'Ω', 'Σ', 'Δ', 'θ', 'φ', 'Ψ', 'Ξ', 'ε', 'ρ', 'τ', 'ω',
  'H₂O', 'NH₃', 'CO₂', 'C₆H₁₂O₆', 'NaCl', 'O₂', 'CH₄', 'C₆H₁₀N₂O₂',
  '∫', '∇', '∂', '∞', '≈', '≠', '√', '∴', '±',
  'E = mc²', 'F = ma', 'ħ', 'ΔE', 'v = λf',
  'DNA', 'RNA', 'ATP', 'mRNA', 'ADP',
]

function randSymbol() {
  return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)]
}

export default function Hero() {
  const heroRef = useRef(null)
  const landscapeRef = useRef(null)
  const symbolFieldRef = useRef(null)
  const symbolElsRef = useRef([])
  const cycleTimerRef = useRef(null)
  const resizeTimerRef = useRef(null)

  usePauseAnimationsOffscreen(heroRef)

  useEffect(() => {
    const symbolField = symbolFieldRef.current
    const heroEl = heroRef.current
    const landscapeEl = landscapeRef.current
    if (!symbolField || !heroEl || !landscapeEl) return

    const reduceMotion = prefersReducedMotion()

    function buildSymbolField() {
      symbolField.innerHTML = ''
      symbolElsRef.current = []

      const heroRect = heroEl.getBoundingClientRect()
      const landscapeRect = landscapeEl.getBoundingClientRect()
      if (!heroRect.height) return

      const landscapeTopPct = ((landscapeRect.top - heroRect.top) / heroRect.height) * 100
      const landscapeHeightPct = (landscapeRect.height / heroRect.height) * 100
      const bandCenterPct = landscapeTopPct + landscapeHeightPct * 0.28
      const bandHeightPct = landscapeHeightPct * 0.3
      const bandTopPct = Math.max(0, bandCenterPct - bandHeightPct / 2)

      const cols = 12
      const rows = 3
      const cellW = 100 / cols
      const cellH = bandHeightPct / rows

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const xPct = (col + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.4
          const yPct = bandTopPct + (row + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.4

          const opacity = 0.22 + Math.random() * 0.06
          const fontSize = 12 + Math.random() * 6
          const rot = -5 + Math.random() * 10
          const waveAmp = 5 + Math.random() * 3
          const waveDur = 5.4 + Math.random() * 0.6
          const waveDelay = (xPct / 100) * waveDur * 0.9

          const span = document.createElement('span')
          span.textContent = randSymbol()
          span.style.left = xPct.toFixed(2) + '%'
          span.style.top = yPct.toFixed(2) + '%'
          span.style.fontSize = fontSize.toFixed(1) + 'px'
          span.style.setProperty('--rot', rot.toFixed(1) + 'deg')
          span.style.setProperty('--wave-amp', waveAmp.toFixed(1) + 'px')
          span.style.setProperty('--wave-dur', waveDur.toFixed(2) + 's')
          span.style.setProperty('--wave-delay', '-' + waveDelay.toFixed(2) + 's')
          span.style.opacity = opacity.toFixed(3)
          span.dataset.targetOpacity = opacity.toFixed(3)
          symbolField.appendChild(span)
          symbolElsRef.current.push(span)
        }
      }
    }

    function cycleSymbols() {
      if (heroEl.classList.contains('is-offscreen')) return // skip work while scrolled away
      const els = symbolElsRef.current
      const n = els.length
      if (!n) return
      const swapCount = Math.max(1, Math.round(n * (0.12 + Math.random() * 0.13)))
      const idxs = {}
      while (Object.keys(idxs).length < swapCount && Object.keys(idxs).length < n) {
        idxs[Math.floor(Math.random() * n)] = true
      }
      Object.keys(idxs).forEach((key) => {
        const el = els[key]
        if (!el) return
        el.style.opacity = '0'
        setTimeout(() => {
          let next = randSymbol()
          let tries = 0
          while (next === el.textContent && tries < 5) {
            next = randSymbol()
            tries++
          }
          el.textContent = next
          requestAnimationFrame(() => {
            el.style.opacity = el.dataset.targetOpacity
          })
        }, 90)
      })
    }

    function scheduleSymbolCycle() {
      const delay = 1000 + Math.random() * 1000
      cycleTimerRef.current = setTimeout(() => {
        cycleSymbols()
        scheduleSymbolCycle()
      }, delay)
    }

    buildSymbolField()
    if (!reduceMotion) scheduleSymbolCycle()

    function handleResize() {
      clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(buildSymbolField, 300)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(cycleTimerRef.current)
      clearTimeout(resizeTimerRef.current)
    }
  }, [])

  return (
    <div className="hero" ref={heroRef}>
      <div className="hero-sketch sketch-hex-b" aria-hidden="true"><svg viewBox="0 0 140 110"><use href="#deco-hex" /></svg></div>
      <div className="hero-sketch sketch-hex-a" aria-hidden="true"><svg viewBox="0 0 140 110"><use href="#deco-hex" /></svg></div>
      <p className="hero-sketch sketch-note sketch-note-b" aria-hidden="true">Curiosity leads to discovery.</p>
      <p className="hero-sketch sketch-formula formula-a" aria-hidden="true">C₆H₁₀N₂O₂</p>

      <div className="symbol-field" ref={symbolFieldRef} aria-hidden="true"></div>

      <div className="hero-top container">
        <div className="hero-text">
          <p className="kicker">Join the waitlist</p>
          <h1>
            Come <span className="circle-mark">lost.</span>
            <br />
            Leave with research opportunities.
          </h1>
          <p className="sub">
            Get a personalized roadmap of research opportunities, internships, and summer programs
            based on your interest, <span className="sub-accent">in just a few minutes</span>.
          </p>
          <Waitlist />
        </div>

        <RoadmapPreview />
      </div>

      <div className="landscape-wrap" ref={landscapeRef}>
        <svg className="scene-svg" viewBox="0 0 1536 538" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <polygon points="0,560 0,320 90,260 180,300 260,230 340,280 430,190 520,260 610,210 700,150 780,200 860,160 950,220 1040,180 1130,240 1220,190 1310,250 1400,210 1480,260 1536,230 1536,560" fill="var(--sage-back)" />

          <polygon points="0,560 0,380 70,330 150,360 230,300 310,350 400,290 480,340 570,270 650,330 730,280 820,340 900,290 990,350 1080,300 1170,360 1260,310 1350,350 1440,300 1536,340 1536,560" fill="var(--sage-mid)" />

          <use className="tree-group" href="#scene-trees" x="130" y="330" width="34" height="46" />
          <use className="tree-group" href="#scene-trees" x="300" y="320" width="30" height="42" />
          <use className="tree-group" href="#scene-trees" x="1230" y="320" width="32" height="44" />
          <use className="tree-group" href="#scene-trees" x="1400" y="330" width="30" height="42" />

          <polygon points="0,560 0,420 60,380 140,400 220,360 300,400 380,360 460,410 520,460 520,560" fill="var(--sage-front)" />
          <polygon points="1020,560 1020,460 1090,400 1160,420 1240,370 1320,410 1400,370 1480,400 1536,420 1536,560" fill="var(--sage-front)" />

          <use className="tree-group" href="#scene-trees" x="470" y="368" width="44" height="62" />
          <use className="tree-group" href="#scene-trees" x="540" y="380" width="38" height="54" />
          <use className="tree-group" href="#scene-trees" x="980" y="378" width="40" height="56" />
          <use className="tree-group" href="#scene-trees" x="1050" y="368" width="44" height="62" />

          <rect x="0" y="460" width="1536" height="100" fill="var(--stone)" />
          <g stroke="#00000012" strokeWidth="1">
            <line x1="0" y1="490" x2="1536" y2="490" />
            <line x1="0" y1="520" x2="1536" y2="520" />
          </g>

          <use href="#prop-books" x="30" y="378" width="220" height="157" />
          <use href="#prop-microscope" x="260" y="336" width="150" height="193" />
          <use href="#prop-flasks" x="1170" y="322" width="185" height="206" />
          <use href="#prop-plant" x="1385" y="342" width="140" height="172" />
        </svg>
      </div>
    </div>
  )
}
