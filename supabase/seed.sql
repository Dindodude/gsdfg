-- Optional local seed starter. Replace :user_id with an authenticated user id after running migrations.
-- The application also ships with a complete in-memory mock dataset in lib/mock-data.ts.

insert into public.agents (user_id, key, name, purpose, model, status)
values
  (:user_id, 'lead-finder', 'Lead Finder Agent', 'Find or import businesses that may need websites.', 'gpt-4.1-mini', 'Complete'),
  (:user_id, 'lead-scoring', 'Lead Scoring Agent', 'Score leads by website weakness, Google presence, and buying likelihood.', 'gpt-4.1-mini', 'Running'),
  (:user_id, 'marketing-strategy', 'Marketing Strategy Agent', 'Create package angles, offers, price ranges, and selling points.', 'gpt-4.1', 'Complete'),
  (:user_id, 'outreach', 'Outreach Agent', 'Create email, SMS, follow-up, and DM outreach drafts.', 'gpt-4.1-mini', 'Needs Review'),
  (:user_id, 'reply-classifier', 'Reply Classifier Agent', 'Classify replies and recommend owner action.', 'gpt-4.1-mini', 'Complete'),
  (:user_id, 'website-intake', 'Website Intake Agent', 'Convert owner notes into website requirements.', 'gpt-4.1', 'Idle'),
  (:user_id, 'website-builder-1', 'Website Builder Agent 1', 'Create homepage structure, copy, CTAs, and service cards.', 'gpt-4.1', 'Running'),
  (:user_id, 'website-builder-2', 'Website Builder Agent 2', 'Create full page drafts and local SEO content.', 'gpt-4.1', 'Running'),
  (:user_id, 'qa', 'QA Agent', 'Check copy, links, mobile layout, forms, speed, and accessibility basics.', 'gpt-4.1-mini', 'Complete'),
  (:user_id, 'security-compliance', 'Security & Compliance Agent', 'Review outreach and website delivery for security, privacy, CASL/PIPEDA-style, and claim risk.', 'gpt-4.1', 'Blocked'),
  (:user_id, 'delivery', 'Delivery Agent', 'Prepare client preview messages, summaries, revision instructions, and next steps.', 'gpt-4.1-mini', 'Idle')
on conflict (user_id, key) do update
set name = excluded.name,
    purpose = excluded.purpose,
    model = excluded.model,
    status = excluded.status;

insert into public.leads (
  user_id,
  business_name,
  industry,
  city,
  website_url,
  email,
  phone,
  social_links,
  current_website_quality_score,
  google_presence_score,
  lead_score,
  status,
  notes,
  source,
  last_contacted,
  next_follow_up_date,
  compliance_status,
  estimated_value,
  owner_name
)
values
  (:user_id, 'Crown & Fade Barber Studio', 'Barber shop', 'Hamilton, ON', null, 'owner@crownfade.example', '+1 289-555-0101', '["instagram.com/crownfade"]'::jsonb, 12, 74, 94, 'Interested', 'Owner replied asking about a booking-first site.', 'Mock generated', now(), now() + interval '1 day', 'Approved', 4200, 'Mina Torres'),
  (:user_id, 'Northline Dental Care', 'Dentist', 'Mississauga, ON', 'https://northlinedental.example', 'hello@northlinedental.example', '+1 905-555-0112', '["facebook.com/northlinedental"]'::jsonb, 48, 82, 86, 'Owner Talking', 'Needs calmer look, insurance info, and new patient CTA.', 'Manual import', now(), now() + interval '3 hours', 'Approved', 7800, 'Dr. Priya Shah'),
  (:user_id, 'Juniper Table Bistro', 'Restaurant', 'Burlington, ON', 'https://junipertable.example', 'events@junipertable.example', '+1 905-555-0144', '["instagram.com/junipertable"]'::jsonb, 35, 79, 81, 'Outreach Sent', 'Old menu PDF and no online reservations.', 'Local restaurant list', now(), now() + interval '3 days', 'Approved', 5300, 'Evan Bouchard'),
  (:user_id, 'TorqueLab Auto Repair', 'Mechanic', 'London, ON', 'https://torquelabauto.example', 'service@torquelabauto.example', '+1 519-555-0180', '["facebook.com/torquelab"]'::jsonb, 27, 88, 91, 'Website In Progress', 'Needs service pages and fleet landing page.', 'Mock generated', now(), null, 'Approved', 6100, 'Devon Reed'),
  (:user_id, 'Luna Glow Beauty Lounge', 'Beauty salon', 'Vaughan, ON', null, 'hello@lunaglow.example', '+1 647-555-0190', '["instagram.com/lunaglowlounge"]'::jsonb, 10, 63, 87, 'Client Preview Ready', 'Preview packet needs final owner approval.', 'Instagram prospecting', now(), now(), 'Approved', 4700, 'Bianca Moretti');
