/**
 * Posts to the rate-limited serverless endpoints that front the contact_messages and
 * feedback tables (see api/submit-contact.js, api/submit-feedback.js) instead of writing
 * to Supabase directly from the browser — see supabase/lockdown.sql and
 * supabase/feedback_setup.sql for why that move matters (it's what lets the public anon
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

export function submitFeedback({ rating, note, hp }) {
  return postJson('/api/submit-feedback', { rating, note, hp })
}
