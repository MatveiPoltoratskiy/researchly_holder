import { prefersReducedMotion } from './motion'

const CONFETTI_COLORS = ['var(--cover)', 'var(--gold)', 'var(--match-green)', 'var(--ribbon)']
const CONFETTI_COOLDOWN_MS = 5000
const lastConfettiAt = new WeakMap()

export function burstConfetti(originEl, count) {
  if (prefersReducedMotion() || !originEl) return
  const now = Date.now()
  const last = lastConfettiAt.get(originEl) || 0
  if (now - last < CONFETTI_COOLDOWN_MS) return
  lastConfettiAt.set(originEl, now)

  const rect = originEl.getBoundingClientRect()
  const originX = rect.left + rect.width / 2
  const originY = rect.top + rect.height * 0.3
  const pieces = []

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'confetti-piece'
    const angle = ((Math.random() * 150 - 75) * Math.PI) / 180
    const dist = 70 + Math.random() * 90
    const dx = Math.sin(angle) * dist
    const dy = -Math.abs(Math.cos(angle) * dist) - 36
    el.style.setProperty('--dx', dx + 'px')
    el.style.setProperty('--dy', dy + 'px')
    el.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg')
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    el.style.left = originX + 'px'
    el.style.top = originY + 'px'
    el.style.animationDelay = Math.random() * 70 + 'ms'
    pieces.push(el)
    document.body.appendChild(el)
  }

  setTimeout(() => {
    pieces.forEach((p) => p.remove())
  }, 1000)
}
