-- CASPIAN ROLEPLAY portal schema
-- Apply only to a NEW, dedicated Caspian Supabase project after reviewing it.
create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','founder','supervisor','admin','moderator','support','faction_leader','player')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  role_label text not null,
  department text,
  bio text,
  avatar_url text,
  sort_order integer not null default 100,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 100),
  message text not null check (char_length(message) between 10 and 4000),
  category text not null check (category in ('technical','report','appeal','account','other')),
  status text not null default 'open' check (status in ('open','in_progress','answered','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 4000),
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists tickets_user_created_idx on public.tickets(user_id, created_at desc);
create index if not exists tickets_status_created_idx on public.tickets(status, created_at desc);
create index if not exists ticket_messages_ticket_created_idx on public.ticket_messages(ticket_id, created_at);

alter table public.user_roles enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.site_settings enable row level security;

-- The role table is readable only for the signed-in user's own role rows.
-- There are intentionally no client-side INSERT/UPDATE/DELETE policies.
create policy "read own role rows" on public.user_roles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "public reads published staff" on public.staff_profiles for select to anon, authenticated
using (is_public = true or exists (
  select 1 from public.user_roles r
  where r.user_id = (select auth.uid())
  and r.role in ('owner','founder','supervisor','admin')
));

create policy "admins manage staff profiles" on public.staff_profiles for all to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')))
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));

create policy "players create own tickets" on public.tickets for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "players read own tickets and staff read all" on public.tickets for select to authenticated
using ((select auth.uid()) = user_id or exists (
  select 1 from public.user_roles r where r.user_id=(select auth.uid())
  and r.role in ('owner','founder','supervisor','admin','moderator','support')
));
create policy "staff update tickets" on public.tickets for update to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin','moderator','support')))
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin','moderator','support')));

create policy "ticket owner and staff read messages" on public.ticket_messages for select to authenticated
using (
  exists (select 1 from public.tickets t where t.id=ticket_id and t.user_id=(select auth.uid()))
  or exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin','moderator','support'))
);
create policy "ticket owner and staff add messages" on public.ticket_messages for insert to authenticated
with check (
  (select auth.uid()) = author_id and (
    (is_staff = false and exists (select 1 from public.tickets t where t.id=ticket_id and t.user_id=(select auth.uid())))
    or
    (is_staff = true and exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin','moderator','support')))
  )
);

create policy "public reads donation setting only" on public.site_settings for select to anon, authenticated
using (key = 'donation_url');
create policy "admins manage site settings" on public.site_settings for all to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')))
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));

-- Explicit Data API grants: tables are not automatically exposed in current Supabase projects.
grant select on public.staff_profiles to anon, authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
