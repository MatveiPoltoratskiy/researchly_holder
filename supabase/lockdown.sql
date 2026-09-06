-- Run this NOW in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- ⚠ CONFIRMED STILL NEEDED as of the 2026-09-06 database/privacy audit: a live black-box
-- test against the production REST API (using the public anon key) found SELECT/UPDATE/
-- DELETE correctly blocked on both tables, but INSERT still succeeded (HTTP 201) — this
-- file was written earlier but never actually run. Right now, anyone can write directly
-- to both tables with zero rate limiting, zero validation, and zero honeypot check,
-- completely bypassing api/submit-contact.js. (The test inserted one throwaway row into
-- each table — email rls-probe-not-inserted@example.invalid — that this file's own
-- revokes will block you from cleaning up via the API afterward; delete both rows from
-- the Supabase Table Editor directly.)
--
-- What this does: revokes every privilege the public anon key had on these two tables
-- (the anon key is public by Supabase's own design — protection comes from RLS/grants,
-- not from hiding the key) and, as a second, independent layer, turns on Postgres Row
-- Level Security with zero policies defined. That second layer means even if a grant
-- were ever accidentally restored later (a dashboard misclick, a future migration), RLS
-- alone would still deny anon/authenticated by default — it doesn't rely on the REVOKE
-- being the only thing standing guard. Neither layer affects the service-role key
-- (_supabaseAdmin.js): Supabase's service_role has BYPASSRLS and isn't subject to
-- grants, which is what lets api/submit-contact.js keep writing after this runs.
--
-- Safe to re-run — REVOKE on a privilege the role doesn't have, or ENABLE ROW LEVEL
-- SECURITY on a table that already has it on, are both no-ops, not errors.

revoke all on public.waitlist from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;

alter table public.waitlist enable row level security;
alter table public.contact_messages enable row level security;

-- Optional but recommended: database-level backstop on top of the serverless
-- endpoints' own validation, in case anything (a future code change, a service-role
-- script, a Supabase dashboard edit) ever inserts a row without going through them.
-- Skip/edit any line below that doesn't match your actual column names or already
-- has an equivalent constraint.

alter table public.waitlist
  add constraint waitlist_email_format
  check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 320);

alter table public.contact_messages
  add constraint contact_email_format
  check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 320);

alter table public.contact_messages
  add constraint contact_message_length check (length(message) <= 5000);

alter table public.contact_messages
  add constraint contact_name_length check (length(name) <= 200);

alter table public.contact_messages
  add constraint contact_subject_length check (length(subject) <= 200);
