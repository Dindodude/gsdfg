drop index if exists leads_user_external_source_unique_idx;

create unique index if not exists leads_user_external_source_unique_idx
  on public.leads(user_id, source, external_source_id);
