begin;

drop policy if exists "projects_select_member" on public.projects;

create policy "projects_select_member"
on public.projects
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = projects.id
      and pm.user_id = auth.uid()
  )
);

commit;
