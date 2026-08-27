import { prefersReducedMotion } from './motion'

const CONFETTI_COLORS = ['var(--cover)', 'var(--gold)', 'var(--match-green)', 'var(--ribbon)']
const CONFETTI_COOLDOWN_MS = 5000
const lastConfettiAt = new WeakMap()

function spawnConfetti(originX, originY, count) {
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

export function burstConfetti(originEl, count) {
  if (prefersReducedMotion() || !originEl) return
  const now = Date.now()
  const last = lastConfettiAt.get(originEl) || 0
  if (now - last < CONFETTI_COOLDOWN_MS) return
  lastConfettiAt.set(originEl, now)

  const rect = originEl.getBoundingClientRect()
  spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height * 0.3, count)
}

// Same burst, centered on a raw viewport point (e.g. a click's clientX/clientY)
// instead of an element's box — for actions like the save toggle, where the
// cursor is a more natural origin than the small icon it just clicked.
let lastPointConfettiAt = 0
const POINT_COOLDOWN_MS = 250

export function burstConfettiAtPoint(x, y, count) {
  if (prefersReducedMotion()) return
  const now = Date.now()
  if (now - lastPointConfettiAt < POINT_COOLDOWN_MS) return
  lastPointConfettiAt = now
  spawnConfetti(x, y, count)
}

// Whole-screen celebration for landing on the interview's match results — a scatter of
// pieces across the top that pop outward (the "explosion" beat) then fall the full height
// of the viewport under gravity, fading out right as they reach the bottom rather than
// disappearing abruptly. Distinct from spawnConfetti above (a tight burst from one point):
// this one seeds pieces all along the top edge so it reads as page-wide, not a single spot.
export function celebrateMatches() {
  if (prefersReducedMotion()) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const count = Math.round(Math.min(90, Math.max(50, vw / 14)))
  const pieces = []

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'confetti-piece confetti-piece--fall'
    const startX = Math.random() * vw
    const dx = (Math.random() - 0.5) * 180
    const dy = vh + 50
    const rot = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540)
    const duration = 1.7 + Math.random() * 1.1
    const delay = Math.random() * 600

    el.style.left = startX + 'px'
    el.style.top = '-16px'
    el.style.setProperty('--dx', dx.toFixed(1) + 'px')
    el.style.setProperty('--dy', dy.toFixed(1) + 'px')
    el.style.setProperty('--rot', rot.toFixed(1) + 'deg')
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    el.style.animation = `confetti-fall ${duration.toFixed(2)}s cubic-bezier(.15,.6,.3,1) ${delay.toFixed(0)}ms both`
    pieces.push(el)
    document.body.appendChild(el)
  }

  setTimeout(() => {
    pieces.forEach((p) => p.remove())
  }, 600 + 2.8 * 1000)
}
