begin;

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists idx_project_members_user_id
  on public.project_members(user_id);

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

alter table public.project_members enable row level security;

drop policy if exists "project_members_select_member" on public.project_members;
drop policy if exists "project_members_insert_owner" on public.project_members;
drop policy if exists "project_members_update_owner" on public.project_members;
drop policy if exists "project_members_delete_owner" on public.project_members;
drop policy if exists "project_members_select_fix" on public.project_members;
drop policy if exists "project_members_insert_fix" on public.project_members;
drop policy if exists "project_members_update_fix" on public.project_members;
drop policy if exists "project_members_delete_fix" on public.project_members;

create policy "project_members_select_owner_or_self"
on public.project_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_members_insert_owner"
on public.project_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_members_update_owner"
on public.project_members
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = auth.uid()
  )
);

create policy "project_members_delete_owner"
on public.project_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_stages_select_member" on public.project_stages;
drop policy if exists "project_stages_insert_member" on public.project_stages;
drop policy if exists "project_stages_update_member" on public.project_stages;
drop policy if exists "project_stages_delete_member" on public.project_stages;

create policy "project_stages_select_member"
on public.project_stages
for select
to authenticated
using (public.is_project_owner_or_member(project_id));

create policy "project_stages_insert_member"
on public.project_stages
for insert
to authenticated
with check (public.is_project_owner_or_member(project_id));

create policy "project_stages_update_member"
on public.project_stages
for update
to authenticated
using (public.is_project_owner_or_member(project_id))
with check (public.is_project_owner_or_member(project_id));

create policy "project_stages_delete_member"
on public.project_stages
for delete
to authenticated
using (public.is_project_owner_or_member(project_id));

drop policy if exists "tasks_select_member" on public.tasks;
drop policy if exists "tasks_insert_member" on public.tasks;
drop policy if exists "tasks_update_member" on public.tasks;
drop policy if exists "tasks_delete_member" on public.tasks;

create policy "tasks_select_member"
on public.tasks
for select
to authenticated
using (public.is_project_owner_or_member(project_id));

create policy "tasks_insert_member"
on public.tasks
for insert
to authenticated
with check (public.is_project_owner_or_member(project_id));

create policy "tasks_update_member"
on public.tasks
for update
to authenticated
using (public.is_project_owner_or_member(project_id))
with check (public.is_project_owner_or_member(project_id));

create policy "tasks_delete_member"
on public.tasks
for delete
to authenticated
using (public.is_project_owner_or_member(project_id));

drop policy if exists "task_attachments_select_member" on public.task_attachments;
create policy "task_attachments_select_member"
on public.task_attachments
for select
to authenticated
using (public.is_project_owner_or_member(project_id));

drop policy if exists "task_attachments_insert_member" on public.task_attachments;
create policy "task_attachments_insert_member"
on public.task_attachments
for insert
to authenticated
with check (
  public.is_project_owner_or_member(project_id)
  and exists (
    select 1
    from public.tasks t
    where t.id = task_id
      and t.project_id = project_id
  )
);

drop policy if exists "task_attachments_update_member" on public.task_attachments;
create policy "task_attachments_update_member"
on public.task_attachments
for update
to authenticated
using (public.is_project_owner_or_member(project_id))
with check (public.is_project_owner_or_member(project_id));

drop policy if exists "task_attachments_delete_member" on public.task_attachments;
create policy "task_attachments_delete_member"
on public.task_attachments
for delete
to authenticated
using (public.is_project_owner_or_member(project_id));

create or replace function public.can_access_task_attachment_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id::text = split_part(object_name, '/', 1)
      and public.is_project_owner_or_member(t.project_id)
  );
$$;

grant execute on function public.can_access_task_attachment_object(text) to authenticated;

commit;