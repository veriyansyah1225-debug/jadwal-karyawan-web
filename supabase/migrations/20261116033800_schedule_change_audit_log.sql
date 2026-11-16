-- Permanent audit trail for employee schedule changes.
-- This migration is intentionally additive: it does not backfill or mutate existing schedules.

create table if not exists public.schedule_change_logs (
  id bigint generated always as identity primary key,
  changed_at timestamptz not null default clock_timestamp(),
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_user_id uuid,
  actor_name text,
  schedule_id bigint not null,
  old_employee_id bigint,
  new_employee_id bigint,
  old_employee_name text,
  new_employee_name text,
  old_schedule_date date,
  new_schedule_date date,
  old_schedule_code_id bigint,
  new_schedule_code_id bigint,
  old_schedule_code text,
  new_schedule_code text,
  old_schedule_name text,
  new_schedule_name text,
  old_note text,
  new_note text
);

comment on table public.schedule_change_logs is
  'Append-only snapshots of INSERT, UPDATE and DELETE operations on employee_schedules.';

create index if not exists schedule_change_logs_changed_at_idx
  on public.schedule_change_logs (changed_at desc);

create index if not exists schedule_change_logs_employee_date_idx
  on public.schedule_change_logs (coalesce(new_employee_id, old_employee_id), changed_at desc);

alter table public.schedule_change_logs enable row level security;

revoke all on table public.schedule_change_logs from anon, authenticated;
grant select on table public.schedule_change_logs to authenticated;

drop policy if exists "Active users can read schedule change logs" on public.schedule_change_logs;
create policy "Active users can read schedule change logs"
  on public.schedule_change_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles as profile
      where profile.user_id = (select auth.uid())
        and profile.aktif = true
    )
  );

create or replace function public.capture_employee_schedule_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_old_employee_name text;
  v_new_employee_name text;
  v_old_code text;
  v_new_code text;
  v_old_code_name text;
  v_new_code_name text;
begin
  if tg_op = 'UPDATE'
     and row(old.employee_id, old.tanggal, old.schedule_code_id, old.keterangan)
         is not distinct from
         row(new.employee_id, new.tanggal, new.schedule_code_id, new.keterangan) then
    return new;
  end if;

  if v_actor_id is not null then
    select coalesce(nullif(btrim(profile.nama), ''), profile.email)
      into v_actor_name
    from public.user_profiles as profile
    where profile.user_id = v_actor_id
    limit 1;
  end if;

  if tg_op <> 'INSERT' then
    select employee.nama into v_old_employee_name
    from public.employees as employee
    where employee.id = old.employee_id;

    select code.kode, code.nama
      into v_old_code, v_old_code_name
    from public.schedule_codes as code
    where code.id = old.schedule_code_id;
  end if;

  if tg_op <> 'DELETE' then
    select employee.nama into v_new_employee_name
    from public.employees as employee
    where employee.id = new.employee_id;

    select code.kode, code.nama
      into v_new_code, v_new_code_name
    from public.schedule_codes as code
    where code.id = new.schedule_code_id;
  end if;

  insert into public.schedule_change_logs (
    action,
    actor_user_id,
    actor_name,
    schedule_id,
    old_employee_id,
    new_employee_id,
    old_employee_name,
    new_employee_name,
    old_schedule_date,
    new_schedule_date,
    old_schedule_code_id,
    new_schedule_code_id,
    old_schedule_code,
    new_schedule_code,
    old_schedule_name,
    new_schedule_name,
    old_note,
    new_note
  ) values (
    tg_op,
    v_actor_id,
    v_actor_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op = 'INSERT' then null else old.employee_id end,
    case when tg_op = 'DELETE' then null else new.employee_id end,
    v_old_employee_name,
    v_new_employee_name,
    case when tg_op = 'INSERT' then null else old.tanggal end,
    case when tg_op = 'DELETE' then null else new.tanggal end,
    case when tg_op = 'INSERT' then null else old.schedule_code_id end,
    case when tg_op = 'DELETE' then null else new.schedule_code_id end,
    v_old_code,
    v_new_code,
    v_old_code_name,
    v_new_code_name,
    case when tg_op = 'INSERT' then null else old.keterangan end,
    case when tg_op = 'DELETE' then null else new.keterangan end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- The trigger is the only writer. Do not expose the trigger function as an RPC.
revoke all on function public.capture_employee_schedule_change() from public, anon, authenticated;

drop trigger if exists employee_schedules_audit_trigger on public.employee_schedules;
create trigger employee_schedules_audit_trigger
  after insert or update or delete on public.employee_schedules
  for each row
  execute function public.capture_employee_schedule_change();
