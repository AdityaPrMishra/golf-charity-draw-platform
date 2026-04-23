-- Enforce: only 5 most recent scores per user (by score_date desc).
-- Run in Supabase SQL Editor after schema.sql.

drop trigger if exists scores_enforce_latest_5 on public.scores;
drop function if exists public.enforce_latest_5_scores();

create function public.enforce_latest_5_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Keep only the 5 most recent score_dates per user.
  delete from public.scores s
  where s.user_id = new.user_id
    and s.id not in (
      select id
      from public.scores
      where user_id = new.user_id
      order by score_date desc, created_at desc
      limit 5
    );

  return new;
end;
$$;

create trigger scores_enforce_latest_5
after insert or update on public.scores
for each row
execute procedure public.enforce_latest_5_scores();

