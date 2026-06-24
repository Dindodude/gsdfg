create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  agency_name text default 'AgencyForge AI',
  role text not null default 'owner' check (role in ('owner', 'admin', 'operator', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  industry text not null,
  city text not null,
  website_url text,
  email text,
  phone text,
  social_links jsonb not null default '[]'::jsonb,
  current_website_quality_score integer not null default 0 check (current_website_quality_score between 0 and 100),
  google_presence_score integer not null default 0 check (google_presence_score between 0 and 100),
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  status text not null default 'New',
  notes text not null default '',
  source text not null default 'Manual import',
  last_contacted timestamptz,
  next_follow_up_date timestamptz,
  compliance_status text not null default 'Pending' check (compliance_status in ('Pending', 'Approved', 'Blocked', 'Needs Fixes')),
  estimated_value numeric(12,2) not null default 0,
  owner_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  key text not null,
  name text not null,
  purpose text not null,
  model text not null,
  status text not null default 'Idle',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'blocked')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  risk_level text check (risk_level in ('Low', 'Medium', 'High')),
  token_usage jsonb not null default '{}'::jsonb,
  cost_estimate numeric(10,4) not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('Email', 'SMS', 'DM')),
  subject text,
  body text not null,
  status text not null default 'Draft' check (status in ('Draft', 'Approved', 'Sent', 'Blocked')),
  compliance_status text not null default 'Pending' check (compliance_status in ('Pending', 'Approved', 'Blocked', 'Needs Fixes')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null check (channel in ('Email', 'SMS', 'DM')),
  message text not null,
  classification text not null check (classification in ('Interested', 'Not interested', 'Needs more info', 'Call requested', 'Wrong contact', 'Do not contact')),
  confidence integer not null default 0 check (confidence between 0 and 100),
  received_at timestamptz not null default now()
);

create table if not exists public.website_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  package_name text not null,
  status text not null default 'Intake',
  progress integer not null default 0 check (progress between 0 and 100),
  brand_style text,
  primary_goal text,
  preview_url text,
  estimated_revenue numeric(12,2) not null default 0,
  requirements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  website_project_id uuid not null references public.website_projects(id) on delete cascade,
  page_name text not null,
  slug text not null,
  status text not null default 'Draft',
  seo_title text,
  sections jsonb not null default '[]'::jsonb,
  generated_component text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  target_type text not null check (target_type in ('Outreach', 'Website Content', 'Contact Form', 'Privacy', 'Delivery')),
  target_name text not null,
  risk_level text not null check (risk_level in ('Low', 'Medium', 'High')),
  issues_found jsonb not null default '[]'::jsonb,
  fixes_required jsonb not null default '[]'::jsonb,
  status text not null check (status in ('Approved', 'Blocked', 'Needs Fixes')),
  agent_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  description text not null default '',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Done')),
  action text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor text not null,
  action text not null,
  target text not null,
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  agency_name text not null default 'AgencyForge AI',
  owner_name text,
  sender_email text,
  sender_phone text,
  mock_mode boolean not null default true,
  compliance_region text not null default 'Canada' check (compliance_region in ('Canada', 'United States', 'Mixed')),
  integrations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.agents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.replies enable row level security;
alter table public.website_projects enable row level security;
alter table public.website_pages enable row level security;
alter table public.compliance_reviews enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Owners can manage leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage agents" on public.agents
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
create policy "Owners can manage agent runs" on public.agent_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage outreach" on public.outreach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage replies" on public.replies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage website projects" on public.website_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage website pages" on public.website_pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage compliance reviews" on public.compliance_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can manage tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners can read activity logs" on public.activity_logs
  for select using (auth.uid() = user_id);
create policy "Owners can insert activity logs" on public.activity_logs
  for insert with check (auth.uid() = user_id);
create policy "Owners can manage settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists leads_user_status_idx on public.leads(user_id, status);
create index if not exists leads_user_score_idx on public.leads(user_id, lead_score desc);
create index if not exists agent_runs_user_started_idx on public.agent_runs(user_id, started_at desc);
create index if not exists outreach_lead_idx on public.outreach_messages(lead_id);
create index if not exists website_projects_lead_idx on public.website_projects(lead_id);
create index if not exists compliance_reviews_user_risk_idx on public.compliance_reviews(user_id, risk_level, status);
create index if not exists tasks_user_status_due_idx on public.tasks(user_id, status, due_at);
