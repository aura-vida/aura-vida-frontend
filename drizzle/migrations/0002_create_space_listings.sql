CREATE TABLE public.space_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  space_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  pin text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  space_type text,
  amenities text,
  availability text,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT space_listings_len CHECK (char_length(contact_name) <= 100 AND char_length(email) <= 255 AND char_length(space_name) <= 150 AND char_length(address) <= 400 AND char_length(city) <= 100 AND char_length(pin) <= 10 AND capacity BETWEEN 1 AND 500 AND char_length(coalesce(notes,'')) <= 2000 AND char_length(coalesce(amenities,'')) <= 1000 AND char_length(coalesce(availability,'')) <= 500)
);
GRANT INSERT ON public.space_listings TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.space_listings TO authenticated;
GRANT ALL ON public.space_listings TO service_role;
ALTER TABLE public.space_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a space" ON public.space_listings FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY "Admins view space listings" ON public.space_listings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update space listings" ON public.space_listings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete space listings" ON public.space_listings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));