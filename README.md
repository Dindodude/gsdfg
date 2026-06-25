# AgencyForge AI

AgencyForge AI is a production-style full-stack AI Web Agency Operating System. It automates lead finding, scoring, compliant outreach, reply classification, website intake, website generation, QA, compliance review, and client delivery preparation. The owner only steps in after a lead shows interest, adds conversation notes, then clicks "Send to Website Team."

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-compatible local primitives in `components/ui`
- Framer Motion
- Supabase-ready database/auth/storage architecture
- OpenAI server-side agent runner
- Resend-ready email adapter with SendGrid key slot
- Twilio-ready SMS adapter
- Vercel deployment-ready structure

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The root route redirects to `/dashboard`.

## Live API Mode

AgencyForge AI is configured to run agents and outbound messaging through live APIs. `OPENAI_API_KEY` is required for agent runs, `RESEND_API_KEY` is required for live email, and Twilio credentials are required before SMS can be sent.

## Environment Variables

Create `.env.local` from `.env.example`.

Required for live OpenAI:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

Lead sourcing:

```bash
GOOGLE_PLACES_API_KEY=...
```

The Lead Finder uses Google Places Text Search to find real businesses by industry and city, saves them to Supabase, then scores the top results with OpenAI.

Current lead finder targeting:

- 100-200 Google reviews.
- No website returned by Google Places.
- Not permanently closed.
- Stores `google_review_count`, `has_website`, and Google place ID metadata for dedupe/filtering.

Because no-website leads do not have a website to crawl, email enrichment is a separate step. `/api/leads/enrich-email` can scrape public emails from a lead's website/contact pages when a URL exists. For strict no-website leads, connect a dedicated enrichment provider later, such as Apollo, Hunter, Clay, or a SERP/contact-data API.

Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`NEXT_PUBLIC_SUPABASE_URL` must be the Project URL from Supabase API settings. It is not the database connection string, not the REST URL with extra paths, and it must include `https://`.

Email/SMS:

```bash
OUTREACH_FROM_EMAIL=hello@yourdomain.com
OUTREACH_FROM_NAME=AgencyForge AI
RESEND_API_KEY=...
RESEND_WEBHOOK_SECRET=...
UNSUBSCRIBE_SECRET=...
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Run `supabase/migrations/002_user_profile_insert_policy.sql`.
4. Run `supabase/migrations/003_suppression_and_email_events.sql`.
5. Run `supabase/migrations/004_lead_targeting_metadata.sql`.
6. Add Supabase environment variables to `.env.local` and Vercel.
7. Restart the local dev server.
8. Visit `/login` and create/sign in to an account.
9. Optionally adapt `supabase/seed.sql` with a real user id to add starter leads/agents.

The schema includes:

- `users`
- `leads`
- `agents`
- `agent_runs`
- `outreach_messages`
- `replies`
- `website_projects`
- `website_pages`
- `compliance_reviews`
- `tasks`
- `activity_logs`
- `settings`
- `suppression_list`
- `email_events`

RLS is enabled across tables with owner-scoped policies.

The app uses `@supabase/ssr` for App Router auth:

- `proxy.ts` refreshes sessions and protects dashboard routes.
- `/login` supports email/password sign in and sign up.
- `/auth/callback` handles email confirmation or OAuth callbacks.
- `/logout` signs the owner out.
- `/api/auth/bootstrap-user` creates the matching `public.users` profile.

When Supabase is configured and a user is signed in, dashboard pages read live rows from Supabase. Demo data remains available only as a visual fallback for local development or an unconfigured database.

## OpenAI Agent System

Agent prompts are stored in `lib/agents/prompts.ts`. The reusable runner is `lib/agents/run-agent.ts`.

The runner provides:

- Server-side OpenAI calls only
- JSON response formatting
- Retry handling
- Required OpenAI API key for live agent execution
- Audit logging
- Token usage placeholders
- Cost logging placeholders
- Zod validation for every agent response shape

Agents implemented:

- Lead Finder Agent
- Lead Scoring Agent
- Marketing Strategy Agent
- Outreach Agent
- Reply Classifier Agent
- Website Intake Agent
- Website Builder Agent 1
- Website Builder Agent 2
- QA Agent
- Security & Compliance Agent
- Delivery Agent

To turn live agents on locally:

1. Add `OPENAI_API_KEY` to `.env.local`.
2. Optionally set `OPENAI_MODEL=gpt-4.1-mini`.
3. Restart the dev server.
4. Test `POST /api/agents/run` with a logged-in Supabase user.

If the model returns malformed JSON or misses a required field, the request fails safely instead of saving bad data.

## Compliance Review

The Security & Compliance Agent runs before outreach and before website delivery. High-risk output is blocked.

It checks:

- Spam-like outreach
- Sender identity
- Unsubscribe or opt-out language
- Misleading claims or fake guarantees
- Copyright concerns
- Unnecessary personal data collection
- Secure contact form handling
- Privacy policy needs
- Terms/disclaimer needs
- CASL-style compliance awareness for Canada
- Privacy/PIPEDA-style awareness
- Cookie/analytics notice flags

Compliance records include risk level, issues found, fixes required, status, timestamp, and agent notes.

## API Routes

All routes include Zod validation, sanitization, safe errors, audit logging, and clear response envelopes.

- `POST /api/agents/run`
- `GET /api/leads`
- `POST /api/leads`
- `POST /api/leads/find`
- `POST /api/leads/enrich-email`
- `POST /api/leads/score`
- `POST /api/outreach/generate`
- `POST /api/outreach/send`
- `POST /api/replies/classify`
- `POST /api/websites/generate`
- `POST /api/compliance/review`
- `POST /api/qa/review`
- `POST /api/delivery/prepare`

Workflow persistence now saves:

- Generated outreach variants into `outreach_messages`
- Outreach compliance reviews into `compliance_reviews`
- Reply classifications into `replies`, with owner tasks for interested replies
- Generated website projects into `website_projects`
- Generated pages/sections into `website_pages`
- QA review status/activity into `website_projects`, `activity_logs`, and `tasks`
- Delivery preparation into `activity_logs`, `tasks`, and project status

`/api/outreach/send` is compliance-gated server-side. Email uses Resend, SMS uses Twilio, and missing provider credentials return safe errors instead of fake sends.

Live cold email also has:

- `OUTREACH_FROM_EMAIL` and `OUTREACH_FROM_NAME` for the sender identity.
- Signed unsubscribe links on every outbound email.
- `/unsubscribe` for recipient opt-outs.
- `/api/unsubscribe` to add contacts to `suppression_list`.
- Suppression checks before sending email or SMS.
- `/api/webhooks/resend` for Resend events, including delivered, bounced, complained, failed, suppressed, opened, clicked, and received.

In Resend, create a webhook pointing to:

```bash
https://your-vercel-domain.com/api/webhooks/resend
```

Then copy the webhook signing secret into:

```bash
RESEND_WEBHOOK_SECRET=...
```

Set `UNSUBSCRIBE_SECRET` to a long random string in both `.env.local` and Vercel. Keep it stable; changing it invalidates old unsubscribe links.

## App Pages

- `/dashboard`
- `/leads`
- `/pipeline`
- `/agents`
- `/outreach`
- `/websites`
- `/compliance`
- `/tasks`
- `/settings`

Pages read from Supabase when authenticated. The local repository still includes demo data in `lib/mock-data.ts` for visual fallback states.

## Seed Data

The demo dataset includes:

- 25 realistic small-business leads
- 10 agent runs
- 8 outreach messages
- 5 replies
- 4 website projects
- 6 compliance reviews
- owner tasks and activity logs

Example verticals include barber shop, dentist, restaurant, cleaning company, real estate, mechanic, gym, beauty salon, tutoring, and landscaping.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Future Improvements

- Replace demo fallback data with an onboarding seed action.
- Add Supabase Auth UI and role-specific permissions.
- Add CSV import and deduplication.
- Add Google Business Profile or Maps API ingestion.
- Classify inbound email replies automatically after the Resend receive webhook stores them.
- Add Twilio inbound SMS webhooks.
- Add website draft versioning.
- Add storage-backed client preview links.
- Add a launch checklist and Vercel project automation.
- Add real rate limiting with Upstash, Supabase counters, or Vercel WAF.
