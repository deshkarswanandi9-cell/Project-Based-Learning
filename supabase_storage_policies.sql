-- ==============================================================================
-- RSCOE PBL Portal: Supabase Storage & Database RLS Security Policies
-- Target Bucket: 'projects'
-- Purpose: Remediate public listing and unauthenticated document download vulnerabilities
--          with verified student identification, hardened helper functions, and
--          multi-layered database protection against faculty self-approval.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. MAKE THE 'projects' BUCKET PRIVATE
-- ------------------------------------------------------------------------------
-- Anonymous users will no longer be able to list or directly download files.
UPDATE storage.buckets
SET public = false
WHERE id = 'projects';

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY ON storage.objects
-- ------------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. HARDENED HELPER FUNCTIONS FOR AUTHORIZATION
--    Using SECURITY DEFINER STABLE functions with explicit search_path prevents
--    RLS recursion, search-path hijacking, and unauthorized privilege escalation.
-- ------------------------------------------------------------------------------

-- Function 3.1: Verified Student Storage Owner
-- Verifies whether the authenticated caller is the verified student owner
-- Supports all active frontend filename formats without trusting client-supplied numbers:
--   a) Modern folder-based: <auth.uid()>/<filename>
--   b) ProjectForm.jsx UUID prefix: <auth.uid()>-<timestamp>-<rand>.<ext>
--   c) RegisterProject.jsx integer ID prefix: <students.id>-<timestamp>-<rand>.<ext>
--   d) RegisterProject.jsx certificate format: cert-<students.id>-<timestamp>-<rand>.<ext>
CREATE OR REPLACE FUNCTION public.is_student_storage_owner(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_clean_name text;
  v_first_part text;
  v_second_part text;
BEGIN
  -- Strict guard against null, anonymous, or empty names
  IF v_uid IS NULL OR object_name IS NULL THEN
    RETURN false;
  END IF;

  v_clean_name := trim(object_name);
  IF length(v_clean_name) < 3 THEN
    RETURN false;
  END IF;

  -- 1. Folder-based isolation (e.g. <auth.uid()>/filename)
  IF position('/' in v_clean_name) > 0 THEN
    IF v_uid::text = split_part(v_clean_name, '/', 1) THEN
      RETURN true;
    END IF;
  END IF;

  -- 2. Direct Auth UUID prefix format (from ProjectForm.jsx): <auth.uid()>-...
  --    UUID is 36 characters long and contains internal hyphens (e.g. 550e8400-e29b-41d4-a716-446655440000).
  --    Using substring matching avoids split_part truncating after the first 8 characters.
  IF length(v_clean_name) >= 37 AND substr(v_clean_name, 1, 36) = v_uid::text AND substr(v_clean_name, 37, 1) = '-' THEN
    RETURN true;
  END IF;

  -- 3. Student database integer ID format (from RegisterProject.jsx):
  --    Screenshots: <student_id>-<timestamp>-<rand>.<ext>
  --    Certificates: cert-<student_id>-<timestamp>-<rand>.<ext>
  v_first_part := split_part(v_clean_name, '-', 1);
  v_second_part := split_part(v_clean_name, '-', 2);

  RETURN EXISTS (
    SELECT 1 FROM public.students
    WHERE students.user_id = v_uid
      AND (
        students.id::text = v_first_part
        OR (v_first_part = 'cert' AND students.id::text = v_second_part)
      )
  );
END;
$$;

-- Function 3.2: Approved Faculty Coordinator Check (Model A)
-- Checks whether the caller is a verified faculty member approved by college administration.
CREATE OR REPLACE FUNCTION public.is_approved_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teachers
    WHERE teachers.user_id = auth.uid()
      AND teachers.is_approved = true
  );
$$;

-- Function 3.3: Strict Project Mentor Check (Model B)
-- Verifies if the caller is the specific faculty mentor assigned to a project referencing this file.
CREATE OR REPLACE FUNCTION public.is_assigned_project_mentor(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_clean_name text;
BEGIN
  IF v_uid IS NULL OR object_name IS NULL THEN
    RETURN false;
  END IF;

  v_clean_name := trim(object_name);
  IF length(v_clean_name) < 5 OR v_clean_name = '/' THEN
    RETURN false;
  END IF;

  -- Using position() performs literal string matching without SQL LIKE wildcard injection risks
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.teachers ON teachers.user_id = projects.mentor_id
    WHERE teachers.user_id = v_uid
      AND teachers.is_approved = true
      AND (
        projects.document_url = v_clean_name
        OR position('/projects/' || v_clean_name in projects.document_url) > 0
        OR position('/' || v_clean_name in projects.document_url) > 0
        OR position('/projects/' || v_clean_name in projects.screenshot_urls::text) > 0
        OR position('/' || v_clean_name in projects.screenshot_urls::text) > 0
      )
  );
END;
$$;

-- Function 3.4: Student Author of Referencing Project
-- Uses exact path segment matching via position() to eliminate wildcard injection (% and _).
CREATE OR REPLACE FUNCTION public.is_project_file_author(object_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_clean_name text;
BEGIN
  IF v_uid IS NULL OR object_name IS NULL THEN
    RETURN false;
  END IF;

  v_clean_name := trim(object_name);
  -- Reject empty, root path, or trivial substring queries (< 5 characters)
  IF length(v_clean_name) < 5 OR v_clean_name = '/' THEN
    RETURN false;
  END IF;

  -- Using position() ensures literal string comparison without SQL LIKE wildcard injection
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.student_id = v_uid
      AND (
        projects.document_url = v_clean_name
        OR position('/projects/' || v_clean_name in projects.document_url) > 0
        OR position('/' || v_clean_name in projects.document_url) > 0
        OR position('/projects/' || v_clean_name in projects.screenshot_urls::text) > 0
        OR position('/' || v_clean_name in projects.screenshot_urls::text) > 0
      )
  );
END;
$$;

-- Revoke execute from PUBLIC (default in PostgreSQL) to eliminate untrusted access paths
REVOKE EXECUTE ON FUNCTION public.is_student_storage_owner(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_approved_teacher() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_assigned_project_mentor(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_file_author(text) FROM PUBLIC;

-- Explicitly grant execution permissions to authenticated role
GRANT EXECUTE ON FUNCTION public.is_student_storage_owner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_project_mentor(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_file_author(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. DROP INSECURE OR OVERLY PERMISSIVE POLICIES ON storage.objects
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow All" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to projects bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can select projects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload projects" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read project attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project attachments" ON storage.objects;

-- ------------------------------------------------------------------------------
-- 5. POLICY: SELECT (READ/DOWNLOAD) ACCESS
--    - Verified student owner can access their uploaded files.
--    - Line 227: Evaluates faculty access. Default is Model A (is_approved_teacher).
--      Replace with public.is_assigned_project_mentor(name) if Model B is required.
--    - Student authors of projects referencing existing attachments can access them.
-- ------------------------------------------------------------------------------
CREATE POLICY "Authorized users can read project attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'projects'
  AND (
    public.is_student_storage_owner(name)
    OR public.is_approved_teacher() -- FACULTY ACCESS DECISION POINT (Model A vs Model B)
    OR public.is_project_file_author(name)
  )
);

-- ------------------------------------------------------------------------------
-- 6. POLICY: INSERT (UPLOAD) ACCESS
--    - Only authenticated students whose verified database identity matches the
--      file prefix or folder structure may upload to 'projects'.
--    - Cross-student file creation is strictly blocked.
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can upload project attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'projects'
  AND public.is_student_storage_owner(name)
);

-- ------------------------------------------------------------------------------
-- 7. POLICY: UPDATE ACCESS
--    - Only the verified student owner may update an existing attachment.
--    - Both the existing object (USING) and the replacement object (WITH CHECK) must
--      belong to the authenticated student, preventing cross-student overwriting.
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can update their own project attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'projects'
  AND public.is_student_storage_owner(name)
)
WITH CHECK (
  bucket_id = 'projects'
  AND public.is_student_storage_owner(name)
);

-- ------------------------------------------------------------------------------
-- 8. POLICY: DELETE ACCESS
--    - Only the verified student owner may delete their own files.
--    - Faculty and other students cannot delete another user's attachments.
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can delete their own project attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'projects'
  AND public.is_student_storage_owner(name)
);

-- ==============================================================================
-- 9. DATABASE RLS REMEDIATION: TEACHERS TABLE (Prevent Faculty Self-Approval)
-- ==============================================================================
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- 9.1 Trigger Guard: Enforces that is_approved cannot be altered by client roles
CREATE OR REPLACE FUNCTION public.prevent_teacher_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Intercept any update originating from the authenticated client role
  IF (current_user = 'authenticated' OR auth.role() = 'authenticated') THEN
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'Unauthorized: Faculty approval status may only be modified by a system administrator.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_teacher_self_approval ON public.teachers;
CREATE TRIGGER trg_prevent_teacher_self_approval
BEFORE UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_teacher_self_approval();

-- 9.2 Column-Level Privilege Hardening:
-- In PostgreSQL, table-level UPDATE grants supersede column-level revokes.
-- Revoke table-level update, then grant update strictly on non-sensitive columns.
REVOKE UPDATE ON public.teachers FROM authenticated, anon;
GRANT UPDATE (full_name, department, year_of_joining) ON public.teachers TO authenticated;

-- 9.3 Policy: Insert (Self-Registration must default to is_approved = false)
DROP POLICY IF EXISTS "Teachers can insert own profile" ON public.teachers;
CREATE POLICY "Teachers can insert own profile"
ON public.teachers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND is_approved = false
);

-- 9.4 Policy: Update (Teachers may update own non-sensitive profile fields)
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teachers;
CREATE POLICY "Teachers can update own profile"
ON public.teachers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 9.5 Policy: Select (Authenticated users can read approved teachers or own profile)
DROP POLICY IF EXISTS "Read teachers" ON public.teachers;
DROP POLICY IF EXISTS "Public or authenticated can read teachers" ON public.teachers;
CREATE POLICY "Read teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (
  is_approved = true
  OR auth.uid() = user_id
);
