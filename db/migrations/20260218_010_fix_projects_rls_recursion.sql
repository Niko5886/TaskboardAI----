begin;

create or replace function public.is_project_owner_or_member(_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = _project_id
      and p.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = _project_id
      and pm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_project_owner_or_member(uuid) to authenticated;

drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member"
on public.projects
for select
to authenticated
using (public.is_project_owner_or_member(id));

commit;
