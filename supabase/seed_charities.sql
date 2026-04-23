-- Seed a few charities for local development/testing

insert into public.charities (name, description, image_url, website_url, is_featured, upcoming_events)
values
(
  'Fairways For Futures',
  'Supporting youth education through community sports funding and mentorship.',
  null,
  'https://example.org/fairways-for-futures',
  true,
  '[{"title":"Community Golf Day","date":"2026-05-20","description":"A charity golf day supporting local schools."}]'::jsonb
),
(
  'Clean Water Collective',
  'Funding clean-water access projects with transparent, measurable impact.',
  null,
  'https://example.org/clean-water',
  false,
  '[]'::jsonb
),
(
  'Mind & Motion',
  'Mental health support and wellbeing programs with a focus on men’s health.',
  null,
  'https://example.org/mind-and-motion',
  false,
  '[{"title":"Wellbeing Walk","date":"2026-06-10","description":"A community walk and fundraiser."}]'::jsonb
);

