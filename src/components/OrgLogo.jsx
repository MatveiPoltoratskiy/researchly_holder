import { useState } from 'react'

// Real category icons instead of a plain letter — matched off the org name, since we
// don't have actual company/hospital logo assets for these records yet.
export function iconForOrg(org = '') {
  const s = org.toLowerCase()
  if (/hospital|health(?!.*(institutes|research council))|sunnybrook|sickkids|baycrest|bloorview|sinai|clinic|centre for addiction/.test(s)) {
    return 'icon-building'
  }
  if (/university|college|department of|school of|cheriton/.test(s)) return 'icon-grad-cap'
  if (/nserc|cihr|mitacs|council|foundation|innovates|institutes of health/.test(s)) return 'icon-badge-check'
  return 'icon-flask'
}

// Real org logos, sourced live off each record's own domain via free favicon services —
// no per-record manual sourcing needed. (Clearbit's Logo API, the usual first choice for
// this, was discontinued and its domain no longer even resolves — checked directly before
// wiring this up.) Google's favicon service goes first since it's the most complete; DuckDuckGo
// is the second try; the category icon glyph is the final fallback if a domain has neither.
export function domainFromUrl(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Its own small leaf module — deliberately NOT part of OpportunityExplorer.jsx, even
// though that's where this used to live, because it's now also used from the homepage's
// featured-opportunities strip. Importing it from OpportunityExplorer.jsx would drag that
// whole module (map, matching, save/reminders state, ~1000+ lines) into the homepage's
// bundle just to render a logo; this file has no heavy dependencies of its own.
export function OrgLogo({ org, url, iconId }) {
  const domain = domainFromUrl(url)
  const [stage, setStage] = useState(domain ? 'google' : 'icon')

  if (stage === 'google') {
    return (
      <img
        className="opp-logo-img"
        src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`}
        alt={`${org} logo`}
        onError={() => setStage('duckduckgo')}
      />
    )
  }
  if (stage === 'duckduckgo') {
    return (
      <img
        className="opp-logo-img opp-logo-img--favicon"
        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
        alt={`${org} logo`}
        onError={() => setStage('icon')}
      />
    )
  }
  return (
    <svg width="20" height="20" aria-hidden="true">
      <use href={`#${iconId}`} />
    </svg>
  )
}
