GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT SELECT ON public.practitioners TO anon, authenticated;
GRANT SELECT ON public.centres TO anon, authenticated;
GRANT ALL ON public.practitioners TO service_role;
GRANT ALL ON public.centres TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.practitioners TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.centres TO authenticated;