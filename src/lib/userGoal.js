import { useLocalStorageState } from './storage'

const STORAGE_KEY = 'rsly_user_goal'

// reuses the same hand-drawn glyph set as the interview (InterviewIcons.jsx) rather than
// platform emoji — same reasoning as that file: consistent across OS/browser, on-brand
export const GOALS = [
  { id: 'experience', label: 'Get research experience', glyph: 'magnifier' },
  { id: 'mentor', label: 'Find a research mentor', glyph: 'target' },
  { id: 'independent-project', label: 'Complete an independent research project', glyph: 'clipboard' },
  { id: 'science-fair', label: 'Win a science fair', glyph: 'trophy' },
  { id: 'major-competition', label: 'Compete at a major science competition', glyph: 'flag' },
  { id: 'portfolio', label: 'Build a strong research portfolio', glyph: 'briefcase' },
]
export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g]))

/** Single-select — "a larger research goal," not a list of goals. Null until chosen. */
export function useUserGoal() {
  const [goalId, setGoalId] = useLocalStorageState(STORAGE_KEY, null)
  return [goalId, setGoalId]
}
