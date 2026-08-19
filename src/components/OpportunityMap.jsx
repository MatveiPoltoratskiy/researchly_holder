import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CANADA_CENTER = [56.1304, -106.3468]
const CANADA_ZOOM = 4
const NATIONAL_CLUSTER_ID = '__national-cluster__'

const PIN_COLOR = {
  'pre-med': '#DD6B2E',
  biology: '#415C39',
  chemistry: '#D9A441',
  physics: '#1E2540',
}
const FIELD_ORDER = ['pre-med', 'biology', 'chemistry', 'physics']
const FIELD_LABEL = { 'pre-med': 'Pre-Med', biology: 'Biology', chemistry: 'Chemistry', physics: 'Physics' }

function domainFromUrl(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// pins show the org's actual logo (same favicon-chain approach as the card badges) inside
// a small circular marker with a field-colored ring, instead of a plain colored teardrop.
// Leaflet's divIcon is raw HTML with no React event system, so the fallback chain runs via
// a single shared window-level handler (set up once on mount below) rather than component
// state — there's no per-marker React tree to hold that state in.
function logoPinIcon({ org, url, color, selected }) {
  const domain = domainFromUrl(url)
  const badgeSize = selected ? 46 : 38
  const tailHeight = 9
  const totalHeight = badgeSize + tailHeight
  const ring = selected ? '#DD6B2E' : color
  const ringWidth = selected ? 3 : 2
  const letter = (org.trim()[0] || '?').toUpperCase()

  const googleUrl = domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : null
  const duckUrl = domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null

  const contentHtml = googleUrl
    ? `<img class="opp-map-pin-img" src="${googleUrl}" onerror="window.__oppPinFallback(this,'${duckUrl}')" />
       <span class="opp-map-pin-fallback" style="display:none;">${letter}</span>`
    : `<span class="opp-map-pin-fallback">${letter}</span>`

  const html = `
    <div class="opp-map-pin-stack">
      <div class="opp-map-pin-badge" style="width:${badgeSize}px;height:${badgeSize}px;border-color:${ring};border-width:${ringWidth}px;">
        ${selected ? '<span class="opp-map-pin-halo"></span>' : ''}
        ${contentHtml}
      </div>
      <div class="opp-map-pin-tail" style="border-top-color:${ring};"></div>
    </div>`

  return L.divIcon({
    className: 'opp-map-pin',
    html,
    iconSize: [badgeSize, totalHeight],
    iconAnchor: [badgeSize / 2, totalHeight],
    popupAnchor: [0, -totalHeight + 6],
  })
}

// records with no single coordinate (remote programs, multiSite/isDirectory national
// awards) still need to show up somewhere per "list all opportunities on the map" — they
// get bundled into one badge-shaped marker at the Canada centroid rather than each
// claiming a fake precise location
function clusterIcon(selected) {
  const svg = `
    <svg width="${selected ? 46 : 40}" height="${selected ? 46 : 40}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      ${selected ? '<circle cx="20" cy="20" r="20" fill="#DD6B2E" opacity=".22" />' : ''}
      <rect x="4" y="4" width="32" height="32" rx="10" fill="#1E2540" stroke="${selected ? '#DD6B2E' : '#FCF6EA'}" stroke-width="${selected ? 2.6 : 1.8}" />
      <path d="M15 12v16" stroke="#FCF6EA" stroke-width="1.7" stroke-linecap="round" />
      <path d="M15 13c3-1.6 6-1.6 9 0v7c-3-1.6-6-1.6-9 0Z" fill="#FCF6EA" />
    </svg>`
  const size = selected ? 46 : 40
  return L.divIcon({
    className: 'opp-map-pin',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function popupHtml(o, primary) {
  return `<div class="opp-map-popup">
      <span class="opp-map-popup-field opp-map-popup-field--${primary}">${FIELD_LABEL[primary]}</span>
      <strong>${escapeHtml(o.name)}</strong>
      <span class="opp-map-popup-org">${escapeHtml(o.org)}</span>
      ${o.url ? `<a href="${escapeHtml(o.url)}" target="_blank" rel="noreferrer">View program →</a>` : ''}
    </div>`
}

export default function OpportunityMap({ opportunities, selectedId, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)
  const markerByIdRef = useRef(new Map())

  // shared fallback handler for every pin's logo <img> — tries DuckDuckGo's favicon
  // service once, then reveals the letter-initial fallback span if that fails too
  useEffect(() => {
    window.__oppPinFallback = function (img, duckUrl) {
      if (duckUrl && !img.dataset.triedDuck) {
        img.dataset.triedDuck = '1'
        img.src = duckUrl
        return
      }
      img.style.display = 'none'
      const fallback = img.nextElementSibling
      if (fallback) fallback.style.display = 'flex'
    }
    return () => {
      delete window.__oppPinFallback
    }
  }, [])

  // mount the map once, centered on Canada — filtering only ever updates markers below,
  // never recenters, so "start in Canada" stays the resting view no matter what's filtered
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: CANADA_CENTER,
      zoom: CANADA_ZOOM,
      scrollWheelZoom: true,
      // whole-world is as far out as this ever goes — worldCopyJump off + tile noWrap
      // below stop duplicate side-by-side world copies from appearing at that cap
      minZoom: 2,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 1,
      worldCopyJump: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 2,
      noWrap: true,
    }).addTo(map)
    markersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // the map pane is display:none below the 1280px breakpoint, so a resize back above
    // it (or a narrow initial load) needs an explicit invalidateSize — Leaflet doesn't
    // auto-detect its container becoming visible/resized on its own
    function handleResize() {
      mapRef.current?.invalidateSize()
    }
    window.addEventListener('resize', handleResize)
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = markersRef.current
    if (!layer) return
    layer.clearLayers()
    markerByIdRef.current.clear()

    const unplaced = []
    for (const o of opportunities) {
      const primary = FIELD_ORDER.find((f) => o.focus.includes(f)) || o.focus[0] || 'pre-med'
      if (o.lat == null || o.lon == null) {
        unplaced.push({ o, primary })
        continue
      }
      const selected = o.id === selectedId
      const icon = logoPinIcon({ org: o.org, url: o.url, color: PIN_COLOR[primary], selected })
      const marker = L.marker([o.lat, o.lon], { icon })
      marker.bindPopup(popupHtml(o, primary), { className: 'opp-map-popup-wrap', maxWidth: 260 })
      marker.on('click', () => onSelect?.(o.id))
      marker.addTo(layer)
      markerByIdRef.current.set(o.id, marker)
      if (selected) marker.openPopup()
    }

    // one badge marker represents every no-coordinate record at once, listing all of them
    if (unplaced.length) {
      const selected = selectedId === NATIONAL_CLUSTER_ID
      const marker = L.marker(CANADA_CENTER, { icon: clusterIcon(selected) })
      const rows = unplaced
        .map(
          ({ o, primary }) => `
          <div class="opp-map-cluster-row">
            <span class="opp-map-popup-field opp-map-popup-field--${primary}">${FIELD_LABEL[primary]}</span>
            <strong>${escapeHtml(o.name)}</strong>
            <span class="opp-map-popup-org">${escapeHtml(o.org)}</span>
            ${o.url ? `<a href="${escapeHtml(o.url)}" target="_blank" rel="noreferrer">View program →</a>` : ''}
          </div>`
        )
        .join('')
      marker.bindPopup(
        `<div class="opp-map-popup opp-map-popup--cluster">
           <div class="opp-map-cluster-title">${unplaced.length} national / remote program${unplaced.length === 1 ? '' : 's'}</div>
           <div class="opp-map-cluster-list">${rows}</div>
         </div>`,
        { className: 'opp-map-popup-wrap opp-map-popup-wrap--cluster', maxWidth: 300 }
      )
      marker.on('click', () => onSelect?.(NATIONAL_CLUSTER_ID))
      marker.addTo(layer)
      markerByIdRef.current.set(NATIONAL_CLUSTER_ID, marker)
      if (selected) marker.openPopup()
    }
  }, [opportunities, selectedId, onSelect])

  // a card selected from the LIST (not clicked directly on the map) should pan the map to
  // it — the marker-rebuild effect above already handles giving it the highlighted icon
  useEffect(() => {
    if (!selectedId || selectedId === NATIONAL_CLUSTER_ID) return
    const marker = markerByIdRef.current.get(selectedId)
    const map = mapRef.current
    if (!marker || !map) return
    map.panTo(marker.getLatLng(), { animate: true })
  }, [selectedId])

  return (
    <div className="opp-map-pane">
      <div className="opp-map-badge">All {opportunities.length} shown on map</div>
      <div ref={containerRef} className="opp-map-canvas" />
    </div>
  )
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
