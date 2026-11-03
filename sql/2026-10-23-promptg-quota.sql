-- PromptGuard v2 quota schema.
-- Applied through the Supabase MCP on 2026-10-23 (migration promptg_quota_schema).
-- This file is the versioned record of the DDL that lives in the database.

create table public.promptg_quota (
  scope text not null,
  scope_key text not null,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (scope, scope_key, day)
);

alter table public.promptg_quota enable row level security;

create policy promptg_quota_deny_anon on public.promptg_quota
  for all to anon using (false) with check (false);

create policy promptg_quota_deny_authenticated on public.promptg_quota
  for all to authenticated using (false) with check (false);

revoke all on public.promptg_quota from anon, authenticated;
grant select, insert, update, delete on public.promptg_quota to service_role;

-- Increment and limit check happen in the same statement, so concurrent calls
-- cannot exceed the limit. `found` is false when the WHERE blocks the update,
-- and in that case the counter is not touched.
create or replace function public.promptg_consume_quota(
  p_scope text,
  p_scope_key text,
  p_day date,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit < 1 then
    return false;
  end if;

  insert into public.promptg_quota (scope, scope_key, day, count)
  values (p_scope, p_scope_key, p_day, 1)
  on conflict (scope, scope_key, day) do update
    set count = public.promptg_quota.count + 1
    where public.promptg_quota.count < p_limit;

  return found;
end;
$$;

revoke all on function public.promptg_consume_quota(text, text, date, integer)
  from public, anon, authenticated;
grant execute on function public.promptg_consume_quota(text, text, date, integer)
  to service_role;

-- v1 tables that stored user prompts and audit state. Removed on purpose.
drop table if exists public.promptg_attacks_library;
drop table if exists public.promptg_audit_logs;
drop table if exists public.promptg_audit_progress;
