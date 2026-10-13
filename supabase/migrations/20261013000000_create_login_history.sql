create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  user_agent text
);

create index if not exists login_history_created_at_idx on public.login_history (created_at desc);
create index if not exists login_history_user_id_idx on public.login_history (user_id);

alter table public.login_history enable row level security;

grant select, insert on public.login_history to authenticated;

create policy login_history_admin_read
  on public.login_history for select to authenticated
  using (
    exists (
      select 1 from public.admin_users a
      where a.user_id = (select auth.uid())
        and a.role = 'admin'
        and a.aktif = true
    )
  );

create policy login_history_insert_self
  on public.login_history for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_profiles p
      where p.user_id = (select auth.uid()) and p.aktif = true
    )
  );
