-- Follow-up hardening for the initial Caspian portal schema.
drop policy if exists "admins manage staff profiles" on public.staff_profiles;
create policy "admins insert staff profiles" on public.staff_profiles for insert to authenticated
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
create policy "admins update staff profiles" on public.staff_profiles for update to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')))
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
create policy "admins delete staff profiles" on public.staff_profiles for delete to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins insert site settings" on public.site_settings for insert to authenticated
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
create policy "admins update site settings" on public.site_settings for update to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')))
with check (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
create policy "admins delete site settings" on public.site_settings for delete to authenticated
using (exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
create index if not exists ticket_messages_author_id_idx on public.ticket_messages(author_id);
create or replace function public.handle_new_ticket_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.ticket_messages(ticket_id, author_id, message, is_staff)
  values (new.id, new.user_id, new.message, false);
  return new;
end;
$$;
drop trigger if exists on_ticket_created_add_first_message on public.tickets;
create trigger on_ticket_created_add_first_message after insert on public.tickets
for each row execute function public.handle_new_ticket_message();
create or replace function public.set_ticket_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_ticket_updated_at on public.tickets;
create trigger set_ticket_updated_at before update on public.tickets
for each row execute function public.set_ticket_updated_at();
revoke execute on function public.handle_new_ticket_message() from public, anon, authenticated;
drop policy if exists "public reads published staff" on public.staff_profiles;
drop policy if exists "admins read hidden staff profiles" on public.staff_profiles;
create policy "public and admins read staff profiles" on public.staff_profiles for select to anon, authenticated
using (is_public = true or exists (select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role in ('owner','founder','supervisor','admin')));
