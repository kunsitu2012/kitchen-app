-- Kitchen shared state v1. Run once in Supabase SQL Editor.
-- Existing inventory tables are not changed.
create table if not exists public.kitchen_snapshots (
  household_id uuid primary key references public.households(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.kitchen_snapshots enable row level security;
revoke all on public.kitchen_snapshots from anon;
grant select, insert on public.kitchen_snapshots to authenticated;
revoke update, delete on public.kitchen_snapshots from authenticated;
-- Do not grant UPDATE/DELETE directly: all writes after migration go through CAS RPC.
create policy "kitchen_snapshots_read" on public.kitchen_snapshots
  for select to authenticated using (public.is_household_member(household_id));
create policy "kitchen_snapshots_first_import" on public.kitchen_snapshots
  for insert to authenticated with check (public.is_household_member(household_id));
create or replace function public.save_kitchen_snapshot(
  p_household_id uuid, p_expected_revision bigint, p_data jsonb
) returns bigint language plpgsql security definer set search_path = '' as $$
declare new_revision bigint;
begin
  if auth.uid() is null or not public.is_household_member(p_household_id) then
    raise exception 'Household access denied';
  end if;
  update public.kitchen_snapshots
  set data=p_data, revision=revision+1, updated_at=now()
  where household_id=p_household_id and revision=p_expected_revision
  returning revision into new_revision;
  if new_revision is null then
    raise exception 'Version conflict: household data changed on another device. Reload before editing.';
  end if;
  return new_revision;
end; $$;
revoke all on function public.save_kitchen_snapshot(uuid,bigint,jsonb) from public, anon;
grant execute on function public.save_kitchen_snapshot(uuid,bigint,jsonb) to authenticated;
select 'Kitchen shared storage installed' as result;
