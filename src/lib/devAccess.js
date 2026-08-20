/**
 * Casual-visitor deterrence for the in-progress prototype routes (/interview,
 * /opportunities), NOT real access control. This check runs entirely in the browser and
 * the passphrase ships in the JS bundle, so anyone who opens devtools can read it in
 * plain text — that's true no matter how it's obfuscated client-side. It exists only to
 * stop a random visitor from stumbling onto unfinished pages before launch (the actual
 * stated goal here: letting a cofounder test without a public release), not to protect
 * anything sensitive. If this ever needs to gate something that actually matters, it has
 * to move server-side (e.g. a Supabase-backed check), full stop.
 */

const STORAGE_KEY = 'rsly_dev_unlocked'
const PASSPHRASE = 'real1sprevailREESEARCHLY'

export function isDevUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function tryUnlock(input) {
  if (input !== PASSPHRASE) return false
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // localStorage unavailable (private browsing etc) — unlock still works for this
    // session via the in-memory state the caller holds, just won't persist on reload
  }
  return true
}
