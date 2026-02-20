begin;

-- Create a function to safely get all users (id + email) who are part of projects
-- accessible to the current user. This enables the member picker to show email addresses.
--
-- Returns: id (uuid), email (text)
-- Security: Only returns users visible through projects the authenticated user can access

create or replace function public.get_all_project_users()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct au.id, au.email
  from auth.users au
  where exists (
    -- User owns a project
    select 1
    from public.projects p
    where p.owner_id = au.id
      and public.is_project_owner_or_member(p.id)
  )
  or exists (
    -- User is a member of a project
    select 1
    from public.project_members pm
    where pm.user_id = au.id
      and public.is_project_owner_or_member(pm.project_id)
  )
  order by au.email;
$$;

grant execute on function public.get_all_project_users() to authenticated;

commit;
