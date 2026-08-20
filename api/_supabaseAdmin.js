import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client, using the service-role key — never imported by any file
// under src/ (which would ship it to the browser). This is what lets the anon key's own
// INSERT privilege be revoked entirely (see supabase/lockdown.sql): once that's done,
// this admin client is the ONLY way any row ever gets written to waitlist/contact_messages,
// which means every write is forced through the rate-limited endpoints below instead of
// being reachable by anyone who extracts the public anon key from the JS bundle.
//
// Reuses the same project URL the client already ships (VITE_SUPABASE_URL isn't secret —
// Supabase's own design is that protection comes from RLS/grants, not from hiding the
// URL). SUPABASE_SERVICE_ROLE_KEY is the one new, genuinely secret value this needs —
// set it in Vercel's Environment Variables, NOT prefixed with VITE_.

let cached = null

export function getSupabaseAdmin() {
  if (cached) return cached
  const url = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  cached = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  return cached
}
