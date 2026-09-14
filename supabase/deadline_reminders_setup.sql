-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Backs server-side sync of each visitor's deadline-reminder map (see
-- api/deadline-reminders.js and src/lib/deadlineReminders.js), keyed by the SAME
-- anonymous, durable visitor_id already used for saved_opportunities (a
-- crypto.randomUUID() cached in localStorage — see src/lib/visitorId.js). No login, no
-- email, no name: one row per visitor_id, the whole { [opportunityId]: { calendar,
-- addedAt } } map stored as jsonb so the shape can evolve without a migration. Locked
-- down the same way saved_opportunities is: the public anon key never gets any
-- privilege on this table, so the service-role-only, rate-limited endpoint is the only
-- way a row is ever read or written.
--
-- Security note (documented here on purpose, same as saved_opportunities_setup.sql): a
-- visitor_id is a bearer token, not real authentication. Anyone who obtains someone
-- else's exact visitor_id could read or overwrite that visitor's reminder row. There is
-- no per-row access control possible without real login — protection rests entirely on
-- the UUID's entropy, same tradeoff as saved_opportunities.
--
-- Safe to re-run — IF NOT EXISTS / REVOKE-of-nothing / ENABLE-twice are all no-ops.

create table if not exists public.deadline_reminders (
  visitor_id uuid primary key,
  reminder_map jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

revoke all on public.deadline_reminders from anon, authenticated;
alter table public.deadline_reminders enable row level security;

-- keeps a single malicious/buggy client from writing an unbounded blob into one row
alter table public.deadline_reminders
  add constraint deadline_reminders_map_size check (length(reminder_map::text) <= 20000);

alter table public.deadline_reminders
  add constraint deadline_reminders_map_is_object check (jsonb_typeof(reminder_map) = 'object');
