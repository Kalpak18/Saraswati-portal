# Production deployment — Saraswati Portal

Everything needed to put this portal online and keep it running for a school.

---

## 1. Services you need

| Service | Plan | Cost | Why this one |
|---|---|---|---|
| **Supabase** | **Pro** | **$25/mo** | Database, auth, storage. **The free tier is not viable**: it pauses the project after 7 days of inactivity (this already happened once — the portal went offline) and includes no backups. Pro gives daily backups, 7-day point-in-time recovery, and no pausing. |
| **Vercel** | Hobby (free) or Pro ($20/mo) | $0–20/mo | Hosting for Next.js. Hobby is fine technically and supports custom domains; Vercel's terms reserve Hobby for non-commercial use, so a fee-charging school should be on Pro. |
| **Domain** | — | ~₹800–1200/yr | e.g. `results.yourschool.in`. Buy anywhere; point it at Vercel. |
| **Sentry** | Developer (free) | $0 | Error tracking — **already wired up**. 5k errors/month free is ample. |
| **UptimeRobot** or **BetterStack** | Free | $0 | Pings the site every 5 min and alerts you if it's down — most useful on result day. |

**Realistic total: $25/mo (~₹2,100)**, or $45/mo with Vercel Pro.

### Not needed
- **Redis / Upstash** — rate limiting runs in Postgres (see §3). Only worth adding above ~100 lookups/second, which a single school will never reach.
- **A separate CDN** — Vercel includes one.
- **Managed Postgres elsewhere** — Supabase *is* Postgres; moving off it means rebuilding auth.

### Later, if you want them
- **SMS to parents** (MSG91, ~₹0.15/SMS) — "result published" alerts.
- **Supabase Storage** — already provisioned; use it for the school logo and, later, PDF archives.

---

## 2. Deploy

1. **Apply the database migrations.** Supabase → SQL Editor → paste and run, in this order: `supabase/production.sql`, `supabase/cms.sql`, `supabase/drop_deprecated.sql`, `supabase/achievements.sql`, `supabase/home_story.sql`, `supabase/notices.sql`, `supabase/home_sections.sql`, `supabase/launch.sql`, `supabase/scale.sql`. Each is safe to re-run. `achievements.sql` powers the achievements importer and toppers; `home_story.sql` the video hero, banners, Marathi school name and map link; `notices.sql` the notice board; `home_sections.sql` the home & About page builder and the phone / email / office-hours settings; `launch.sql` Appearance, team details (and hides teachers' private contacts from the public API) and Downloads; `scale.sql` the indexes, rate limiting and audit sizing for a full school (~5000 students).
2. **Push to GitHub**, then Vercel → *Add New Project* → import the repo.
3. **Set environment variables** in Vercel (*Settings → Environment Variables*), for Production **and** Preview:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role secret — **never** prefix with `NEXT_PUBLIC_` |
   | `IP_HASH_SALT` | **required** — a long random string (`openssl rand -hex 32`). The site refuses to start in production without it. Use a different value from your laptop's. |
   | `NEXT_PUBLIC_SITE_URL` | the public address, e.g. `https://saraswatividyalaya.in` — used for the sitemap and WhatsApp/Facebook link previews |
   | `LOOKUP_RATE_LIMIT` | `300` (optional; lookups per network/IP per window) |
   | `LOOKUP_RATE_WINDOW_SECONDS` | `600` (optional) |
   | `LOOKUP_MOBILE_LIMIT` | `20` (optional; lookups per mobile number per 24 h) |
   | `NEXT_PUBLIC_SENTRY_DSN` | your Sentry DSN (already in `.env.local`) |
   | `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | optional — only for readable stack traces, see §7 |

4. **Deploy**, then add your custom domain in Vercel and follow its DNS instructions.
4a. **Point Supabase auth at the live site.** Supabase → Authentication → URL Configuration: set *Site URL* to your domain and add `https://<your-domain>/auth/callback` to *Redirect URLs*. Without this, password-reset emails link back to localhost.
5. **Rotate the admin password** from inside Supabase → Authentication → Users. The current one was set during development and is sitting in a chat transcript.
6. **Smoke test on the live URL**: parent lookup with a real mobile + DOB, one report card, admin login, one Excel upload.

---

## 3. What was hardened

- **Indexed parent lookup.** `students.parent_mobile_norm` is a stored generated column holding the last 10 digits of `parent_mobile`, indexed together with `dob`. The previous suffix match (`like '%9822014571'`) could not use an index and degraded into a full table scan on every lookup. The app falls back to the old query if the migration hasn't been applied, and logs a warning.
- **Rate limiting.** `record_lookup_attempt()` counts attempts per hashed IP in a rolling window. Mobile + DOB is guessable, and the endpoint is public — without this, children's records can be enumerated. Raw IPs are never stored, only `sha256(ip + IP_HASH_SALT)`. It **fails open**: if the limiter breaks, parents can still get results.
- **No database errors reach parents.** Postgres messages are logged server-side; the UI shows a bilingual message.
- **Error boundaries** — `error.tsx`, `global-error.tsx`, `not-found.tsx`, plus a loading skeleton for report cards. A crash now shows a real page with an error reference, not a blank screen.
- **Environment validation** — `src/lib/env.ts` fails at boot with a readable list of what's missing, instead of a cryptic error mid-request.
- **Security headers** — HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policy. `/lookup/*` and `/admin/*` are `private, no-store` so no shared proxy ever caches one child's report card and serves it to another parent. `X-Powered-By` removed.
- **Audit retention** — `prune_audit_log()` drops entries older than two years.
- **Readable errors in production.** React hides messages thrown by server actions in production ("Minified React error #441"). Every action returns `{ ok, error }` through `src/lib/actionResult.ts`, so parents and admins see the real reason.
- **Uploads are admin-only.** Every upload action checks the session before using the service-role key; the logo accepts raster images only (no SVG). Large files (videos, PDFs, documents) go browser → Storage through one-time signed URLs.
- **Contact form spam protection** — a hidden honeypot field plus a limit of 3 messages per hashed IP per 10 minutes.
- **Private data stays private.** Teachers' email/phone are served only through the `team_public` view, and only when "show on website" is ticked; the table itself is closed to the public API. Report cards, admin and login pages are `noindex` and disallowed in `robots.txt`.
- **SEO** — `sitemap.xml` (pages + every event), `robots.txt`, titles/descriptions/link previews built from the school's name, logo and hero photo.

---

## 4. Will it handle the load?

For a 2,000-student school, comfortably.

| Table | Rows/year at 2,000 students | Notes |
|---|---|---|
| `students` | 2,000 | Trivial. |
| `exams` | ~60 | 6 exams × 10 divisions. |
| `marks` | ~120,000 | 2,000 × 6 exams × 10 papers. Postgres handles millions. |
| `audit_log` | ~120,000 | One row per mark written; pruned at 2 years. |

- **Parent lookup** is now a two-column index hit — sub-millisecond regardless of school size.
- **Result-day spike** is the real load: if 2,000 parents check within an hour that's under 1 request/second, with bursts of maybe 50/s. Vercel scales serverless functions automatically, and Supabase's API layer is HTTP-based (PostgREST), so there's no connection-pool exhaustion.
- **Headroom**: this design stays comfortable to roughly 50,000 students before anything needs revisiting.

Verify the index is being used after applying the migration:

```sql
explain analyze
select id from students
where parent_mobile_norm = '9822014571' and dob = '2010-05-13';
-- expect: Index Scan using students_mobile_norm_dob_idx
```

---

## 5. Decisions still open

**1. Report card links are permanent and public.** `/lookup/<examId>/<studentId>` needs no verification — anyone with the URL sees that child's marks, forever. The UUIDs are unguessable, so this is not an open door, but a link forwarded on WhatsApp keeps working indefinitely. Options:
   - Leave it (simplest; the link is the secret).
   - Sign links with a short-lived token (~30 min) — a few hours of work.
   - Require re-entering DOB on the card page.

**2. Shared IPs and the rate limit.** Two budgets: 300 lookups per 10 minutes per network (parents on school Wi-Fi or a Jio/Airtel NAT share an IP), and 20 per mobile number per day from any network — that second one is what stops someone guessing a child's date of birth. Load-tested at ~220 lookups/second with no errors.

**3. Excel upload on serverless.** Parsing happens in-process. Vercel's limits (4.5 MB request body; 60s execution on Pro) are fine for class-sized files but will fail on a very large workbook. If uploads grow, move parsing to a background job.

**4. Tests.** `npm run check:imports` runs every Excel template through the importers with real-world data (60 checks). Name matching in `src/lib/match` is not covered yet.

**5. Database size.** A full school writes ~1M mark rows a year (~300–400 MB with indexes). The Supabase free plan stops at 500 MB, so move to Pro (8 GB) before the first full year of results.

**5. One admin account.** No roles, no per-teacher logins, no way to see who changed a mark beyond `audit_log.actor_id`. Fine for one clerk; revisit if teachers get access.

---

## 6. Routine operations

- **Backups**: automatic on Supabase Pro. Test a restore once before you depend on it.
- **Before each exam upload**: Supabase → Database → Backups → take a manual snapshot.
- **Monitoring**: Sentry is live (see §7). Check its dashboard after each result day.
- **Key rotation**: if the service-role key ever leaks, rotate it in Supabase → Settings → API, then update Vercel's env var and redeploy.

---

## 7. Error monitoring (Sentry)

Wired and verified — a test event was delivered to the project.

| File | Role |
|---|---|
| `src/instrumentation.ts` | Server + edge init; `onRequestError` reports server action and render failures |
| `src/instrumentation-client.ts` | Browser init; `onRouterTransitionStart` for navigation traces |
| `sentry.server.config.ts` / `sentry.edge.config.ts` | Runtime options |
| `src/lib/sentryScrub.ts` | Strips mobile numbers and dates of birth from every event |
| `next.config.ts` | `withSentryConfig`, tunnel route |

**Privacy.** Parents identify themselves with a mobile number and a child's date of birth, so none of it may reach Sentry:
- SDK v11 does not send PII by default.
- `beforeSend` redacts any 6–15 digit run and any `YYYY-MM-DD` from messages, exception values, breadcrumbs and URLs, and drops request bodies and cookies outright. Verified against a sample event carrying real-looking data — nothing survived.
- **Session Replay is deliberately off.** It would record parents typing exactly those two fields.

**Only active in production.** `enabled` is gated on `NODE_ENV === "production"`, so local development never sends events. Sampling is 10% of traces; raise it while investigating.

**Ad blockers.** Events are tunnelled through `/monitoring` on your own domain, so a blocker on a parent's phone cannot silence error reports. That path is excluded from the auth proxy in `src/proxy.ts` — keep it that way.

### Optional: readable stack traces

Without a build-time auth token, traces point at minified code. To fix, create a token at **Sentry → Settings → Auth Tokens** (scope: `project:releases`) and set three variables in Vercel:

```
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=<your-project-slug>
SENTRY_AUTH_TOKEN=<token>
```

Source maps then upload on each deploy. Builds succeed without them — upload is skipped, not failed.

---

## 8. Admin password: rotating, forgetting, resetting

### Required Supabase configuration (do this before relying on reset emails)

> Both pages live under **Authentication** in the left sidebar — *not* under the ⚙️ Settings section, which is where most people look first. Direct links (replace the ref if the project changes):
>
> | Page | URL |
> |---|---|
> | Site URL + Redirect URLs | `https://supabase.com/dashboard/project/<ref>/auth/url-configuration` |
> | Custom SMTP | `https://supabase.com/dashboard/project/<ref>/auth/smtp` |
> | Users | `https://supabase.com/dashboard/project/<ref>/auth/users` |
> | API keys | `https://supabase.com/dashboard/project/<ref>/settings/api` |

**Authentication → URL Configuration**

- **Site URL**: `https://your-domain.in`
- **Redirect URLs** — add both, or the reset link silently lands on the Site URL instead of the reset page:
  ```
  https://your-domain.in/auth/callback
  http://localhost:3000/auth/callback
  ```

**Authentication → Emails → SMTP Settings** — **configure a real SMTP provider.**
Supabase's built-in email sender is rate-limited to **2 messages per hour** and is explicitly not intended for production. If the admin forgets the password on result day and the reset email is throttled, they are locked out until the limit resets. **Resend** (free, 3,000 emails/month) or **Brevo** takes ten minutes to wire up: create an account, verify the domain, paste the SMTP host/user/pass into Supabase.

### Three ways to change the password

| Situation | Route |
|---|---|
| Admin knows the password and wants to change it | Log in → `/forgot-password` → reset link → `/reset-password` |
| Admin forgot the password | `/login` → "पासवर्ड विसरलात? · Forgot password?" → email link |
| Locked out entirely (no email access) | Supabase → Authentication → Users → ⋯ → **Reset password**, or edit the user and set one directly |

The reset flow: `/forgot-password` sends the email → the link hits `/auth/callback`, which exchanges the one-time code for a session → `/reset-password` sets the new password. Links expire in one hour and are single-use; an expired one bounces back with a "request a new one" notice. The form never reveals whether an address has an account — that would let a stranger enumerate valid admin emails.

---

## 9. Rotating keys without locking everyone out

This is where the "everyone got stuck after 7 days" failure comes from. Two different things are called "rotating keys", and only one of them is dangerous.

### Safe: rotating the service-role or anon key

Supabase → Settings → API → rotate → update the value in Vercel → redeploy. **Existing logins keep working.** The keys authenticate the *app* to the database, not users to the app.

### Dangerous: rotating the JWT secret

Your project uses legacy JWT keys (the anon key is itself a JWT signed by the project's JWT secret). Rotating that secret:

1. invalidates **every** access token already issued — every signed-in user is logged out, and
2. invalidates the anon and service-role keys themselves, because they are signed by it.

If the new keys are not deployed **at the same moment**, the app cannot reach the database at all. Do it only during a planned window: rotate, immediately update all three env vars in Vercel, redeploy, then log in again.

Your blast radius here is one person. Parents have no accounts — they identify with a mobile number and date of birth, and hold no session at all. A rotation costs the admin one re-login, nothing more.

### The bug that actually strands users, now fixed

A stale session does not strand people by itself — but losing the *refreshed* token does, and that is a code bug, not a Supabase setting.

Supabase access tokens last one hour; the browser then exchanges a refresh token for a new pair, and the old refresh token is consumed. In `src/proxy.ts`, `getUser()` performs that exchange and writes the rotated tokens into its response. **If the middleware returns a redirect built separately, those cookies never reach the browser** — the server has rotated the refresh token, the browser still holds the consumed one, and the next request logs the user out. Repeated on every visit, it looks exactly like "after a while, everyone is stuck".

`redirectTo()` in `src/proxy.ts` now copies every refreshed cookie onto the redirect. Measured with a deliberately expired access token:

| | `Set-Cookie` on the redirect |
|---|---|
| Before | **0** — refreshed token discarded |
| After | **1** — rotated token reaches the browser |

Two related hardenings in the same file:
- `getUser()` is wrapped in `try/catch`. A Supabase auth outage used to throw inside middleware, which 500s **every** page — including the parent lookup, which needs no session. It now fails closed for `/admin` and open for everything else.
- Keep `/monitoring` excluded from the matcher so error reports never take an auth round-trip.

### If someone does get stuck

Clearing site data in the browser always recovers it — it discards the dead refresh token and forces a fresh login. Worth knowing before debugging anything else.

---

## Launch checklist

Content (Admin):
- [ ] Settings: phone, email, office hours, logo, Marathi name — check the footer and Contact page.
- [ ] Settings → Appearance: pick the brand colour / font / corners.
- [ ] Home hero: real school photos or video (no test images).
- [ ] Home page sections: replace any test photos/captions; remove links to pages that don't exist (the editor flags them in red).
- [ ] Testimonials: replace the sample quotes with real ones before switching that section on — or leave it hidden.
- [ ] Post at least one notice, one event with photos, and the team (Faculty page).
- [ ] Upload the academic calendar / admission form to Downloads.
- [ ] Import one competitive-exam result sheet and "Find toppers" for the latest exam.

Technical:
- [ ] All migrations in §2 applied (the admin pages show an amber box if one is missing).
- [ ] `IP_HASH_SALT` and `NEXT_PUBLIC_SITE_URL` set on the host.
- [ ] Supabase auth Site URL / redirect set to the live domain.
- [ ] Admin password rotated; only staff who need it have accounts.
- [ ] Open the live site on a phone: hero, menu, Marathi toggle, Check Result with a real student.
- [ ] Send a test message from the Contact page and find it in Admin → Website → Contact inbox.
- [ ] Share the home page link on WhatsApp and check the preview shows the school name and photo.

