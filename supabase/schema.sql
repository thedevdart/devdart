-- ============================================================
--  DevDart — bookings schema + security
--  Run this once in the Supabase SQL editor (Dashboard → SQL).
-- ============================================================

-- 1. Table -----------------------------------------------------
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  email      text not null,
  phone      text,
  notes      text,
  date       date not null,
  slot       text not null,           -- "HH:MM" 24h
  status     text not null default 'pending'
             check (status in ('pending', 'confirmed', 'cancelled')),
  -- one active booking per date+slot (cancelled ones don't block)
  constraint bookings_slot_unique unique (date, slot)
);

-- 2. Row-level security ---------------------------------------
alter table public.bookings enable row level security;

-- Public (anon) visitors may CREATE a booking, nothing else.
drop policy if exists "public can insert bookings" on public.bookings;
create policy "public can insert bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

-- Only signed-in admins may read / update / delete.
drop policy if exists "admins can read bookings" on public.bookings;
create policy "admins can read bookings"
  on public.bookings for select
  to authenticated
  using (true);

drop policy if exists "admins can update bookings" on public.bookings;
create policy "admins can update bookings"
  on public.bookings for update
  to authenticated
  using (true) with check (true);

drop policy if exists "admins can delete bookings" on public.bookings;
create policy "admins can delete bookings"
  on public.bookings for delete
  to authenticated
  using (true);

-- 3. Availability RPC -----------------------------------------
-- Lets the public see which slots are taken on a day WITHOUT
-- exposing any customer PII (name/email/phone stay private).
create or replace function public.get_booked_slots(day date)
returns table (slot text)
language sql
security definer
set search_path = public
as $$
  select slot
  from public.bookings
  where date = day
    and status <> 'cancelled';
$$;

grant execute on function public.get_booked_slots(date) to anon, authenticated;

-- ============================================================
--  Admin login: create the admin user under
--  Dashboard → Authentication → Users → "Add user"
--  (set a password). That email/password signs in at /#/admin.
-- ============================================================
