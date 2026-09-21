CREATE TABLE public.practitioners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  craft text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  rating numeric(3,2) NOT NULL DEFAULT 5.0,
  sessions integer NOT NULL DEFAULT 0,
  price_inr integer NOT NULL DEFAULT 0,
  image_url text,
  bio text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  bookable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.practitioners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practitioners TO authenticated;
GRANT ALL ON public.practitioners TO service_role;

ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published practitioners"
ON public.practitioners FOR SELECT
USING (is_published OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert practitioners"
ON public.practitioners FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update practitioners"
ON public.practitioners FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete practitioners"
ON public.practitioners FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_practitioners_updated_at
BEFORE UPDATE ON public.practitioners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;