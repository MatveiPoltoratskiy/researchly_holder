-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query) after
-- deploying the api/submit-waitlist.js and api/submit-contact.js endpoints and setting
-- SUPABASE_SERVICE_ROLE_KEY in Vercel.
--
-- What this does: revokes every privilege the public anon key had on these two tables.
-- Before this, the anon key (which is public — it ships in the client JS bundle by
-- Supabase's own design) could INSERT rows directly, bypassing any app-level rate limit
-- or validation entirely (RLS already blocked SELECT/UPDATE/DELETE for anon, verified in
-- SECURITY_AUDIT.md #6). After this, INSERT is revoked too, so the ONLY way to write to
-- either table is through the new rate-limited serverless endpoints, which use the
-- service-role key (a Postgres role that bypasses RLS/grants by design — that's what
-- lets it keep writing after the anon key is fully locked out).
--
-- Safe to re-run — REVOKE on a privilege the role doesn't have is a no-op, not an error.

revoke all on public.waitlist from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;

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
