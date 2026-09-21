CREATE TABLE public.centres (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  pin text NOT NULL DEFAULT '',
  capacity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.centres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centres TO authenticated;
GRANT ALL ON public.centres TO service_role;

ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active centres" ON public.centres
FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert centres" ON public.centres
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update centres" ON public.centres
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete centres" ON public.centres
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_centres_updated_at BEFORE UPDATE ON public.centres
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.centres (name, area, pin, capacity, sort_order) VALUES
('Anahata Wellness Studio','Bandra West, Mumbai','400050',6,1),
('Prana Healing House','Indiranagar, Bengaluru','560038',4,2),
('Sattva Sanctuary','Hauz Khas, New Delhi','110016',6,3),
('Tarang Centre','Adyar, Chennai','600020',2,4),
('Bodhi Wellness Loft','Koregaon Park, Pune','411001',6,5),
('Antara Healing Rooms','Salt Lake, Kolkata','700091',3,6),
('Surya Studio','Banjara Hills, Hyderabad','500034',5,7),
('Veda Sanctuary','Vastrapur, Ahmedabad','380015',4,8);