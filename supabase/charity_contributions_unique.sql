-- Prevent duplicate contribution rows per billing period
-- Run in Supabase SQL Editor.

create unique index if not exists charity_contributions_unique_period
on public.charity_contributions (user_id, subscription_id, period_date);

