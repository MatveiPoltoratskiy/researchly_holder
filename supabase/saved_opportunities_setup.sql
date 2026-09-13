-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Backs server-side sync of each visitor's saved-opportunities map (see
-- api/saved-opportunities.js and src/lib/savedOpportunities.js), keyed by an anonymous,
-- durable visitor_id (a crypto.randomUUID() cached in localStorage — see
-- src/lib/visitorId.js). No login, no email, no name: one row per visitor_id, the whole
-- { [opportunityId]: status } map stored as jsonb so the shape can evolve without a
-- migration. Locked down the same way feedback/waitlist/contact_messages are: the public
-- anon key never gets any privilege on this table, so the service-role-only, rate-limited
-- endpoint is the only way a row is ever read or written.
--
-- Security note (documented here on purpose): a visitor_id is a bearer token, not real
-- authentication. Anyone who obtains someone else's exact visitor_id could read or
-- overwrite that visitor's saved-opportunities row. There is no per-row access control
-- possible without real login — protection rests entirely on the UUID's entropy (2^122
-- possibilities, not realistically guessable), same tradeoff as any anonymous-token design.
--
-- Safe to re-run — IF NOT EXISTS / REVOKE-of-nothing / re-adding an existing constraint
-- with a different name / ENABLE-twice are all no-ops or cheap no-op-equivalents.

create table if not exists public.saved_opportunities (
  visitor_id uuid primary key,
  saved_map jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

revoke all on public.saved_opportunities from anon, authenticated;
alter table public.saved_opportunities enable row level security;

-- keeps a single malicious/buggy client from writing an unbounded blob into one row
alter table public.saved_opportunities
  add constraint saved_opportunities_map_size check (length(saved_map::text) <= 20000);

alter table public.saved_opportunities
  add constraint saved_opportunities_map_is_object check (jsonb_typeof(saved_map) = 'object');
