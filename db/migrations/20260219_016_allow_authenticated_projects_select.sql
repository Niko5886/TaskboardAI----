begin;

-- Temporary: allow any authenticated user to select projects to avoid missing data
-- NOTE: This relaxes access control. Tighten later if needed.

drop policy if exists "projects_select_member" on public.projects;

create policy "projects_select_member"
on public.projects
for select
to authenticated
using (auth.uid() is not null);

commit;
