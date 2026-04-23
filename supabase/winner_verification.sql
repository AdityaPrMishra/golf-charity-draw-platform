-- Winner verification: Storage bucket + RLS policies
-- Run in Supabase SQL Editor.

-- 1) Ensure helper exists (used by policies)
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- 2) draw_entries: allow winners to upload proof (update their own row)
alter table public.draw_entries enable row level security;

drop policy if exists "draw_entries_update_proof_own" on public.draw_entries;
create policy "draw_entries_update_proof_own"
on public.draw_entries
for update
to authenticated
using (auth.uid() = user_id and is_winner = true)
with check (auth.uid() = user_id and is_winner = true);

-- 3) Create storage bucket (private)
insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', false)
on conflict (id) do nothing;

-- 4) Storage policies
-- Files stored at: {user_id}/{draw_entry_id}/{filename}

drop policy if exists "winner_proofs_read_own" on storage.objects;
create policy "winner_proofs_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'winner-proofs'
  and (split_part(name, '/', 1))::uuid = auth.uid()
);

drop policy if exists "winner_proofs_insert_own" on storage.objects;
create policy "winner_proofs_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'winner-proofs'
  and (split_part(name, '/', 1))::uuid = auth.uid()
);

drop policy if exists "winner_proofs_update_own" on storage.objects;
create policy "winner_proofs_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'winner-proofs'
  and (split_part(name, '/', 1))::uuid = auth.uid()
)
with check (
  bucket_id = 'winner-proofs'
  and (split_part(name, '/', 1))::uuid = auth.uid()
);

drop policy if exists "winner_proofs_delete_own" on storage.objects;
create policy "winner_proofs_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'winner-proofs'
  and (split_part(name, '/', 1))::uuid = auth.uid()
);

-- Admin: read all proofs
drop policy if exists "winner_proofs_admin_read_all" on storage.objects;
create policy "winner_proofs_admin_read_all"
on storage.objects
for select
to authenticated
using (bucket_id = 'winner-proofs' and public.is_admin());

