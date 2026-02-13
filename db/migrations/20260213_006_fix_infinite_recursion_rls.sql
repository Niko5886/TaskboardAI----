-- Fix infinite recursion in RLS policies by using a security definer function

-- 1. Create helper function to break recursion
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = _project_id
    AND owner_id = auth.uid()
  );
$$;

-- 2. Drop existing policies on project_members causing recursion
DROP POLICY IF EXISTS "project_members_select_member" ON "public"."project_members";
DROP POLICY IF EXISTS "project_members_insert_owner" ON "public"."project_members";
DROP POLICY IF EXISTS "project_members_update_owner" ON "public"."project_members";
DROP POLICY IF EXISTS "project_members_delete_owner" ON "public"."project_members";

-- 3. Recreate policies on project_members using the function
CREATE POLICY "project_members_select_fix" ON "public"."project_members"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid()) OR is_project_owner(project_id)
);

CREATE POLICY "project_members_insert_fix" ON "public"."project_members"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    is_project_owner(project_id)
);

CREATE POLICY "project_members_update_fix" ON "public"."project_members"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    is_project_owner(project_id)
)
WITH CHECK (
    is_project_owner(project_id)
);

CREATE POLICY "project_members_delete_fix" ON "public"."project_members"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
    is_project_owner(project_id)
);
