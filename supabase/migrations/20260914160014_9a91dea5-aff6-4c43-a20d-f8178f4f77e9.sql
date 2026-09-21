revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke all on function public.my_practitioner_slug() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;