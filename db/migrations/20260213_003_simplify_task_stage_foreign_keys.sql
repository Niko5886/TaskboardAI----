begin;

alter table public.tasks
  drop constraint if exists tasks_project_stage_fk;

alter table public.tasks
  add constraint tasks_stage_id_fkey
  foreign key (stage_id)
  references public.project_stages(id)
  on delete cascade;

commit;
