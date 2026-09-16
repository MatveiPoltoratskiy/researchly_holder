import { useMemo, useState } from 'react'
import { Link } from '../lib/router'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'
import { useSavedOpportunities, SAVE_STATUSES } from '../lib/savedOpportunities'
import { useDeadlineReminders } from '../lib/deadlineReminders'
import { daysUntil } from '../lib/calendarEvent'
import { deadlineCellLabel } from '../lib/deadlineStatus'
import { useDeadlineCountdown } from '../lib/useDeadlineCountdown'
import CalendarPickerModal from './CalendarPickerModal'
import { OpportunityCard, OpportunityDetailModal, recommendTagFor } from './OpportunityExplorer'

const OPP_BY_ID = new Map(CANADA_OPPORTUNITIES.map((o) => [o.id, o]))
const STATUS_ORDER = SAVE_STATUSES.map((s) => s.id)

// deadline-reminder entries sort soonest-first, with anything already past pushed below
// every still-active one (most-recently-passed first within that group) — and anything
// whose deadline isn't confirmed yet (daysUntil -> null) pushed below even that, since
// there's no date to rank it by; alphabetical among themselves for a stable order
function sortDeadlineEntries(entries) {
  const groupOf = (days) => (days === null ? 2 : days < 0 ? 1 : 0)
  return [...entries].sort((a, b) => {
    const da = daysUntil(a.o.deadline)
    const db = daysUntil(b.o.deadline)
    const ga = groupOf(da)
    const gb = groupOf(db)
    if (ga !== gb) return ga - gb
    if (ga === 2) return a.o.name.localeCompare(b.o.name)
    return ga === 1 ? db - da : da - db
  })
}

// compact row for the Deadlines tab — deliberately not a full OpportunityCard (no blurb,
// tags, or match score here; just what you need to triage an approaching deadline). Clicking
// the row opens the same detail modal every other list uses. The calendar icon is the only
// place the Google/Apple/Outlook/.ics picker lives now — adding to this tab (the bell, on
// any card) is a one-click, no-picker action, so exporting to a real calendar is a deliberate
// second step, not a requirement for just tracking a deadline here.
function DeadlineCard({ o, reminders, onOpenDetail, onOpenCalendarPicker }) {
  const countdown = useDeadlineCountdown(o.deadline)
  const isRolling = !o.deadline && o.deadlineStatus === 'rolling'
  const isClosed = !o.deadline && !isRolling && o.applicationStatus === 'closed'
  const dateLabel = deadlineCellLabel(o)
  const countdownLabel = isRolling ? 'Rolling' : isClosed ? 'Closed' : countdown.label
  const countdownCls = isRolling ? 'is-rolling' : isClosed ? 'is-closed' : countdown.cls
  const hasCalendar = Boolean(reminders.remindersMap[o.id]?.calendar)

  return (
    <article className={`deadline-card ${countdown.isPast || isClosed ? 'is-past' : ''}`}>
      <button type="button" className="deadline-card-main" onClick={() => onOpenDetail(o.id)}>
        <span className="deadline-card-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24"><use href="#icon-calendar" /></svg>
        </span>
        <span className="deadline-card-info">
          <span className="deadline-card-name">{o.name}</span>
          <span className="deadline-card-org">{o.org}</span>
        </span>
        <span className="deadline-card-date">{dateLabel}</span>
        <span className={`deadline-card-countdown ${countdownCls}`}>{countdownLabel}</span>
      </button>
      <button
        type="button"
        className={`deadline-card-calendar ${hasCalendar ? 'has-calendar' : ''}`}
        onClick={() => o.deadline && onOpenCalendarPicker(o.id)}
        disabled={!o.deadline}
        aria-label={hasCalendar ? 'Change calendar' : 'Add to calendar'}
        title={o.deadline ? (hasCalendar ? 'Change calendar' : 'Add to calendar') : 'Available once the deadline is confirmed'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <use href="#icon-calendar" />
        </svg>
      </button>
      <button
        type="button"
        className="deadline-card-remove"
        onClick={() => reminders.remove(o.id)}
        aria-label="Remove from Deadlines tab"
        title="Remove from Deadlines tab"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </article>
  )
}

/**
 * The "My Opportunities" pipeline page — a simple stacked list of saved opportunities
 * with a lightweight status filter, deliberately NOT a kanban board per the brief.
 * Reuses OpportunityCard/OpportunityDetailModal as-is so a saved card never drifts
 * visually out of sync with the main discovery page.
 */
export default function MyOpportunities() {
  const saved = useSavedOpportunities()
  const reminders = useDeadlineReminders()
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailId, setDetailId] = useState(null)
  const [reminderPickerId, setReminderPickerId] = useState(null)

  const savedEntries = useMemo(() => {
    const entries = Object.entries(saved.savedMap)
      .map(([id, status]) => ({ id, status, o: OPP_BY_ID.get(id) }))
      .filter((entry) => entry.o)
    entries.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    return entries
  }, [saved.savedMap])

  const deadlineEntries = useMemo(() => {
    const entries = Object.keys(reminders.remindersMap)
      .map((id) => ({ id, o: OPP_BY_ID.get(id) }))
      .filter((entry) => entry.o)
    return sortDeadlineEntries(entries)
  }, [reminders.remindersMap])

  const visibleEntries =
    statusFilter === 'all' || statusFilter === 'deadlines'
      ? savedEntries
      : savedEntries.filter((entry) => entry.status === statusFilter)

  const detailOpportunity = detailId ? OPP_BY_ID.get(detailId) : null
  const reminderPickerOpportunity = reminderPickerId ? OPP_BY_ID.get(reminderPickerId) : null

  return (
    <section className="opp-explorer opp-fixed-page myopp-page">
      <div className="container opp-container opp-container--fill myopp-container">
        <Link className="myopp-back-link" to="/opportunities">
          <svg className="myopp-back-arrow" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <use href="#icon-arrow" />
          </svg>
          All opportunities
        </Link>

        <div className="opp-header myopp-header">
          <h1 className="opp-heading myopp-heading">
            My <span className="myopp-heading-accent">Opportunities</span>
          </h1>
          <p className="myopp-subtext">Keep track of the opportunities you're considering and applying to.</p>
        </div>

        <div className="myopp-status-row">
          <button
            type="button"
            className={`myopp-status-btn ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
            <span className="myopp-status-count">{saved.totalSaved}</span>
          </button>
          {SAVE_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`myopp-status-btn ${statusFilter === s.id ? 'is-active' : ''}`}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
              <span className="myopp-status-count">{saved.countsByStatus[s.id] || 0}</span>
            </button>
          ))}
          <button
            type="button"
            className={`myopp-status-btn ${statusFilter === 'deadlines' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('deadlines')}
          >
            Deadlines
            <span className="myopp-status-count">{reminders.totalReminders}</span>
          </button>
        </div>

        <div className="myopp-scroll">
          {statusFilter === 'deadlines' ? (
            deadlineEntries.length === 0 ? (
              <div className="opp-empty">
                No deadline reminders yet. Tap the bell icon on any opportunity to track it here.
              </div>
            ) : (
              <div className="deadline-list">
                {deadlineEntries.map((entry) => (
                  <DeadlineCard
                    key={entry.id}
                    o={entry.o}
                    reminders={reminders}
                    onOpenDetail={setDetailId}
                    onOpenCalendarPicker={setReminderPickerId}
                  />
                ))}
              </div>
            )
          ) : visibleEntries.length === 0 ? (
            <div className="opp-empty">
              {saved.totalSaved === 0
                ? "You haven't saved any opportunities yet. Browse the list and tap Save on anything worth a second look."
                : 'Nothing in this status yet.'}
            </div>
          ) : (
            <div className="opp-list myopp-list">
              {visibleEntries.map((entry) => (
                <OpportunityCard
                  key={entry.id}
                  o={entry.o}
                  selected={false}
                  onSelect={() => {}}
                  onOpenDetail={setDetailId}
                  recommendTag={recommendTagFor(entry.o)}
                  saved={saved}
                  reminders={reminders}
                  mapContext={false}
                />
              ))}
            </div>
          )}
        </div>

        <p className="myopp-privacy-note">
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
            <use href="#icon-lock" />
          </svg>
          Only you can see your saved opportunities.
        </p>
      </div>

      {detailOpportunity && (
        <OpportunityDetailModal
          o={detailOpportunity}
          onClose={() => setDetailId(null)}
          saved={saved}
          reminders={reminders}
        />
      )}

      {reminderPickerOpportunity && (
        <CalendarPickerModal
          o={reminderPickerOpportunity}
          pageUrl={`${window.location.origin}/opportunities`}
          onClose={() => setReminderPickerId(null)}
          onPicked={(calendar) => {
            reminders.add(reminderPickerId, calendar)
            setReminderPickerId(null)
          }}
        />
      )}
    </section>
  )
}
