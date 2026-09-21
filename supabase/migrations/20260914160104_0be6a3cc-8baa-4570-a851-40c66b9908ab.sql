create or replace function public.guard_practitioner_slug()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.practitioner_slug is distinct from old.practitioner_slug then
    new.practitioner_slug := old.practitioner_slug;
  end if;
  return new;
end; $$;
revoke all on function public.guard_practitioner_slug() from public, anon, authenticated;
create trigger profiles_guard_slug before update on public.profiles
  for each row execute function public.guard_practitioner_slug();