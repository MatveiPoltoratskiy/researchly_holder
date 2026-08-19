import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CANADA_CENTER = [56.1304, -106.3468]
const CANADA_ZOOM = 4

const PIN_COLOR = {
  'pre-med': '#DD6B2E',
  biology: '#415C39',
  chemistry: '#D9A441',
  physics: '#1E2540',
}
const FIELD_ORDER = ['pre-med', 'biology', 'chemistry', 'physics']

function pinIcon(color) {
  const svg = `
    <svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1c6 0 10 4.6 10 10.2C22 18.6 12 31 12 31S2 18.6 2 11.2C2 5.6 6 1 12 1Z"
            fill="${color}" stroke="#FCF6EA" stroke-width="1.6" />
      <circle cx="12" cy="11.5" r="4" fill="#FCF6EA" />
    </svg>`
  return L.divIcon({
    className: 'opp-map-pin',
    html: svg,
    iconSize: [26, 34],
    iconAnchor: [13, 32],
    popupAnchor: [0, -30],
  })
}

const PIN_ICONS = Object.fromEntries(FIELD_ORDER.map((f) => [f, pinIcon(PIN_COLOR[f])]))

export default function OpportunityMap({ opportunities }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)

  // mount the map once, centered on Canada — filtering only ever updates markers below,
  // never recenters, so "start in Canada" stays the resting view no matter what's filtered
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: CANADA_CENTER,
      zoom: CANADA_ZOOM,
      scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
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

    for (const o of opportunities) {
      if (o.lat == null || o.lon == null) continue
      const primary = FIELD_ORDER.find((f) => o.focus.includes(f)) || 'pre-med'
      const marker = L.marker([o.lat, o.lon], { icon: PIN_ICONS[primary] })
      marker.bindPopup(
        `<div class="opp-map-popup">
           <strong>${escapeHtml(o.name)}</strong>
           <span>${escapeHtml(o.org)}</span>
           ${o.url ? `<a href="${escapeHtml(o.url)}" target="_blank" rel="noreferrer">View program →</a>` : ''}
         </div>`
      )
      marker.addTo(layer)
    }
  }, [opportunities])

  const plotted = opportunities.filter((o) => o.lat != null && o.lon != null).length

  return (
    <div className="opp-map-pane">
      <div className="opp-map-badge">
        {plotted} of {opportunities.length} shown on map
      </div>
      <div ref={containerRef} className="opp-map-canvas" />
    </div>
  )
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
