ALTER TABLE public.bookings
  ADD COLUMN group_size integer NOT NULL DEFAULT 1,
  ADD COLUMN attendees text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_group_size_range CHECK (group_size >= 1 AND group_size <= 6);