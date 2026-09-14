// Deadline-reminder calendar helpers: a Google Calendar deep link, an Outlook Web deep
// link, and a downloadable .ics file (used for Apple Calendar and any other app). There
// is no calendar OAuth in this project — these only ever hand the browser a pre-filled
// event to add on the user's own say-so; nothing is read from or written to a real
// calendar account, and removing a Researchly reminder never touches one either.

const MONTH_ABBR = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
const DAY_MS = 24 * 60 * 60 * 1000

// "2026-04-15" -> {y:2026, m:4, d:15}, parsed manually rather than via `new Date(iso)`
// (which reads as UTC midnight and can land on the wrong local day) — the data only ever
// carries a plain date, never a time, so every event built from this is an all-day event.
export function parseDeadlineParts(iso) {
  if (typeof iso !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  return { y, m, d }
}

export function deadlineToDate(iso) {
  const parts = parseDeadlineParts(iso)
  if (!parts) return null
  return new Date(parts.y, parts.m - 1, parts.d)
}

export function formatDeadlineLong(iso) {
  const parts = parseDeadlineParts(iso)
  if (!parts) return iso || ''
  return `${MONTH_ABBR[parts.m - 1]} ${parts.d}, ${parts.y}`
}

// whole days between today (local midnight) and the deadline — negative once it's passed
export function daysUntil(iso) {
  const date = deadlineToDate(iso)
  if (!date) return null
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((date - todayMidnight) / DAY_MS)
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function icsDateStamp({ y, m, d }) {
  return `${y}${pad2(m)}${pad2(d)}`
}

// all-day events use an EXCLUSIVE end date in the Google/Outlook link formats and in the
// .ics spec alike, so the end is always "the day after," never the deadline day itself
function nextDayParts({ y, m, d }) {
  const next = new Date(y, m - 1, d + 1)
  return { y: next.getFullYear(), m: next.getMonth() + 1, d: next.getDate() }
}

function eventTitle(o) {
  return `${o.name} — Application Deadline`
}

function eventDescription(o, pageUrl) {
  return `Application deadline for ${o.name} (${o.org}).\n\nAdded from Researchly: ${pageUrl}`
}

export function buildGoogleCalendarUrl(o, pageUrl) {
  const parts = parseDeadlineParts(o.deadline)
  if (!parts) return null
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(o),
    dates: `${icsDateStamp(parts)}/${icsDateStamp(nextDayParts(parts))}`,
    details: eventDescription(o, pageUrl),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildOutlookWebUrl(o, pageUrl) {
  const parts = parseDeadlineParts(o.deadline)
  if (!parts) return null
  const day = `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}`
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: eventTitle(o),
    startdt: day,
    enddt: day,
    allday: 'true',
    body: eventDescription(o, pageUrl),
  })
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`
}

function icsEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildIcsContent(o, pageUrl) {
  const parts = parseDeadlineParts(o.deadline)
  if (!parts) return null
  const stamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Researchly//Deadline Reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${o.id}-deadline@researchly.space`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDateStamp(parts)}`,
    `DTEND;VALUE=DATE:${icsDateStamp(nextDayParts(parts))}`,
    `SUMMARY:${icsEscape(eventTitle(o))}`,
    `DESCRIPTION:${icsEscape(eventDescription(o, pageUrl))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// triggers a browser download of the .ics file — the fallback for Apple Calendar and
// "any other calendar app", both of which open a downloaded .ics directly
export function downloadIcs(o, pageUrl) {
  const content = buildIcsContent(o, pageUrl)
  if (!content) return false
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${o.id}-deadline.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
