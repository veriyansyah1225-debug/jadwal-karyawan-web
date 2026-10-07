alter table public.user_profiles
  add column if not exists email text;

update public.user_profiles up
set email = au.email
from auth.users au
where au.id = up.user_id
  and (up.email is null or up.email = '');

create unique index if not exists user_profiles_email_unique_idx
  on public.user_profiles (lower(email))
  where email is not null;
