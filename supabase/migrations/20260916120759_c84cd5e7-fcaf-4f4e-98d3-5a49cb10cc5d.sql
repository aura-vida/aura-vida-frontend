REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

DROP POLICY IF EXISTS "Anyone can view published practitioners" ON public.practitioners;
CREATE POLICY "Public can view published practitioners"
  ON public.practitioners FOR SELECT TO anon, authenticated
  USING (is_published);
CREATE POLICY "Admins can view all practitioners"
  ON public.practitioners FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can view active centres" ON public.centres;
CREATE POLICY "Public can view active centres"
  ON public.centres FOR SELECT TO anon, authenticated
  USING (is_active);
CREATE POLICY "Admins can view all centres"
  ON public.centres FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));