// Hand-drawn glyph set for the interview — deliberately NOT platform emoji (inconsistent
// across OS/browser, cartoonish, off-brand). Every glyph is a single flat currentColor
// shape sized by its parent, so it picks up whatever category color the badge around it
// is already using. A couple of math/science ones lean on the same plain-text-symbol
// trick SymbolField.jsx uses elsewhere on the site (Σ, ∫) rather than drawing a shape
// that wouldn't read clearly at icon size.

const GLYPHS = {
  dna: (
    <path
      d="M7 3.5c0 2.7 10 2.7 10 5.5s-10 2.8-10 5.5 10 2.7 10 5.5M8 6.3h8M7.4 9h9.2M7.4 15h9.2M8 17.7h8"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  ),
  stethoscope: (
    <path
      d="M7 4v5.2a3.8 3.8 0 0 0 7.6 0V4M14.6 9.2v2a4.4 4.4 0 0 0 8.8 0v-.7"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    />
  ),
  brain: (
    <>
      <path
        d="M12 4.2c-2.9 0-4.9 1.9-4.9 4.6 0 .9.2 1.6.7 2.3-.5.7-.7 1.5-.7 2.4 0 2.5 1.9 4.5 4.4 4.5h1c2.5 0 4.4-2 4.4-4.5 0-.9-.2-1.7-.7-2.4.5-.7.7-1.4.7-2.3 0-2.7-2-4.6-4.9-4.6Z"
        fill="currentColor"
      />
      <path d="M12 5.6v12.2" stroke="var(--cream)" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  flask: (
    <path
      d="M10 3h4M10.5 3v5.6L5.8 17a2 2 0 0 0 1.7 3h9a2 2 0 0 0 1.7-3l-4.7-8.4V3M7.6 14.5h8.8"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  laptop: (
    <path
      d="M5 5.5h14a1 1 0 0 1 1 1V16H4V6.5a1 1 0 0 1 1-1ZM2.5 19h19"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  atom: (
    <>
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
    </>
  ),
  wrench: (
    <path
      d="M14.8 6.2a4.1 4.1 0 0 0-5.4 5.4L4 17l3 3 5.4-5.4a4.1 4.1 0 0 0 5.4-5.4l-2.7 2.7-2.3-2.3Z"
      fill="currentColor"
    />
  ),
  mathSymbol: (
    <text x="12" y="17.5" fontSize="16" fontFamily="Iowan Old Style, Palatino, Georgia, serif" fontWeight="700" textAnchor="middle" fill="currentColor">
      Σ
    </text>
  ),
  integralSymbol: (
    <text x="12" y="17.5" fontSize="17" fontFamily="Iowan Old Style, Palatino, Georgia, serif" fontWeight="700" textAnchor="middle" fill="currentColor">
      ∫
    </text>
  ),
  leaf: (
    <path
      d="M19 5c-8 0-13 4-13 11 0 1.4.3 2.6.8 3.5C8 14 11.5 10.5 16 8.5c-4.2 2.6-6.8 6-7.8 9.2.6.2 1.2.3 1.8.3 7 0 9-6 9-13Z"
      fill="currentColor"
    />
  ),
  barChart: (
    <path d="M5 19V11M11 19V5M17 19v-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  ),
  flag: (
    <path d="M6 3v18M6 4.5h13l-3.5 4L19 12.5H6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.3 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.3-4-8.5s1.4-6.2 4-8.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  briefcase: (
    <path
      d="M4 8.5h16a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1ZM8.5 8.5V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v2.5M3 13h18"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
    />
  ),
  scale: (
    <path
      d="M12 3.5v17M7 4.5h10M4 8.5l3.5-4L11 8.5M20 8.5l-3.5-4L13 8.5M4 8.5a3.5 3.5 0 0 0 7 0M13 8.5a3.5 3.5 0 0 0 7 0M8 20.5h8"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  ),
  microbe: (
    <>
      <circle cx="12" cy="12" r="5.5" fill="currentColor" />
      <circle cx="12" cy="4.5" r="1.3" fill="currentColor" />
      <circle cx="19.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="19.5" r="1.3" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="var(--cream)" />
    </>
  ),
  clipboard: (
    <path
      d="M9 3.5h6a1 1 0 0 1 1 1V6h1.5a1 1 0 0 1 1 1v12.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H8V4.5a1 1 0 0 1 1-1ZM9 9.5h6M9 13h6M9 16.5h4"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  cube: (
    <path
      d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5ZM4 8l8 4.5M20 8l-8 4.5M12 12.5v8"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
    />
  ),
  magnifier: (
    <path
      d="M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM19.5 19.5 15 15"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    />
  ),
  lock: (
    <path
      d="M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM8 11V8a4 4 0 0 1 8 0v3M12 15.2v2"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
    />
  ),
  robot: (
    <path
      d="M9 3.5v2.3M4.5 9h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM9 13.2v1.6M15 13.2v1.6M9 17.3h6"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    />
  ),
  calendar: (
    <path
      d="M4.5 5.5h15a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1ZM8 3.5v4M16 3.5v4M3.5 10h17"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  refresh: (
    <path
      d="M4 12a8 8 0 1 1 2.5 5.8M4 17v-5h5"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  ),
  sprout: (
    <path
      d="M12 21v-9M12 12C12 7 8 6 5 6c0 4.5 2.7 6.3 7 6ZM12 9c0-3.5 2.8-4.5 5.5-4.5C17.5 8 15 9.5 12 9Z"
      fill="currentColor"
    />
  ),
  trophy: (
    <path
      d="M7 4h10v4.5a5 5 0 0 1-10 0V4ZM7 5.5H4v1.7A3.5 3.5 0 0 0 7 10.6M17 5.5h3v1.7a3.5 3.5 0 0 1-3 3.4M12 13.5v3.5M9 20.5h6M8.5 20.5c0-2 1.5-3 3.5-3s3.5 1 3.5 3"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  dollarCoin: (
    <path
      d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 7v10M15 9.3c0-1.3-1.3-2.1-3-2.1s-3 .8-3 2s2 1.6 3 1.9c1.5.4 3 .8 3 2.2s-1.3 2.1-3 2.1-3-.8-3-2.1"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  either: (
    <>
      <circle cx="9" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </>
  ),
  pin: (
    <path d="M12 2.5c-4 0-7 3-7 7 0 5.3 7 12 7 12s7-6.7 7-12c0-4-3-7-7-7Z" fill="currentColor" />
  ),
  schoolBuilding: (
    <path
      d="M12 3 3 7.5 12 12l9-4.5ZM6 10v6.5c0 1.6 2.7 3 6 3s6-1.4 6-3V10"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  gradCap: (
    <path
      d="M12 5 3 9.5 12 14l9-4.5ZM7 11.6V16c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-4.4M20.5 9.9v4.6"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    />
  ),
  party: (
    <path
      d="M4 20 15 9M6.5 4.5 5 6M11 3.5 9.8 5.2M3.5 9l1.7-1.2M16 7l3.5-1M19 4.5l1.5 3.5M15 4l1 3M9 16l2 2M13 12l2 2"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
    />
  ),
  priceTag: (
    <>
      <path
        d="M20.5 12.3 12.7 20a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8L11.7 3.5H18a2.5 2.5 0 0 1 2.5 2.5v6.3Z"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="15.7" cy="8.3" r="1.3" fill="currentColor" />
    </>
  ),
}

export default function Glyph({ name, size = 26 }) {
  const content = GLYPHS[name] || GLYPHS.magnifier
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {content}
    </svg>
  )
}
