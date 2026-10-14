-- ==============================================================================
-- RSCOE PBL Portal: Migration to add Programme Specific Outcomes (PSOs)
-- Migration File: supabase_add_psos_column.sql
-- Status: PREPARED ONLY (DO NOT EXECUTE AGAINST PRODUCTION WITHOUT DBA REVIEW)
-- ==============================================================================
--
-- Context:
-- In the RSCOE Computer Engineering department, projects address three levels of outcomes:
--   1. UN Sustainable Development Goals (SDGs: 1–17) -> projects.sdg_goals (integer[])
--   2. NBA Graduate Attributes (POs: PO1–PO11) -> projects.pos (text[])
--   3. Department Specific Outcomes (PSOs: PSO1–PSO3) -> projects.psos (text[])
--
-- Backward Compatibility:
-- - The column uses DEFAULT '{}'::text[] so all existing records remain unaffected.
-- - No downtime or full table rewrite lock required.
-- - Existing projects without PSO selections will have an empty array '{}'.
-- - The frontend handles both missing column (pre-migration fallback) and persisted column.
--
-- RLS Impact:
-- - Supabase Row-Level Security on public.projects uses row-level USING/WITH CHECK expressions.
-- - Existing policies ("Students can insert own projects", "Students can update own projects",
--   "Authenticated users can read projects") automatically apply to the new column.
-- ==============================================================================

-- 1. ADD COLUMN 'psos' TO public.projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS psos text[] DEFAULT '{}'::text[];

-- 2. ADD COLUMN DOCUMENTATION
COMMENT ON COLUMN public.projects.psos IS
'Array of RSCOE Department Programme Specific Outcome identifiers (PSO1, PSO2, PSO3) addressed by the project.';

-- 3. INTEGRITY CONSTRAINT (Ensure only valid Computer Engineering PSOs can be stored)
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS chk_projects_psos_valid;

ALTER TABLE public.projects
ADD CONSTRAINT chk_projects_psos_valid
CHECK (psos <@ ARRAY['PSO1', 'PSO2', 'PSO3']::text[]);

-- 4. SECURITY & PERMISSIONS NOTE:
-- Do NOT execute table-level GRANT statements (table grants already exist for authenticated role).
-- In Supabase, table-level grants already exist for the authenticated role, and Row-Level Security (RLS)
-- policies on public.projects govern row access. The new column automatically inherits these policies.

-- ==============================================================================
-- ROLLBACK SCRIPT (In case of reversion):
-- ==============================================================================
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS chk_projects_psos_valid;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS psos;
-- ==============================================================================
