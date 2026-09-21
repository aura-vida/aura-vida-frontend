-- roles
create type public.app_role as enum ('admin','practitioner','client');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  practitioner_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.my_practitioner_slug()
returns text language sql stable security definer set search_path = public as $$
  select practitioner_slug from public.profiles where id = auth.uid()
$$;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  practitioner_slug text not null,
  practitioner_name text not null,
  item_id text not null,
  amount integer,
  currency text not null default 'INR',
  mode text not null default 'online',
  pin text,
  scheduled_at timestamptz,
  status text not null default 'upcoming',
  razorpay_order_id text,
  aftercare_notes text,
  aftercare_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

create policy "Clients view own bookings" on public.bookings for select to authenticated
  using (auth.uid() = client_id or practitioner_slug = public.my_practitioner_slug());
create policy "Clients create own bookings" on public.bookings for insert to authenticated
  with check (auth.uid() = client_id);
create policy "Practitioners update their bookings" on public.bookings for update to authenticated
  using (practitioner_slug = public.my_practitioner_slug())
  with check (practitioner_slug = public.my_practitioner_slug());

create index bookings_client_idx on public.bookings (client_id);
create index bookings_practitioner_idx on public.bookings (practitioner_slug);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.update_updated_at_column();

-- auto-create profile + client role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();