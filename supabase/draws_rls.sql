-- RLS policies for draws + entries
-- Assumes `profiles.role` is 'admin' or 'subscriber'

-- Helper: check admin via profiles table
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- DRAWs
alter table public.draws enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'draws'
  loop
    execute format('drop policy if exists %I on public.draws;', r.policyname);
  end loop;
end $$;

-- Public (authenticated) can read published draws
create policy "draws_select_published"
on public.draws
for select
to authenticated
using (status = 'published');

-- Admin can do everything on draws
create policy "draws_admin_all"
on public.draws
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- DRAW_ENTRIES
alter table public.draw_entries enable row level security;

do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'draw_entries'
  loop
    execute format('drop policy if exists %I on public.draw_entries;', r.policyname);
  end loop;
end $$;

-- Users can read their own entries
create policy "draw_entries_select_own"
on public.draw_entries
for select
to authenticated
using (auth.uid() = user_id);

-- Admin can do everything on entries
create policy "draw_entries_admin_all"
on public.draw_entries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

