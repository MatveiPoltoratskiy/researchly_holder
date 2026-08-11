import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

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

export default function SymbolField({ rows = 2, cols = 12, opacityRange = [0.22, 0.28], fontSizeRange = [12, 18], colors = ['var(--symbol-tan)'] }) {
  const fieldRef = useRef(null)
  const elsRef = useRef([])
  const cycleTimerRef = useRef(null)
  const resizeTimerRef = useRef(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    const reduceMotion = prefersReducedMotion()

    function buildField() {
      field.innerHTML = ''
      elsRef.current = []

      const cellW = 100 / cols
      const cellH = 100 / rows

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const xPct = (col + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.4
          const yPct = (row + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.4

          const opacity = opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0])
          const fontSize = fontSizeRange[0] + Math.random() * (fontSizeRange[1] - fontSizeRange[0])
          const rot = -5 + Math.random() * 10
          const waveAmp = 5 + Math.random() * 3
          const waveDur = 5.4 + Math.random() * 0.6
          const waveDelay = (xPct / 100) * waveDur * 0.9

          const span = document.createElement('span')
          span.textContent = randSymbol()
          span.style.color = colors[Math.floor(Math.random() * colors.length)]
          span.style.left = xPct.toFixed(2) + '%'
          span.style.top = yPct.toFixed(2) + '%'
          span.style.fontSize = fontSize.toFixed(1) + 'px'
          span.style.setProperty('--rot', rot.toFixed(1) + 'deg')
          span.style.setProperty('--wave-amp', waveAmp.toFixed(1) + 'px')
          span.style.setProperty('--wave-dur', waveDur.toFixed(2) + 's')
          span.style.setProperty('--wave-delay', '-' + waveDelay.toFixed(2) + 's')
          span.style.opacity = opacity.toFixed(3)
          span.dataset.targetOpacity = opacity.toFixed(3)
          field.appendChild(span)
          elsRef.current.push(span)
        }
      }
    }

    function cycleSymbols() {
      const els = elsRef.current
      const n = els.length
      if (!n) return
      const swapCount = Math.max(1, Math.round(n * (0.08 + Math.random() * 0.08)))
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

    function scheduleCycle() {
      const delay = 1800 + Math.random() * 1400
      cycleTimerRef.current = setTimeout(() => {
        cycleSymbols()
        scheduleCycle()
      }, delay)
    }

    buildField()
    if (!reduceMotion) scheduleCycle()

    function handleResize() {
      clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(buildField, 300)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(cycleTimerRef.current)
      clearTimeout(resizeTimerRef.current)
    }
  }, [rows, cols])

  return <div className="symbol-field" ref={fieldRef} aria-hidden="true" />
}
