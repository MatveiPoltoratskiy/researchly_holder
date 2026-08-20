/**
 * Real, server-verified access control for the in-progress prototype routes
 * (/interview, /opportunities) — not a client-side flag. The passphrase and signing
 * secret live only in Vercel's environment variables (see api/dev-unlock.js and
 * api/dev-verify.js); the browser only ever holds a signed session token it cannot
 * forge on its own, since it never has the secret used to sign one.
 *
 * This exists to keep the prototypes off the public internet before launch (so a
 * cofounder can test them), not to protect anything sensitive — it's proportionate to
 * that goal, not a general-purpose auth system.
 */

const STORAGE_KEY = 'rsly_dev_token'

function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeToken(token) {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // localStorage unavailable (private browsing etc) — access still works for the
    // current page load, just won't persist across a reload
  }
}

/** Asks the server whether the stored session token (if any) is still valid. */
export async function verifyDevAccess() {
  const token = getStoredToken()
  if (!token) return false
  try {
    const res = await fetch('/api/dev-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return !!data.valid
  } catch {
    return false
  }
}

/** Submits a passphrase for server-side verification; stores the token it returns. */
export async function unlockDevAccess(passphrase) {
  try {
    const res = await fetch('/api/dev-unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    })
    if (!res.ok) return false
    const data = await res.json()
    if (!data.token) return false
    storeToken(data.token)
    return true
  } catch {
    return false
  }
}
