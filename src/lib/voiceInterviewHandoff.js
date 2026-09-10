/**
 * Carries the parsed-from-speech partial answers from InterviewVoice.jsx over to
 * Interview.jsx. A plain module-level variable, not sessionStorage like
 * interviewHandoff.js — the transcript this was built from is closer to the professor
 * finder's "background" sensitivity than a filter set, so it gets the same "only ever
 * lives in memory for this tab" treatment. Read-once: consuming it clears it, so a
 * direct visit to /interview (nav, back button) never inherits stale voice answers from
 * an earlier attempt.
 */

let pending = null

export function setVoiceAnswers(answers) {
  pending = answers
}

export function consumeVoiceAnswers() {
  const answers = pending
  pending = null
  return answers
}
