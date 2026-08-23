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
  neuroscience: '#C1573B',
  mathematics: '#3F7D5C',
  'computer-science': '#8C4A22',
}
const FIELD_ORDER = ['pre-med', 'biology', 'chemistry', 'physics', 'neuroscience', 'mathematics', 'computer-science']
const FIELD_LABEL = {
  'pre-med': 'Pre-Med',
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  neuroscience: 'Neuroscience',
  mathematics: 'Mathematics',
  'computer-science': 'Computer Science',
}

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

// Google Maps-style "you are here": a small solid blue dot with a white ring, sitting on
// top of a larger soft pulse that animates outward — CSS keyframes (below, in index.css)
// do the actual pulsing, this just lays out the two nested elements Leaflet renders as-is.
function userLocationIcon() {
  const html = `
    <div class="opp-user-dot">
      <span class="opp-user-dot-pulse"></span>
      <span class="opp-user-dot-core"></span>
    </div>`
  return L.divIcon({ className: 'opp-user-dot-wrap', html, iconSize: [22, 22], iconAnchor: [11, 11] })
}

function popupHtml(o, primary) {
  return `<div class="opp-map-popup">
      <span class="opp-map-popup-field opp-map-popup-field--${primary}">${FIELD_LABEL[primary]}</span>
      <strong>${escapeHtml(o.name)}</strong>
      <span class="opp-map-popup-org">${escapeHtml(o.org)}</span>
      ${o.url ? `<a href="${escapeHtml(o.url)}" target="_blank" rel="noreferrer">View program →</a>` : ''}
    </div>`
}

export default function OpportunityMap({ opportunities, selectedId, onSelect, userLocation, locationStatus, onRequestLocation }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)
  const markerByIdRef = useRef(new Map())
  const userMarkerRef = useRef(null)

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
    // CartoDB's Positron style instead of stock OSM tiles: a flat grey/light basemap
    // showing streets, labels and buildings without terrain shading, landcover colour, or
    // other prominent physical-geography features cluttering the view
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
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

  // the "you are here" dot: placed/moved whenever userLocation changes, removed when it's
  // cleared. Unlike every other recenter in this file, flying the map here IS wanted, since
  // granting location is itself a deliberate "show me where I am" action, not an incidental
  // filter/select side effect — and it flies in every time this fires (first grant AND every
  // later press of the locate button below), not just once, since re-pressing "recalibrate"
  // is the user explicitly asking to be zoomed back in on their spot
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!userLocation) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      return
    }
    const latlng = [userLocation.lat, userLocation.lon]
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latlng, {
        icon: userLocationIcon(),
        zIndexOffset: 1000,
        interactive: false,
        keyboard: false,
      }).addTo(map)
    } else {
      userMarkerRef.current.setLatLng(latlng)
    }

    // when userLocation arrives from the interview handoff, it's present on the very
    // first render — this effect fires in the same commit as the map's own creation,
    // before Leaflet has necessarily measured a real (non-zero) container size yet.
    // flyTo's animation math on a zero-size map throws "Invalid LatLng object: (NaN,
    // NaN)" and keeps re-throwing on every subsequent animation frame. A live
    // geolocation grant never hit this — it always resolves well after mount, once the
    // container is already properly sized. invalidateSize() alone isn't enough (it can
    // still measure 0×0 if the browser hasn't laid out the container yet at this exact
    // point), so this polls via requestAnimationFrame until the map actually reports a
    // real size before flying, capped so a genuinely-broken layout can't spin forever.
    let attempts = 0
    let cancelled = false
    function flyOnceSized() {
      if (cancelled) return
      map.invalidateSize()
      const { x, y } = map.getSize()
      if (x > 0 && y > 0) {
        map.flyTo(latlng, 11, { animate: true, duration: 1.2 })
        return
      }
      // genuinely-broken layout safety valve: give up on the fly-in rather than call
      // flyTo on a still-zero-size map and hit the same crash this whole guard exists
      // to prevent. The marker is already placed above either way.
      if (attempts >= 20) return
      attempts += 1
      requestAnimationFrame(flyOnceSized)
    }
    flyOnceSized()
    return () => {
      cancelled = true
    }
  }, [userLocation])

  return (
    <div className="opp-map-pane">
      <div className="opp-map-badge">All {opportunities.length} shown on map</div>
      <div ref={containerRef} className="opp-map-canvas" />
      {onRequestLocation && (
        <button
          type="button"
          className={`opp-map-locate ${locationStatus === 'loading' ? 'is-loading' : ''} ${userLocation ? 'is-active' : ''}`}
          onClick={onRequestLocation}
          disabled={locationStatus === 'loading'}
          title="Show my location"
          aria-label="Show my location on the map"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path
              d="M12 1.5v3.4M12 19.1v3.4M1.5 12h3.4M19.1 12h3.4"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
