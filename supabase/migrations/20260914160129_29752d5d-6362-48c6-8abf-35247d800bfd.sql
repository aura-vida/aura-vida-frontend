create or replace function public.guard_practitioner_slug_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.practitioner_slug := null;
  return new;
end; $$;
revoke all on function public.guard_practitioner_slug_insert() from public, anon, authenticated;
create trigger profiles_guard_slug_insert before insert on public.profiles
  for each row when (current_setting('role', true) <> 'service_role')
  execute function public.guard_practitioner_slug_insert();