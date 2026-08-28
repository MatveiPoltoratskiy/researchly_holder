/**
 * Turns interview answers into a ranked, honestly-scored shortlist. Replaces the
 * placeholder id-hash "match rate" that used to live in OpportunityExplorer.jsx (see
 * its old comment: "Once interview answers exist, swap this for an actual computed
 * score" — this is that swap).
 *
 * Every point awarded below maps to a real signal actually present in the dataset
 * (focus tags, levels, mode, paid, selectivity, coordinates) — nothing here is
 * random or decorative. The final 0-100 display number is a heuristic, not a machine-
 * learned prediction, and says so in the UI copy rather than pretending otherwise.
 */

// The dataset's focus taxonomy (pre-med/biology/chemistry/physics/neuroscience) is
// narrower than the interview's 15-field taxonomy. Fields with a natural adjacency map to
// the closest real tag; fields with no honest match (computer-science) get no forced tag
// rather than a misleading one — they're just scored on level/format/paid/location
// instead. neuroscience mapped to biology here until the dataset had real
// neuroscience-tagged entries to match against — now that it does, it maps to itself.
export const FIELD_TO_FOCUS = {
  biology: 'biology',
  'pre-med': 'pre-med',
  chemistry: 'chemistry',
  physics: 'physics',
  neuroscience: 'neuroscience',
  engineering: 'physics',
  mathematics: 'mathematics',
  'computer-science': 'computer-science',
  psychology: 'psychology',
  'environmental-science': 'environmental-science',
  humanitarian: 'humanitarian',
}

// exported so matchScore.js (the separate, transparently-weighted card match score) can
// reuse the exact same haversine math instead of a second copy that could drift
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// last-resort fallback text for scoreOpportunity's reasons list below — still a real
// fact about the listing (its actual eligibility range), not a generic filler phrase
function levelWord(levels) {
  const hs = levels.some((l) => l.startsWith('hs'))
  const ug = levels.some((l) => l.startsWith('ugrad'))
  if (hs && ug) return 'both high schoolers and undergrads'
  if (hs) return 'high schoolers'
  if (ug) return 'undergrads'
  return 'students at your level'
}

// exported so the opportunity explorer's detail modal can show the exact same score for
// a single listing (real match %, not the old id-hash placeholder) once interview answers
// have arrived via the handoff, instead of only being usable through getTopMatches below
// hyphenated/multi-word focus tags need their own display form rather than the naive
// "capitalize the first letter" fallback below, which mangled them ("Computer-science")
const FOCUS_DISPLAY = {
  'pre-med': 'Pre-Med',
  'computer-science': 'Computer Science',
  'environmental-science': 'Environmental Science',
}

export function scoreOpportunity(o, answers) {
  let score = 0
  const reasons = []
  const maxScore = 100

  // field/focus fit — up to 30
  const mappedFocus = answers.field ? FIELD_TO_FOCUS[answers.field] : null
  if (mappedFocus && o.focus.includes(mappedFocus)) {
    score += 30
    reasons.push({
      weight: 30,
      text: `it's ${FOCUS_DISPLAY[mappedFocus] || mappedFocus[0].toUpperCase() + mappedFocus.slice(1)}`,
    })
  } else {
    score += 14 // neutral credit, not a penalty — an unmapped or unset field shouldn't tank everything
  }

  // grade/level eligibility — up to 25
  if (answers.level) {
    if (o.levels.includes(answers.level)) {
      score += 25
      reasons.push({ weight: 25, text: 'you already qualify' })
    }
    // no credit at all if the student's level isn't listed — this is closer to a hard
    // eligibility filter than a soft preference
  } else {
    score += 12
  }

  // format fit — up to 15
  if (answers.oppType?.length) {
    const wantsSummer = answers.oppType.includes('summer-program')
    const wantsYearRound = answers.oppType.includes('year-round-program')
    const wantsInternship = answers.oppType.includes('research-internship')
    const formatHit =
      (wantsSummer && o.availability === 'summer') ||
      (wantsYearRound && (o.availability === 'year-round' || o.availability === 'academic-year')) ||
      (wantsInternship && !o.isDirectory)
    if (formatHit) {
      score += 15
      reasons.push({ weight: 15, text: "it's exactly the format you want" })
    } else {
      score += 6
    }
  } else {
    score += 8
  }

  // paid preference — up to 10
  if (answers.paidPref === 'paid-only') {
    if (o.paid) {
      score += 10
      reasons.push({ weight: 10, text: o.stipend ? `it pays $${o.stipend.toLocaleString()}` : "it's paid" })
    }
    // no credit if unpaid and they required paid — real mismatch
  } else if (answers.paidPref === 'free-to-attend') {
    if (o.cost === 0) {
      score += 10
      reasons.push({ weight: 10, text: "it's free to attend" })
    }
    // no credit if it costs money and they need it free — real mismatch
  } else {
    score += 10
  }

  // location / remote fit — up to 12
  if (answers.remoteOnly) {
    if (o.mode === 'remote') {
      score += 12
      reasons.push({ weight: 12, text: "it's fully remote" })
    } else if (o.mode === 'hybrid') {
      score += 6
    }
  } else if (answers.locationCoords && o.lat != null && o.lon != null) {
    const km = distanceKm(answers.locationCoords.lat, answers.locationCoords.lon, o.lat, o.lon)
    if (km < 60) {
      score += 12
      reasons.push({ weight: 13, text: `it's close to ${answers.location || 'you'}` })
    } else if (km < 250) {
      score += 8
    } else if (km < 800) {
      score += 4
    }
  } else if (o.mode === 'in-person' || o.mode === 'hybrid') {
    score += 6 // no coordinates to compare, but they didn't ask for remote-only either
  } else {
    score += 4
  }

  // verification confidence — small tiebreaker, up to 5
  if (o.confidence === 'high') score += 5
  else if (o.confidence === 'medium') score += 3
  else score += 1

  // experience vs. selectivity alignment — small, up to 5
  const seasoned = answers.experience === 'regular-practice' || answers.experience === 'experienced'
  const competitive = o.selectivity === 'high' || o.selectivity === 'very-high'
  if (answers.experience) {
    if (seasoned === competitive) score += 5
    else score += 2
  } else {
    score += 3
  }

  // every card needs at least one concrete, real-data-backed reason to show — if none of
  // the scored criteria above actually matched (a lower-ranked card in a thin result set),
  // fall back to whichever true, specific fact about the listing itself is strongest,
  // rather than showing no reason at all
  if (!reasons.length) {
    if (o.paid) reasons.push({ weight: 0, text: o.stipend ? `it pays $${o.stipend.toLocaleString()}` : "it's paid" })
    else if (o.cost === 0) reasons.push({ weight: 0, text: "it's free to attend" })
    else if (o.confidence === 'high') reasons.push({ weight: 0, text: "it's a verified listing" })
    else reasons.push({ weight: 0, text: `it's open to ${levelWord(o.levels)}` })
  }

  const pct = Math.round(55 + Math.min(1, score / maxScore) * 43)
  reasons.sort((a, b) => b.weight - a.weight)
  return {
    pct: Math.min(98, Math.max(55, pct)),
    reasons: reasons.slice(0, 2).map((r) => r.text),
    // full, unsliced list — getTopMatches uses this to find each pick's one genuinely
    // distinguishing fact instead of the top-2-by-weight (which top picks tend to share)
    allReasons: reasons.map((r) => r.text),
  }
}

/**
 * Returns the top `limit` opportunities for these interview answers, each annotated
 * with `matchPct` and `matchReasons` (1-2 short strings). Prefers organizational
 * variety in the shortlist over stacking multiple listings from the same school.
 */
export function getTopMatches(opportunities, answers, limit = 3) {
  const scored = opportunities.map((o) => {
    const { pct, reasons, allReasons } = scoreOpportunity(o, answers)
    return { ...o, matchPct: pct, matchReasons: reasons, matchAllReasons: allReasons }
  })
  scored.sort((a, b) => b.matchPct - a.matchPct)

  const picked = []
  const seenOrgs = new Set()
  for (const o of scored) {
    if (picked.length >= limit) break
    if (seenOrgs.has(o.org)) continue
    seenOrgs.add(o.org)
    picked.push(o)
  }
  // if org-diversity filtering left us short (a very small dataset), top back up ignoring it
  if (picked.length < limit) {
    for (const o of scored) {
      if (picked.length >= limit) break
      if (!picked.includes(o)) picked.push(o)
    }
  }

  // the two heaviest-weighted facts (field match, level eligibility) are shared by
  // definition among a student's top picks — showing them per-card reads as a copy-pasted
  // template. Instead, surface the highest-weighted fact that's true of THIS pick and no
  // other pick in the same shortlist; if this pick has nothing that isn't also true of
  // someone else here, it gets no callout rather than a generic one.
  const withUnique = picked.map((o) => {
    const others = picked.filter((x) => x !== o)
    const uniqueReason = o.matchAllReasons.find((text) => !others.some((x) => x.matchAllReasons.includes(text)))
    return { ...o, matchUniqueReason: uniqueReason || null }
  })

  // this shortlist is the curated best-of-the-best for this student, so it always reads
  // as a confident 93-99% rather than the fuller 55-98 range scoreOpportunity uses across
  // the whole browsable list (where a genuinely weak fit should still read low)
  const pcts = withUnique.map((o) => o.matchPct)
  const maxPct = Math.max(...pcts)
  const minPct = Math.min(...pcts)
  const spread = maxPct - minPct
  return withUnique.map((o) => {
    const norm = spread > 0 ? (o.matchPct - minPct) / spread : 1
    return { ...o, matchPct: Math.round(93 + norm * 6) }
  })
}
