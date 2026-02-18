begin;

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  file_type text,
  file_size bigint not null default 0 check (file_size >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_attachments_task_id
  on public.task_attachments(task_id);

create index if not exists idx_task_attachments_project_id
  on public.task_attachments(project_id);

alter table public.task_attachments enable row level security;

drop policy if exists "task_attachments_select_member" on public.task_attachments;
create policy "task_attachments_select_member"
on public.task_attachments
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "task_attachments_insert_member" on public.task_attachments;
create policy "task_attachments_insert_member"
on public.task_attachments
for insert
to authenticated
with check (
  public.is_project_member(project_id)
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
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

drop policy if exists "task_attachments_delete_member" on public.task_attachments;
create policy "task_attachments_delete_member"
on public.task_attachments
for delete
to authenticated
using (public.is_project_member(project_id));

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do update
set public = excluded.public;

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
      and public.is_project_member(t.project_id)
  );
$$;

grant execute on function public.can_access_task_attachment_object(text) to authenticated;

drop policy if exists "task_attachment_objects_select" on storage.objects;
create policy "task_attachment_objects_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-attachments'
  and public.can_access_task_attachment_object(name)
);

drop policy if exists "task_attachment_objects_insert" on storage.objects;
create policy "task_attachment_objects_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-attachments'
  and public.can_access_task_attachment_object(name)
);

drop policy if exists "task_attachment_objects_update" on storage.objects;
create policy "task_attachment_objects_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'task-attachments'
  and public.can_access_task_attachment_object(name)
)
with check (
  bucket_id = 'task-attachments'
  and public.can_access_task_attachment_object(name)
);

drop policy if exists "task_attachment_objects_delete" on storage.objects;
create policy "task_attachment_objects_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'task-attachments'
  and public.can_access_task_attachment_object(name)
);

commit;
