import { useCallback } from 'react'
import { useLocalStorageState } from './storage'

const STORAGE_KEY = 'rsly_user_interests'
export const MAX_INTERESTS = 3

/**
 * Up to 3 majors/fields, used to personalize the match score's "interest" factor and
 * the "why it matches" bullets. Deliberately capped rather than open-ended: a student
 * who checks every box gets a match score that means nothing (everything "matches"),
 * and the cap is the whole reason the picker needs its own disclaimer in the UI.
 */
export function useUserInterests() {
  const [interestIds, setInterestIds] = useLocalStorageState(STORAGE_KEY, [])

  const toggle = useCallback(
    (fieldId) => {
      setInterestIds((prev) => {
        if (prev.includes(fieldId)) return prev.filter((id) => id !== fieldId)
        if (prev.length >= MAX_INTERESTS) return prev
        return [...prev, fieldId]
      })
    },
    [setInterestIds]
  )

  return { interestIds, toggle, atLimit: interestIds.length >= MAX_INTERESTS }
}
