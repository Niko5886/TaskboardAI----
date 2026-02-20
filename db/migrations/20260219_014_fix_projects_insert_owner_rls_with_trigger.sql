begin;

create or replace function public.set_project_owner_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  new.owner_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_projects_set_owner_on_insert on public.projects;
create trigger trg_projects_set_owner_on_insert
before insert on public.projects
for each row
execute function public.set_project_owner_on_insert();

drop policy if exists "projects_insert_owner" on public.projects;
create policy "projects_insert_owner"
on public.projects
for insert
to authenticated
with check (auth.uid() is not null);

commit;
