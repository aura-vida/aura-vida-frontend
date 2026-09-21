GRANT EXECUTE ON FUNCTION public.my_practitioner_slug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;