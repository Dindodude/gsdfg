alter table public.leads
  add column if not exists google_review_count integer,
  add column if not exists has_website boolean not null default false,
  add column if not exists external_source_id text;

create index if not exists leads_user_targeting_idx
  on public.leads(user_id, source, google_review_count, has_website);

create unique index if not exists leads_user_external_source_unique_idx
  on public.leads(user_id, source, external_source_id)
  where external_source_id is not null;
