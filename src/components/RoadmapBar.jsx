import { useState } from 'react'
import { useRoadmapProgress } from '../lib/roadmapProgress'

// a filled/outline check circle, reused per stage node — same visual language as the
// interview's own OptionCheck (filled circle + white check once done) rather than
// inventing a new "completed" affordance
function StageNode({ stage, status }) {
  // status: 'done' | 'current' | 'upcoming'
  return (
    <div className={`roadmap-node roadmap-node--${status}`}>
      <span className="roadmap-node-dot" aria-hidden="true">
        {status === 'done' ? (
          <svg width="10" height="8" viewBox="0 0 10 8">
            <path
              d="M1 4.2 3.6 6.8 9 1.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : status === 'current' ? (
          <span className="roadmap-node-dot-core" />
        ) : null}
      </span>
      <span className="roadmap-node-label">{stage.label}</span>
    </div>
  )
}

/**
 * Compact, persistent progress layer — sits at the top of the opportunities page, not
 * a separate app. Collapsed by default (just the 5-stage track + % complete, matching
 * the brief's "without pushing existing opportunity content unnecessarily far down");
 * clicking it reveals the current stage's milestone checklist inline, then collapses
 * back down rather than staying permanently expanded and eating vertical space.
 */
export default function RoadmapBar() {
  const { stages, currentStageIndex, currentStage, percentComplete, toggleManualMilestone } = useRoadmapProgress()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="roadmap-bar">
      <button
        type="button"
        className="roadmap-bar-summary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="roadmap-bar-title">
          Your Research Roadmap
          <span className="roadmap-bar-current">Current step: {currentStage.label}</span>
        </span>

        <span className="roadmap-track" aria-hidden="true">
          {stages.map((stage, i) => {
            const status = i < currentStageIndex ? 'done' : i === currentStageIndex ? 'current' : 'upcoming'
            return (
              <span className="roadmap-track-item" key={stage.id}>
                {i > 0 && <span className={`roadmap-track-line ${i <= currentStageIndex ? 'is-filled' : ''}`} />}
                <StageNode stage={stage} status={status} />
              </span>
            )
          })}
        </span>

        <span className="roadmap-bar-pct">
          {percentComplete}% complete
          <svg
            className={`roadmap-chevron ${expanded ? 'is-open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <use href="#icon-chevron-down" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="roadmap-milestones">
          <div className="roadmap-milestones-head">{currentStage.label} milestones</div>
          <ul className="roadmap-milestone-list">
            {currentStage.milestones.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`roadmap-milestone-row ${m.done ? 'is-done' : ''} ${m.auto ? 'is-auto' : ''}`}
                  onClick={() => !m.auto && toggleManualMilestone(m.id)}
                  disabled={Boolean(m.auto)}
                  title={m.auto ? 'Tracked automatically from what you do on Researchly' : undefined}
                >
                  <span className="roadmap-milestone-check" aria-hidden="true">
                    {m.done && (
                      <svg width="9" height="7" viewBox="0 0 10 8">
                        <path
                          d="M1 4.2 3.6 6.8 9 1.2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
