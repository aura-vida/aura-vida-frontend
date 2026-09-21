
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid,
  add column if not exists credit_inr integer not null default 0;

update public.profiles
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending',
  reward_inr integer not null default 0,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;

alter table public.referrals enable row level security;

drop policy if exists "Users view their own referrals" on public.referrals;
create policy "Users view their own referrals"
on public.referrals for select to authenticated
using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

drop trigger if exists referrals_updated_at on public.referrals;
create trigger referrals_updated_at before update on public.referrals
for each row execute function public.update_updated_at_column();

-- keep referral fields and credit read-only for members
create or replace function public.guard_practitioner_slug()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.practitioner_slug is distinct from old.practitioner_slug then
    new.practitioner_slug := old.practitioner_slug;
  end if;
  if coalesce(current_setting('app.referral_ctx', true), '') <> 'on' then
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
    new.credit_inr := old.credit_inr;
  end if;
  return new;
end; $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  ref_code text;
  ref_id uuid;
begin
  ref_code := upper(nullif(new.raw_user_meta_data ->> 'referral_code', ''));
  if ref_code is not null then
    select id into ref_id from public.profiles where referral_code = ref_code;
  end if;

  insert into public.profiles (id, full_name, phone, referral_code, referred_by)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    upper(substr(replace(new.id::text, '-', ''), 1, 8)),
    case when ref_id = new.id then null else ref_id end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict do nothing;

  if ref_id is not null and ref_id <> new.id then
    insert into public.referrals (referrer_id, referred_user_id)
    values (ref_id, new.id)
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
end; $$;

create or replace function public.credit_referral_on_first_booking()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.referrals%rowtype;
begin
  if new.amount is null then
    return new;
  end if;

  select * into r from public.referrals
  where referred_user_id = new.client_id and status = 'pending';

  if not found then
    return new;
  end if;

  update public.referrals
  set status = 'credited', reward_inr = 200, credited_at = now()
  where id = r.id;

  perform set_config('app.referral_ctx', 'on', true);
  update public.profiles
  set credit_inr = credit_inr + 200
  where id in (r.referrer_id, r.referred_user_id);
  perform set_config('app.referral_ctx', '', true);

  return new;
end; $$;

revoke execute on function public.credit_referral_on_first_booking() from public, anon, authenticated;

drop trigger if exists bookings_referral_credit on public.bookings;
create trigger bookings_referral_credit after insert on public.bookings
for each row execute function public.credit_referral_on_first_booking();
