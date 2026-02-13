begin;

create type public.roles as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.userroles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.roles not null default 'user',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  order_position numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name),
  unique (project_id, order_position),
  unique (project_id, id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid not null,
  title text not null,
  description_html text,
  order_position numeric not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_project_stage_fk
    foreign key (project_id, stage_id)
    references public.project_stages(project_id, id)
    on delete cascade
);

create index idx_projects_owner_user_id on public.projects(owner_user_id);
create index idx_project_members_user_id on public.project_members(user_id);
create index idx_project_stages_project_id on public.project_stages(project_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_stage_id on public.tasks(stage_id);
create index idx_tasks_project_stage_order on public.tasks(project_id, stage_id, order_position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger trg_project_stages_set_updated_at
before update on public.project_stages
for each row execute function public.set_updated_at();

create trigger trg_tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.userroles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

create or replace function public.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_uuid
      and pm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.userroles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_stages enable row level security;
alter table public.tasks enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "userroles_select_own_or_admin"
on public.userroles
for select
using (user_id = auth.uid() or public.is_admin());

create policy "userroles_manage_admin"
on public.userroles
for all
using (public.is_admin())
with check (public.is_admin());

create policy "projects_select_member"
on public.projects
for select
using (public.is_project_member(id) or public.is_admin());

create policy "projects_insert_owner"
on public.projects
for insert
with check (owner_user_id = auth.uid() or public.is_admin());

create policy "projects_update_owner"
on public.projects
for update
using (owner_user_id = auth.uid() or public.is_admin())
with check (owner_user_id = auth.uid() or public.is_admin());

create policy "projects_delete_owner"
on public.projects
for delete
using (owner_user_id = auth.uid() or public.is_admin());

create policy "project_members_select_member"
on public.project_members
for select
using (public.is_project_member(project_id) or public.is_admin());

create policy "project_members_manage_owner"
on public.project_members
for insert
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
);

create policy "project_members_update_owner"
on public.project_members
for update
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
);

create policy "project_members_delete_owner"
on public.project_members
for delete
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.owner_user_id = auth.uid() or public.is_admin())
  )
);

create policy "project_stages_select_member"
on public.project_stages
for select
using (public.is_project_member(project_id) or public.is_admin());

create policy "project_stages_insert_member"
on public.project_stages
for insert
with check (public.is_project_member(project_id) or public.is_admin());

create policy "project_stages_update_member"
on public.project_stages
for update
using (public.is_project_member(project_id) or public.is_admin())
with check (public.is_project_member(project_id) or public.is_admin());

create policy "project_stages_delete_member"
on public.project_stages
for delete
using (public.is_project_member(project_id) or public.is_admin());

create policy "tasks_select_member"
on public.tasks
for select
using (public.is_project_member(project_id) or public.is_admin());

create policy "tasks_insert_member"
on public.tasks
for insert
with check (public.is_project_member(project_id) or public.is_admin());

create policy "tasks_update_member"
on public.tasks
for update
using (public.is_project_member(project_id) or public.is_admin())
with check (public.is_project_member(project_id) or public.is_admin());

create policy "tasks_delete_member"
on public.tasks
for delete
using (public.is_project_member(project_id) or public.is_admin());

commit;
