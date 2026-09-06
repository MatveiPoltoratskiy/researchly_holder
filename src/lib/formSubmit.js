/**
 * Posts to the rate-limited serverless endpoint that fronts the contact_messages table
 * (see api/submit-contact.js) instead of writing to Supabase directly from the browser —
 * see supabase/lockdown.sql for why that move matters (it's what lets the public anon
 * key's INSERT privilege be revoked entirely).
 */

async function postJson(path, body) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  } catch {
    return { ok: false, data: {} }
  }
}

export function submitContact({ name, email, subject, message, hp }) {
  return postJson('/api/submit-contact', { name, email, subject, message, hp })
}
