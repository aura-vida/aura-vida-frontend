REVOKE EXECUTE ON FUNCTION public.my_practitioner_slug() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

DROP POLICY IF EXISTS "Clients view own bookings" ON public.bookings;
CREATE POLICY "Clients view own bookings" ON public.bookings
FOR SELECT TO authenticated
USING (
  auth.uid() = client_id
  OR practitioner_slug = (SELECT p.practitioner_slug FROM public.profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "Practitioners update their bookings" ON public.bookings;
CREATE POLICY "Practitioners update their bookings" ON public.bookings
FOR UPDATE TO authenticated
USING (practitioner_slug = (SELECT p.practitioner_slug FROM public.profiles p WHERE p.id = auth.uid()))
WITH CHECK (practitioner_slug = (SELECT p.practitioner_slug FROM public.profiles p WHERE p.id = auth.uid()));