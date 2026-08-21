import { useCallback, useMemo } from 'react'
import { ROADMAP_STAGES } from '../data/roadmap'
import { useLocalStorageState } from './storage'
import { useSavedOpportunities } from './savedOpportunities'
import { useUserGoal } from './userGoal'
import { useUserInterests } from './userInterests'
import { hasCompletedInterview, hasBrowsedOpportunities, viewedOpportunityCount } from './activityTracking'

const MANUAL_STORAGE_KEY = 'rsly_roadmap_manual_milestones'

// maps a milestone's `auto` key (declared in src/data/roadmap.js) to a real, checkable
// fact elsewhere in the app — the single place that connects "the roadmap" to "what the
// student actually did." Adding a new auto-milestone later means adding one line here,
// not touching the roadmap UI.
function evaluateAutoFlags({ totalSaved, appliedCount, interestIds, goalId }) {
  return {
    'interview-done': hasCompletedInterview(),
    browsed: hasBrowsedOpportunities(),
    'has-interests': interestIds.length > 0,
    'has-goal': Boolean(goalId),
    'viewed-5': viewedOpportunityCount() >= 5,
    'saved-1': totalSaved >= 1,
    'saved-3': totalSaved >= 3,
    'applied-1': appliedCount >= 1,
  }
}

/**
 * The one hook every roadmap-aware piece of UI should use — returns fully-resolved
 * stages (each milestone tagged `done`), the current stage (first incomplete one, or
 * the last stage if everything's done), and overall percent complete. Manual
 * milestones persist as a flat { [milestoneId]: true } map; auto milestones are
 * recomputed live from the other features' own state every render, never stored
 * redundantly (so saving/unsaving an opportunity updates the roadmap immediately,
 * with no separate "sync" step that could drift out of date).
 */
export function useRoadmapProgress() {
  const [manualDone, setManualDone] = useLocalStorageState(MANUAL_STORAGE_KEY, {})
  const { totalSaved, countsByStatus } = useSavedOpportunities()
  const [goalId] = useUserGoal()
  const { interestIds } = useUserInterests()

  const autoFlags = useMemo(
    () => evaluateAutoFlags({ totalSaved, appliedCount: countsByStatus.applied, interestIds, goalId }),
    [totalSaved, countsByStatus.applied, interestIds, goalId]
  )

  const stages = useMemo(() => {
    return ROADMAP_STAGES.map((stage) => {
      const milestones = stage.milestones.map((m) => ({
        ...m,
        done: m.auto ? Boolean(autoFlags[m.auto]) : Boolean(manualDone[m.id]),
      }))
      const doneCount = milestones.filter((m) => m.done).length
      return { ...stage, milestones, doneCount, total: milestones.length, complete: doneCount === milestones.length }
    })
  }, [autoFlags, manualDone])

  const currentStageIndex = useMemo(() => {
    const firstIncomplete = stages.findIndex((s) => !s.complete)
    return firstIncomplete === -1 ? stages.length - 1 : firstIncomplete
  }, [stages])

  const percentComplete = useMemo(() => {
    const totalMilestones = stages.reduce((sum, s) => sum + s.total, 0)
    const totalDone = stages.reduce((sum, s) => sum + s.doneCount, 0)
    return totalMilestones ? Math.round((totalDone / totalMilestones) * 100) : 0
  }, [stages])

  const toggleManualMilestone = useCallback(
    (milestoneId) => {
      setManualDone((prev) => ({ ...prev, [milestoneId]: !prev[milestoneId] }))
    },
    [setManualDone]
  )

  return {
    stages,
    currentStageIndex,
    currentStage: stages[currentStageIndex],
    percentComplete,
    toggleManualMilestone,
  }
}
