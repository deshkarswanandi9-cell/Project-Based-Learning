-- ==============================================================================
-- RSCOE PBL Portal: Migration to add Faculty Mentor Name to Projects
-- Migration File: supabase_add_faculty_mentor_name.sql
-- Status: PREPARED ONLY (DO NOT EXECUTE AGAINST PRODUCTION WITHOUT DBA REVIEW)
-- ==============================================================================
--
-- Context:
-- Allows students to enter the name of the faculty mentor directly guiding their
-- project. This field is independent of `mentor_id`, which represents the assigned
-- PBL Coordinator account in the portal.
--
-- Backward Compatibility:
-- - Column is nullable (DEFAULT NULL) so all existing/historical project records remain intact.
-- - No downtime, full table rewrite lock, or destructive modifications.
-- - Frontend automatically supports records with or without this column.
--
-- RLS Impact:
-- - Existing Supabase Row-Level Security policies on public.projects automatically
--   govern access to this new column.
-- ==============================================================================

-- 1. ADD COLUMN 'faculty_mentor_name' TO public.projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS faculty_mentor_name VARCHAR(255) DEFAULT NULL;

-- 2. ADD COLUMN DOCUMENTATION
COMMENT ON COLUMN public.projects.faculty_mentor_name IS
'Manually specified name of the faculty mentor guiding the project.';

-- ==============================================================================
-- ROLLBACK SCRIPT (In case of reversion):
-- ==============================================================================
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS faculty_mentor_name;
-- ==============================================================================
