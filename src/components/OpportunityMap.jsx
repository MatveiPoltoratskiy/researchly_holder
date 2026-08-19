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

// selected pins get an orange halo + a size bump so it's obvious on the map which card is
// selected, mirroring the orange outline the card itself gets in the list
function pinIcon(color, selected) {
  const svg = selected
    ? `<svg width="34" height="42" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
         <circle cx="15" cy="14.2" r="15" fill="#DD6B2E" opacity=".22" />
         <path d="M15 3c6.6 0 11 5 11 11.2C26 21.6 15 35 15 35S4 21.6 4 14.2C4 5 8.4 3 15 3Z"
               fill="${color}" stroke="#DD6B2E" stroke-width="2.4" />
         <circle cx="15" cy="14.2" r="4.4" fill="#FCF6EA" />
       </svg>`
    : `<svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
         <path d="M12 1c6 0 10 4.6 10 10.2C22 18.6 12 31 12 31S2 18.6 2 11.2C2 5.6 6 1 12 1Z"
               fill="${color}" stroke="#FCF6EA" stroke-width="1.6" />
         <circle cx="12" cy="11.5" r="4" fill="#FCF6EA" />
       </svg>`
  const size = selected ? [34, 42] : [26, 34]
  return L.divIcon({
    className: 'opp-map-pin',
    html: svg,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] - 2],
    popupAnchor: [0, -size[1] + 4],
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
      const marker = L.marker([o.lat, o.lon], { icon: pinIcon(PIN_COLOR[primary], selected) })
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
