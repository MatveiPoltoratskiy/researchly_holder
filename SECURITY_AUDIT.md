# Security Audit — Researchly

**Date:** 2026-08-20
**Scope:** Full repository (`researchly_holder`), branch `main`.
**Checklist source:** a 40-item (39 legible) "vulnerabilities in vibe-coded / AI-generated apps" checklist image supplied by the user.
**Auditor approach:** static code review (full repo grep/read), a built-production-bundle inspection (`dist/`), direct black-box testing against the live Supabase REST API using the same anon key any visitor has, unit tests against the two serverless function handlers, `npm audit`, and git history review. No live Vercel deployment access was available in this environment (no CLI auth) — noted per-item where that limits verification.

## Application summary

- **Frontend:** React 18 + Vite, client-only SPA, custom hash-less router (`src/lib/router.jsx`). No SSR.
- **Backend:** 2 Vercel Node.js serverless functions (`api/dev-unlock.js`, `api/dev-verify.js`). No traditional server, no ORM.
- **Database:** Supabase (Postgres via PostgREST), accessed **only** via the public anon key, client-side, for two tables: `waitlist`, `contact_messages`. No SELECT/UPDATE/DELETE calls anywhere in the app — insert-only by design.
- **Auth:** No user-account system. A single shared-passphrase gate (`api/dev-unlock.js` + `api/dev-verify.js` + `src/lib/devAccess.js`) protects two pre-launch prototype routes (`/interview`, `/opportunities`) from casual/public discovery. Explicitly *not* designed to protect sensitive data — there isn't any behind it.
- **No** payment system, file uploads, webhooks, AI/LLM features, admin panel, CI/CD pipeline, or CORS configuration beyond the browser default.
- **External services called from the client:** Supabase, Nominatim (reverse geocoding, keyless), Google/DuckDuckGo favicon services, CartoDB map tiles, Google Fonts, Vercel Web Analytics.

---

## Findings

### 1. Exposed database credentials — NOT PRESENT
The Supabase URL and anon key are intentionally public (`VITE_`-prefixed, shipped to the client by Supabase's own design; protection comes from RLS/grants, not secrecy of the key). Verified directly against the live project (see §6/§33) that the anon key cannot read, update, or delete data — only insert into the two intended tables. No service-role key or other privileged credential exists anywhere in the repo.

### 2. Public .env files — NOT PRESENT
`.env.local` is covered by `.gitignore` (`*.local`). Confirmed via `git log --all --diff-filter=A -- "*.env*"` that no `.env*` file was ever committed, at any point in history.

### 3. Hardcoded API keys — NOT PRESENT
Full-repo regex scan for `key/secret/password/token = "..."` patterns found no hits outside the intentional, documented `VITE_SUPABASE_*` public keys and the passphrase-related code itself.

### 4. Weak or missing authentication — PARTIALLY MITIGATED → FIXED (rate limiting)
The dev-gate is a shared passphrase, not per-user auth — appropriate for its actual purpose (keep unfinished prototypes off the public internet pre-launch, nothing sensitive behind it). Before this audit, `api/dev-unlock.js` had no rate limiting, allowing unlimited automated guesses.
- **Fixed:** added in-memory, per-IP rate limiting (8 attempts / 5 minutes) to `api/dev-unlock.js` via new `api/_rateLimit.js`. Verified via unit test: 8th attempt allowed, 9th returns `429`, a different IP is unaffected.
- **Remaining risk:** the limiter is per-warm-instance in-memory state (serverless — no shared store). A distributed or cold-start-spanning attack sees a fresh bucket. This raises the bar against casual/scripted brute force; it is not equivalent to Vercel Firewall or Upstash-backed rate limiting. Documented as a manual upgrade path if this endpoint's threat model ever changes.

### 5. No authorization checks — FIXED (this audit)
Previously, `/interview` and `/opportunities` were gated by a **client-side boolean only** (`isDevUnlocked()` read a plain localStorage flag anyone could set to `true` in devtools — this was the state before the prior session's second gating pass). That was already replaced with real server-verification (`verifyDevAccess()` → `api/dev-verify.js`) in the prior session. This audit did not find any further authorization gaps, but did find and fix a related issue: **the gated components' code and data shipped to every visitor regardless of the check** (see finding immediately below) — the authorization *decision* was real, but the thing being protected wasn't actually withheld.

### 6. Users able to access other users' data — NOT APPLICABLE (verified)
No per-user data model exists. Tested directly against the live Supabase project with the public anon key (the same access any visitor/attacker has):
- `GET /rest/v1/waitlist?select=*` → `401 permission denied` ✅
- `GET /rest/v1/contact_messages?select=*` → `401 permission denied` ✅
- `PATCH`/`DELETE` on `waitlist` (filtered to a non-existent row, safe test) → `401 permission denied` ✅
- `POST` (insert) → `201` succeeds, as intended ✅

**⚠️ Action required:** this test inserted one real row into your production `waitlist` table: `security-audit-test-DELETE-ME@example.invalid`. The anon key correctly cannot delete it (proof the RLS/grants are working) — please remove it via the Supabase dashboard.

### 7. Open database read/write permissions — NOT PRESENT (verified, see #6)

### 8. Misconfigured Firebase / Supabase / S3 buckets — REQUIRES MANUAL CONFIGURATION
No Firebase, no S3. Supabase's RLS/grant configuration itself lives in the Supabase dashboard, not in this repo, so it can't be code-reviewed — but it was black-box tested (see #6) and is behaving correctly today. Recommend periodically re-running the same 4 curl checks (documented in this repo's audit history) after any schema change, since RLS policies are easy to accidentally loosen.

### 9. Admin routes left unprotected — NOT APPLICABLE
No admin panel/routes exist in the app.

### 10. Debug pages exposed in production — NOT PRESENT
Router only recognizes `/`, `/contact`, `/how-it-works`, `/opportunities`, `/interview`; anything else falls through to the landing page. No debug/test routes.

### 11. Build logs leaking secrets — NOT PRESENT
No CI/CD config in the repo (no GitHub Actions etc.). `vite build` output contains no secret values (verified by inspecting build stdout — only file sizes/names).

### 12. Verbose error messages leaking stack traces — FIXED
- `api/dev-unlock.js` / `api/dev-verify.js`: **before** this audit, an unexpected exception (e.g. malformed request body) had no `try/catch` wrapper, risking a raw Node stack trace or unhandled-rejection response. **Fixed:** both handlers now wrap all logic in `try/catch`, log the real error server-side only (`console.error`, visible in Vercel's function logs, not the response), and return a generic `{ error: 'Something went wrong' }` to the client.
- Client-side Supabase error handling (`Waitlist.jsx`, `Footer.jsx`, `Contact.jsx`) already showed only generic messages to users; verified `console.error(error)` calls only reach the *user's own* browser console (not a server log), and log Supabase's error object (code/message), never the submitted PII back out.

### 13. Leaked GitHub repos or commit history — NOT PRESENT
Reviewed full `git log --all -p` for credential-shaped patterns; only found the (non-secret) env-var *names* referenced in code, never values. Repository itself is on a private remote (`github.com/MatveiPoltoratskiy/researchly_holder`).

### 14. (illegible in the source image) — Not auditable from the image
Could not read this line in the supplied screenshot (it was obscured by an overlaid video caption). Given the surrounding items, the audit's coverage of adjacent categories (leaked secrets, exposed env vars, client-only checks) should reasonably cover whatever this item represented.

### 15. Client-side-only security checks — VULNERABILITY FOUND → FIXED
**This was the most significant real finding of the audit.** The server-side authorization check itself (`api/dev-verify.js`) was genuine — but because `Interview.jsx` and `OpportunityExplorer.jsx` (plus their heavy dependencies: the ~180-entry opportunities dataset, the field taxonomy, world-cities list, map code) were **statically imported** in `App.jsx`, Vite bundled all of it into the single main JS file served to *every* visitor on page load, regardless of whether they ever passed the passphrase check. Confirmed by grepping the pre-fix production bundle for dataset-specific strings (organization domains like `biogenius.ca`) and finding them present.

An unauthenticated visitor could not see the pages through the UI, but could extract the full interview flow and program dataset from the network tab / page source with zero effort — the "gate" only hid the door, not what was behind it.

- **Fixed:** converted both imports in `src/App.jsx` to `React.lazy(() => import(...))`, wrapped in `<Suspense>`. Vite now emits `Interview-*.js` and `OpportunityExplorer-*.js` as separate chunks, fetched only when that branch of the component tree actually mounts (i.e., only after `devAccess === 'granted'`).
- **Verified:** (a) grepped the new main bundle — 0 occurrences of dataset/interview-specific strings; (b) grepped the split chunks — content is there, isolated; (c) Puppeteer test against the real production build (`vite preview`) confirms the browser **never issues a network request** for `Interview-*.js` or `OpportunityExplorer-*.js` when visiting `/interview` without a valid token.
- **Remaining, honestly-stated risk:** this is real defense-in-depth, not an ironclad guarantee. The chunk files are still static assets with no per-request server-side access control (this is a static SPA — there's no server to check a session against on a per-asset-request basis without a much larger architecture change, e.g. moving to Vercel Edge Middleware or SSR). Their filenames include a build-specific content hash and are never linked from anywhere a crawler or casual visitor would find them, so the realistic threat this closes (**every visitor and every search-engine crawler automatically receiving the full dataset**) is fully closed. A sufficiently motivated attacker who somehow learned the exact hashed chunk URL (e.g. from a leaked screenshot of someone else's network tab) could still fetch it directly. Closing that residual gap completely would require moving off a pure client-side SPA for these two routes — flagged as a "requires manual/architectural decision" item, not attempted here given the scope and the fact that the data itself (public research-program listings) isn't sensitive.

### 16. Missing input validation — FIXED (API routes); PRE-EXISTING (forms, low severity)
- `api/dev-unlock.js` / `api/dev-verify.js`: added explicit type + max-length checks (256 / 512 chars) on `passphrase` / `token` before use, on top of the pre-existing type-checking. Verified via unit test that a 10,000-character input and a non-string (object) input are both handled without error and without disproportionate cost.
- Client forms (`Waitlist.jsx`, `Footer.jsx`, `Contact.jsx`) validate email format client-side only; there is no server-side re-validation, since these go straight to Supabase's insert API. This is low severity (worst case: a malformed row lands in a table nobody reads back through the app), but is a real gap if Supabase's own column constraints are loose. Recommend adding a `CHECK` constraint on the `waitlist.email` / `contact_messages.email` columns in Supabase directly — outside this repo's reach to configure.

### 17. SQL injection — NOT PRESENT
No raw SQL anywhere in the codebase. All Supabase access goes through the official JS client's query builder (`.from(table).insert({...})`), which parameterizes values; no string concatenation into queries. No `.rpc()` calls exist (which would be the other place raw SQL could sneak in via a Postgres function).

### 18. NoSQL injection — NOT APPLICABLE
No NoSQL database in use.

### 19. Cross-site scripting (XSS) — NOT PRESENT
- Zero uses of `dangerouslySetInnerHTML` anywhere in `src/`.
- All user-entered/user-controlled values (email, contact form fields, interview answers, location search) are rendered exclusively through JSX text interpolation, which React escapes by default.
- The only places raw HTML strings are constructed (`OpportunityMap.jsx` Leaflet popups) build content from the **app's own static dataset** (organization names/URLs the developer verified and controls), not live user input, and pass through a local `escapeHtml()` helper regardless.

### 20. Cross-site request forgery (CSRF) — NOT APPLICABLE (by design)
No cookie-based session exists anywhere in the app (the dev-gate token is sent explicitly in a JSON POST body, read from `localStorage` by JS — a malicious third-party site cannot read another origin's `localStorage` or auto-attach it to a forged request the way it could a cookie). The Supabase inserts use the public anon key with no ambient session either. There is no state-changing action in the app gated by cookie-based identity, so classic CSRF does not apply to this architecture.

### 21. Insecure file uploads — NOT APPLICABLE
No file upload feature exists anywhere in the app.

### 22. Path traversal bugs — NOT APPLICABLE
No filesystem access based on user input anywhere (the two serverless functions do no file I/O at all).

### 23. Server-side request forgery (SSRF) — NOT PRESENT
Neither serverless function makes any outbound HTTP request. The one outbound fetch to a "user-influenced" endpoint (Nominatim reverse-geocoding in `Interview.jsx`) happens **client-side**, using the browser's own geolocation coordinates (numeric, not attacker-suppliable strings) — there is no server making requests on a user's behalf that could be redirected at internal infrastructure.

### 24. Broken password reset flows — NOT APPLICABLE
No user accounts, no passwords beyond the single shared dev-gate passphrase, no reset flow exists.

### 25. Weak session management — REVIEWED, ACCEPTABLE FOR STATED PURPOSE
The dev-gate "session" is a 30-day HMAC-signed token in `localStorage`. Not httpOnly (by necessity — the client-only SPA needs to read it to attach to fetch calls), so it would be exposed by a successful XSS (none found, see #19). Revocation is possible by rotating `DEV_GATE_SECRET` server-side, which instantly invalidates every outstanding token. Proportionate to the actual threat model (keep casual visitors out of a pre-launch prototype); would not be an acceptable pattern for anything protecting real user data.

### 26. JWT secrets that are weak, leaked, or reused — NOT PRESENT
Not using a JWT library, but a functionally-equivalent custom HMAC-SHA256 signed token. `DEV_GATE_SECRET` was generated as 32 random bytes (`crypto.randomBytes(32)`, base64url-encoded) — not a weak/guessable value, not reused anywhere else in the codebase, never committed to git (see #2).

### 27. Overly permissive CORS — NOT PRESENT
Neither `api/dev-unlock.js` nor `api/dev-verify.js` sets any `Access-Control-Allow-Origin` header. Confirmed via grep. Absent any CORS header, browsers enforce the same-origin policy by default — no other origin can read these endpoints' responses.

### 28. Rate limits missing on login, signup, APIs, and AI endpoints — VULNERABILITY FOUND → FIXED
See #4 for `api/dev-unlock.js` (the "login" analog). `api/dev-verify.js` also received rate limiting (60 requests / 5 minutes per IP) — deliberately much looser, since it fires on every page load of a gated route for legitimately unlocked visitors, not just explicit attempts; verified via unit test that 15 rapid legitimate calls all succeed without being throttled. The three public Supabase-writing forms (waitlist ×2, contact) have no rate limiting; mitigated instead with honeypot fields (see #16/new mitigation below) since adding real server-side rate limiting to a client-direct-to-Supabase write would require moving these behind a serverless function too — flagged as a larger, optional follow-up rather than done here.

### 29. Public test or staging environments — NOT AUDITABLE FROM THIS REPO
No staging config exists in the repository. Whether a separate `preview`/`staging` Vercel deployment is publicly reachable is a platform/account setting, not something visible from the codebase.

### 30. Default credentials left unchanged — NOT APPLICABLE
No default credentials ship with the app; the dev-gate passphrase was explicitly chosen by the site owner, not a framework default.

### 31. Webhook endpoints without signature verification — NOT APPLICABLE
No webhook endpoints exist anywhere in the app.

### 32. Payment or subscription checks only done on the frontend — NOT APPLICABLE
No payment or subscription system exists.

### 33. Insecure direct object references (IDOR) — NOT APPLICABLE (verified, see #6)
No endpoint or query anywhere accepts an object/row ID from the client and uses it to fetch or mutate a specific record. The only Supabase operations are blind inserts (create a new row; there's no ID to reference).

### 34. API endpoints that trust user-controlled IDs or roles — NOT PRESENT
Neither serverless function accepts or trusts any client-supplied identity, ID, or role. Authorization is entirely "does this passphrase/token match," with no user-differentiated permission levels to escalate.

### 35. Logs containing tokens, emails, passwords, or private user data — REVIEWED, LOW RISK
- Server-side (`console.error` in the two API functions): logs only generic error descriptions and the misconfiguration state (e.g. "DEV_GATE_SECRET is not configured") — never the passphrase, never a token, never request bodies.
- Client-side (`Contact.jsx`, `src/lib/supabase.js`): `console.error` calls log Supabase's *error object* (an error code/message), not the submitted name/email/message content, and only ever appear in the submitting user's own browser console — not a server-side log an attacker or operator could later mine.

### 36. Source maps exposed in production — NOT PRESENT
Verified no `.map` files in the `dist/` build output; Vite's default (`build.sourcemap: false`) was never overridden in `vite.config.js`.

### 37. Dependency vulnerabilities — VULNERABILITY FOUND → FIXED
`npm audit` found one **high-severity** transitive vulnerability: `nanoid < 3.3.18` (via `vite` → `postcss`) — "custom generators can loop indefinitely when size is zero" (GHSA-2v37-7h3g-55p8). Not directly reachable by user input in this app's usage (build-tool dependency, not runtime request-handling code), but patched anyway via `npm audit fix`. **Verified:** `npm audit` now reports 0 vulnerabilities.

### 38. Outdated packages — REVIEWED
Only 4 direct runtime dependencies (`@supabase/supabase-js`, `leaflet`, `react`, `react-dom`) plus 2 dev dependencies (`vite`, `@vitejs/plugin-react`) — a deliberately small surface. All current at time of audit; no further action taken beyond the `npm audit fix` above, to avoid an unreviewed major-version bump destabilizing the app.

### 39. Prompt injection in AI features — NOT APPLICABLE
No AI/LLM features, no calls to any AI provider, anywhere in the app.

### 40. AI tools/actions allowed to access data — NOT APPLICABLE
No AI agent or tool-calling functionality exists.

---

## Additional hardening applied (not a numbered checklist item, but within "browser security configuration" from the audit brief)

Added baseline security headers via `vercel.json`, applied to every route:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (the site has no legitimate embedding use case; blocks clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), payment=(), usb=(), geolocation=(self)` (geolocation stays enabled — required for the interview's location step)
- `Cache-Control: no-store` specifically on `/api/*` responses (auth-adjacent responses shouldn't be cached by intermediaries)

**Could not verify live**: `vercel.json` headers only take effect on an actual Vercel deployment; there is no local equivalent (`vite dev`/`vite preview` don't read this file). **Recommend**: after deploying, run `curl -I https://<your-domain>/` and confirm the headers above are present.

## Manual configuration steps required (cannot be done from this repo)

1. **Delete the test row** inserted into your live `waitlist` table during this audit: `security-audit-test-DELETE-ME@example.invalid`.
2. **Confirm `DEV_GATE_PASSPHRASE` and `DEV_GATE_SECRET`** are set as Vercel Production environment variables (carried over from the prior session's work; unrelated to this audit but a prerequisite for the dev-gate — and now also for the rate-limiting fix — to function at all).
3. **Verify the new security headers are actually being served** post-deploy (see above) — this repo's tooling cannot confirm Vercel applies `vercel.json` headers correctly.
4. **Consider** adding column-level constraints on `waitlist.email` / `contact_messages.email` in Supabase directly, since this repo has no server-side re-validation of form input before it reaches Supabase.
5. **Consider**, only if this endpoint's threat model ever changes (e.g. it starts protecting something sensitive): move rate limiting from the in-memory best-effort implementation to Vercel Firewall or an Upstash-Redis-backed store, and/or move the dev-gate to real per-user Supabase Auth.

---

## Summary table

| # | Security Issue | Status | Severity | Verified |
|---|---|---|---|---|
| 1 | Exposed database credentials | NOT PRESENT | — | Yes |
| 2 | Public .env files | NOT PRESENT | — | Yes (git history) |
| 3 | Hardcoded API keys | NOT PRESENT | — | Yes |
| 4 | Weak or missing authentication | FIXED (rate limit added) | Medium | Yes (unit test) |
| 5 | No authorization checks | FIXED (prior session) | — | Yes |
| 6 | Users access other users' data | NOT APPLICABLE | — | Yes (live API test) |
| 7 | Open database read/write permissions | NOT PRESENT | — | Yes (live API test) |
| 8 | Misconfigured Firebase/Supabase/S3 | REQUIRES MANUAL CONFIG | — | Partial (black-box only) |
| 9 | Admin routes unprotected | NOT APPLICABLE | — | Yes |
| 10 | Debug pages exposed | NOT PRESENT | — | Yes |
| 11 | Build logs leaking secrets | NOT PRESENT | — | Yes |
| 12 | Verbose error messages | FIXED | Low | Yes |
| 13 | Leaked GitHub history | NOT PRESENT | — | Yes |
| 14 | (illegible in source image) | NOT AUDITABLE | — | N/A |
| 15 | Client-side-only security checks | VULNERABILITY FOUND → FIXED | **Medium** | Yes (bundle + network test) |
| 16 | Missing input validation | FIXED (API) / minor gap (forms) | Low | Yes |
| 17 | SQL injection | NOT PRESENT | — | Yes |
| 18 | NoSQL injection | NOT APPLICABLE | — | Yes |
| 19 | XSS | NOT PRESENT | — | Yes |
| 20 | CSRF | NOT APPLICABLE | — | Yes |
| 21 | Insecure file uploads | NOT APPLICABLE | — | Yes |
| 22 | Path traversal | NOT APPLICABLE | — | Yes |
| 23 | SSRF | NOT PRESENT | — | Yes |
| 24 | Broken password reset flows | NOT APPLICABLE | — | Yes |
| 25 | Weak session management | REVIEWED, acceptable | Low | Yes |
| 26 | Weak/leaked/reused JWT secrets | NOT PRESENT | — | Yes |
| 27 | Overly permissive CORS | NOT PRESENT | — | Yes |
| 28 | Missing rate limits | VULNERABILITY FOUND → FIXED | Medium | Yes (unit test) |
| 29 | Public test/staging environments | NOT AUDITABLE | — | N/A |
| 30 | Default credentials unchanged | NOT APPLICABLE | — | Yes |
| 31 | Webhooks without signature verification | NOT APPLICABLE | — | Yes |
| 32 | Frontend-only payment checks | NOT APPLICABLE | — | Yes |
| 33 | IDOR | NOT APPLICABLE | — | Yes (live API test) |
| 34 | APIs trusting user-controlled IDs/roles | NOT PRESENT | — | Yes |
| 35 | Logs containing sensitive data | REVIEWED, low risk | Low | Yes |
| 36 | Source maps exposed in production | NOT PRESENT | — | Yes |
| 37 | Dependency vulnerabilities | VULNERABILITY FOUND → FIXED | High | Yes (npm audit) |
| 38 | Outdated packages | REVIEWED | — | Yes |
| 39 | Prompt injection in AI features | NOT APPLICABLE | — | Yes |
| 40 | AI tools/actions access data | NOT APPLICABLE | — | Yes |

**New defense-in-depth (not numbered above):** honeypot fields on all 3 public write forms; baseline browser security headers.

---

## What this audit does not claim

This application is not "unhackable," and this audit does not claim it is. It confirms: the checklist's items were each explicitly investigated (not assumed); the concrete vulnerabilities found were fixed and the fixes verified with real tests, not just code review; the app's small, mostly-static-content surface area genuinely does not have equivalents of most of the checklist's categories (no user accounts, no payments, no file uploads, no AI features); and the two places real risk existed — the passphrase gate's enforcement and its brute-forceability — were both closed. The residual risks documented above (in-memory rate limiting's serverless limitation, the gated chunks still being fetchable-if-you-know-the-exact-URL, Supabase RLS being unauditable from this repo) are real and are described honestly rather than hidden.
