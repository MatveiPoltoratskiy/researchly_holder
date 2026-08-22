import { useRef, useState } from 'react'
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
          <svg width="11" height="9" viewBox="0 0 10 8">
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
 * a separate app. Collapsed by default (just the stage track + % complete, matching
 * the brief's "without pushing existing opportunity content unnecessarily far down");
 * clicking it reveals the current stage's milestone checklist inline, then collapses
 * back down rather than staying permanently expanded and eating vertical space.
 *
 * The milestone panel stays in normal document flow (not a floating/absolute overlay)
 * deliberately: this page's shell (.opp-fixed-page) is position:fixed with
 * overflow:hidden, so an absolutely-positioned child here would get clipped the same
 * way the old Personalize-match popover did before it was rewired through a portal.
 * Rather than reintroduce that escape hatch for a milestone checklist, this just lets
 * .opp-layout (flex:1; min-height:0) absorb the extra height while expanded.
 */
export default function RoadmapBar() {
  const { stages, currentStageIndex, currentStage, percentComplete, toggleManualMilestone } = useRoadmapProgress()
  const [expanded, setExpanded] = useState(false)
  const summaryRef = useRef(null)

  function collapseAndRefocus() {
    setExpanded(false)
    summaryRef.current?.focus()
  }

  return (
    <div className={`roadmap-bar ${expanded ? 'is-expanded' : ''}`} style={{ '--pct': percentComplete }}>
      <button
        ref={summaryRef}
        type="button"
        className="roadmap-bar-summary"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && expanded) collapseAndRefocus()
        }}
        aria-expanded={expanded}
        aria-controls="roadmap-milestones"
      >
        <span className="roadmap-bar-mark" aria-hidden="true">
          <svg viewBox="0 0 60 60">
            <use href="#mascot-tiny" />
          </svg>
        </span>

        <span className="roadmap-bar-title">
          <span className="roadmap-bar-name">Your Research Roadmap</span>
          <span className="roadmap-bar-current">Current step: {currentStage.label}</span>
        </span>

        <span className="roadmap-track" aria-hidden="true">
          {stages.map((stage, i) => {
            const status = i < currentStageIndex ? 'done' : i === currentStageIndex ? 'current' : 'upcoming'
            return (
              <span className="roadmap-track-item" key={stage.id}>
                {i > 0 && (
                  <span
                    className={`roadmap-track-line ${i <= currentStageIndex ? 'is-filled' : ''} ${
                      i === currentStageIndex ? 'is-active' : ''
                    }`}
                  />
                )}
                <StageNode stage={stage} status={status} />
              </span>
            )
          })}
        </span>

        <span className="roadmap-bar-pct">
          <span className="roadmap-pct-value">{percentComplete}%</span>
          <span className="roadmap-pct-word">complete</span>
        </span>
        <span className="roadmap-chevron-well" aria-hidden="true">
          <svg className={`roadmap-chevron ${expanded ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24">
            <use href="#icon-chevron-down" />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="roadmap-milestones" id="roadmap-milestones">
          <div className="roadmap-milestones-head">{currentStage.label} milestones</div>
          <ul className="roadmap-milestone-list">
            {currentStage.milestones.map((m) =>
              m.auto ? (
                <li key={m.id}>
                  <div className={`roadmap-milestone-row is-auto ${m.done ? 'is-done' : ''}`}>
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
                    <span className="roadmap-milestone-auto" title="Tracked automatically from what you do on Researchly">
                      Auto
                    </span>
                  </div>
                </li>
              ) : (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`roadmap-milestone-row ${m.done ? 'is-done' : ''}`}
                    onClick={() => toggleManualMilestone(m.id)}
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
              )
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
