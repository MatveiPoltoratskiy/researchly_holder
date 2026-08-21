import { useMemo, useState } from 'react'
import { Link } from '../lib/router'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'
import { useSavedOpportunities, SAVE_STATUSES } from '../lib/savedOpportunities'
import { useUserInterests } from '../lib/userInterests'
import { useUserGoal } from '../lib/userGoal'
import { OpportunityCard, OpportunityDetailModal, recommendTagFor } from './OpportunityExplorer'

const OPP_BY_ID = new Map(CANADA_OPPORTUNITIES.map((o) => [o.id, o]))
const STATUS_ORDER = SAVE_STATUSES.map((s) => s.id)

/**
 * The "My Opportunities" pipeline page — a simple stacked list of saved opportunities
 * with a lightweight status filter, deliberately NOT a kanban board per the brief.
 * Reuses OpportunityCard/OpportunityDetailModal as-is so a saved card never drifts
 * visually out of sync with the main discovery page.
 */
export default function MyOpportunities() {
  const saved = useSavedOpportunities()
  const interests = useUserInterests()
  const [goalId] = useUserGoal()
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailId, setDetailId] = useState(null)

  // no interview/geolocation context on this page, so the profile only carries the two
  // signals this page itself can set — still keeps the score consistent with the main list
  const matchProfile = useMemo(() => ({ interestIds: interests.interestIds, goalId }), [interests.interestIds, goalId])

  const savedEntries = useMemo(() => {
    const entries = Object.entries(saved.savedMap)
      .map(([id, status]) => ({ id, status, o: OPP_BY_ID.get(id) }))
      .filter((entry) => entry.o)
    entries.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    return entries
  }, [saved.savedMap])

  const visibleEntries =
    statusFilter === 'all' ? savedEntries : savedEntries.filter((entry) => entry.status === statusFilter)

  const detailOpportunity = detailId ? OPP_BY_ID.get(detailId) : null

  return (
    <section className="opp-explorer opp-fixed-page myopp-page">
      <div className="container opp-container opp-container--fill myopp-container">
        <Link className="myopp-back-link" to="/opportunities">
          <svg className="myopp-back-arrow" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <use href="#icon-arrow" />
          </svg>
          All opportunities
        </Link>

        <div className="opp-header myopp-header">
          <h1 className="opp-heading myopp-heading">My Opportunities</h1>
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
        </div>

        <div className="myopp-scroll">
          {visibleEntries.length === 0 ? (
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
                  matchProfile={matchProfile}
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
          matchProfile={matchProfile}
          saved={saved}
        />
      )}
    </section>
  )
}
