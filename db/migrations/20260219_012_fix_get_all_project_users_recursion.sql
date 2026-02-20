begin;

-- Fix the get_all_project_users() function to avoid RLS recursion
-- Rewrite without calling is_project_owner_or_member to prevent infinite loops

drop function if exists public.get_all_project_users();

create or replace function public.get_all_project_users()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct au.id, au.email
  from auth.users au
  where au.id != auth.uid()
  and (
    -- User owns a project that current user can see
    exists (
      select 1
      from public.projects p
      where p.owner_id = au.id
        and p.owner_id = auth.uid()
    )
    or exists (
      -- User is a member of a project that current user owns
      select 1
      from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where pm.user_id = au.id
        and p.owner_id = auth.uid()
    )
    or exists (
      -- Current user is a member of a project this user owns
      select 1
      from public.projects p
      join public.project_members pm on pm.project_id = p.id
      where p.owner_id = au.id
        and pm.user_id = auth.uid()
    )
    or exists (
      -- Both users are members of same project
      select 1
      from public.project_members pm1
      join public.project_members pm2 on pm2.project_id = pm1.project_id
      where pm1.user_id = au.id
        and pm2.user_id = auth.uid()
    )
  )
  order by au.email;
$$;

grant execute on function public.get_all_project_users() to authenticated;

commit;
