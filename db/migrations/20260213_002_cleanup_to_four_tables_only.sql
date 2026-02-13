begin;

-- Remove old policies on core tables
DROP POLICY IF EXISTS "projects_select_member" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_update_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_owner" ON public.projects;

DROP POLICY IF EXISTS "project_members_select_member" ON public.project_members;
DROP POLICY IF EXISTS "project_members_manage_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_owner" ON public.project_members;

DROP POLICY IF EXISTS "project_stages_select_member" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_insert_member" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_update_member" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_delete_member" ON public.project_stages;

DROP POLICY IF EXISTS "tasks_select_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_member" ON public.tasks;

-- Rename columns to match the required schema naming
ALTER TABLE public.projects RENAME COLUMN owner_user_id TO owner_id;
ALTER TABLE public.projects RENAME COLUMN name TO title;

ALTER TABLE public.project_stages RENAME COLUMN name TO title;
ALTER TABLE public.project_stages RENAME COLUMN order_position TO position;

ALTER TABLE public.tasks RENAME COLUMN order_position TO position;

ALTER TABLE public.project_members RENAME COLUMN joined_at TO created_at;
ALTER TABLE public.project_members DROP COLUMN IF EXISTS member_role;

-- Normalize position data type to int4
ALTER TABLE public.project_stages
  ALTER COLUMN position TYPE int4 USING position::int4;

ALTER TABLE public.tasks
  ALTER COLUMN position TYPE int4 USING position::int4;

-- Rebuild constraints/indexes that depended on old names
ALTER TABLE public.project_stages
  DROP CONSTRAINT IF EXISTS project_stages_project_id_order_position_key;

ALTER TABLE public.project_stages
  ADD CONSTRAINT project_stages_project_id_position_key UNIQUE (project_id, position);

DROP INDEX IF EXISTS idx_tasks_project_stage_order;
CREATE INDEX IF NOT EXISTS idx_tasks_project_stage_position ON public.tasks(project_id, stage_id, position);

-- Remove extra tables/types (keep only 4 business tables)
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.userroles CASCADE;
DROP TYPE IF EXISTS public.roles;

DROP FUNCTION IF EXISTS public.is_admin();

-- Recreate helper function with new owner_id name
CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_uuid
      AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = project_uuid
      AND pm.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- Recreate RLS policies without admin table dependency
CREATE POLICY "projects_select_member"
ON public.projects
FOR SELECT
USING (public.is_project_member(id));

CREATE POLICY "projects_insert_owner"
ON public.projects
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_owner"
ON public.projects
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_delete_owner"
ON public.projects
FOR DELETE
USING (owner_id = auth.uid());

CREATE POLICY "project_members_select_member"
ON public.project_members
FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY "project_members_insert_owner"
ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "project_members_update_owner"
ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "project_members_delete_owner"
ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "project_stages_select_member"
ON public.project_stages
FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY "project_stages_insert_member"
ON public.project_stages
FOR INSERT
WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "project_stages_update_member"
ON public.project_stages
FOR UPDATE
USING (public.is_project_member(project_id))
WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "project_stages_delete_member"
ON public.project_stages
FOR DELETE
USING (public.is_project_member(project_id));

CREATE POLICY "tasks_select_member"
ON public.tasks
FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY "tasks_insert_member"
ON public.tasks
FOR INSERT
WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "tasks_update_member"
ON public.tasks
FOR UPDATE
USING (public.is_project_member(project_id))
WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "tasks_delete_member"
ON public.tasks
FOR DELETE
USING (public.is_project_member(project_id));

commit;
