create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  city text not null check (char_length(btrim(city)) between 1 and 100),
  venue text not null check (char_length(btrim(venue)) between 1 and 160),
  ticket_url text check (
    ticket_url is null
    or (
      char_length(ticket_url) <= 2048
      and ticket_url ~* '^https://'
    )
  ),
  sold_out boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shows_event_date_idx
  on public.shows (event_date);

create table if not exists public.show_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.shows enable row level security;
alter table public.show_admins enable row level security;

revoke all on public.shows from anon, authenticated;
grant select on public.shows to anon, authenticated;
grant insert, update, delete on public.shows to authenticated;

revoke all on public.show_admins from anon, authenticated;
grant select on public.show_admins to authenticated;

create or replace function public.is_show_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.show_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_show_admin() from public, anon;
grant execute on function public.is_show_admin() to authenticated;

drop policy if exists shows_public_read on public.shows;
create policy shows_public_read
  on public.shows
  for select
  to anon, authenticated
  using (true);

drop policy if exists shows_admin_insert on public.shows;
create policy shows_admin_insert
  on public.shows
  for insert
  to authenticated
  with check (public.is_show_admin());

drop policy if exists shows_admin_update on public.shows;
create policy shows_admin_update
  on public.shows
  for update
  to authenticated
  using (public.is_show_admin())
  with check (public.is_show_admin());

drop policy if exists shows_admin_delete on public.shows;
create policy shows_admin_delete
  on public.shows
  for delete
  to authenticated
  using (public.is_show_admin());

drop policy if exists show_admins_read_self on public.show_admins;
create policy show_admins_read_self
  on public.show_admins
  for select
  to authenticated
  using (user_id = auth.uid());
