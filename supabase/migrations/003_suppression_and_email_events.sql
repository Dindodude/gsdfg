alter table public.outreach_messages
  add column if not exists delivery_status text not null default 'Draft'
    check (delivery_status in ('Draft', 'Sent', 'Delivered', 'Delivery Delayed', 'Bounced', 'Complained', 'Failed', 'Suppressed', 'Opened', 'Clicked')),
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists last_event_at timestamptz;

create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_type text not null check (contact_type in ('Email', 'SMS')),
  email text,
  phone text,
  reason text not null default 'manual',
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  suppressed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (
    (contact_type = 'Email' and email is not null)
    or (contact_type = 'SMS' and phone is not null)
  ),
  unique (user_id, email),
  unique (user_id, phone)
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  outreach_message_id uuid references public.outreach_messages(id) on delete set null,
  provider_message_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.suppression_list enable row level security;
alter table public.email_events enable row level security;

create policy "Owners can manage suppression list" on public.suppression_list
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owners can read email events" on public.email_events
  for select using (auth.uid() = user_id);

create index if not exists suppression_list_email_idx on public.suppression_list(user_id, email);
create index if not exists suppression_list_phone_idx on public.suppression_list(user_id, phone);
create index if not exists email_events_provider_idx on public.email_events(provider_message_id, event_type);
create index if not exists email_events_user_created_idx on public.email_events(user_id, created_at desc);
