begin;

create or replace function public.get_all_project_users()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select au.id, au.email
  from auth.users au
  where au.id <> auth.uid()
  order by au.email;
$$;

grant execute on function public.get_all_project_users() to authenticated;

commit;
