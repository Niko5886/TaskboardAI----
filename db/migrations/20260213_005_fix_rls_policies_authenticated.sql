-- Fix RLS policies to use 'authenticated' role instead of 'public'
-- This ensures that only authenticated users can access data

BEGIN;

-- Fix projects table policies
DROP POLICY IF EXISTS "projects_select_member" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_update_owner" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_owner" ON public.projects;

CREATE POLICY "projects_select_member"
ON public.projects
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() 
  OR EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "projects_insert_owner"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_owner"
ON public.projects
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_delete_owner"
ON public.projects
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Fix project_stages table policies
DROP POLICY IF EXISTS "project_stages_select_member" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_insert_member" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_update_member" ON public.project_stages;
DROP POLICY IF EXISTS "project_stages_delete_member" ON public.project_stages;

CREATE POLICY "project_stages_select_member"
ON public.project_stages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_stages.project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

CREATE POLICY "project_stages_insert_member"
ON public.project_stages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

CREATE POLICY "project_stages_update_member"
ON public.project_stages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

CREATE POLICY "project_stages_delete_member"
ON public.project_stages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

-- Fix tasks table policies
DROP POLICY IF EXISTS "tasks_select_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_member" ON public.tasks;

CREATE POLICY "tasks_select_member"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = tasks.project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

CREATE POLICY "tasks_insert_member"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

CREATE POLICY "tasks_update_member"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

CREATE POLICY "tasks_delete_member"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
  )
);

-- Fix project_members table policies
DROP POLICY IF EXISTS "project_members_select_member" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update_owner" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_owner" ON public.project_members;

CREATE POLICY "project_members_select_member"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_members.project_id
      AND (p.owner_id = auth.uid() OR user_id = auth.uid())
  )
);

CREATE POLICY "project_members_insert_owner"
ON public.project_members
FOR INSERT
TO authenticated
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
TO authenticated
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
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND p.owner_id = auth.uid()
  )
);

COMMIT;
