CREATE TABLE public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);