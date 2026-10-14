-- ==============================================================================
-- RSCOE PBL Portal: Migration to add Hackathon, Achievement, and Venue Fields
-- Migration File: supabase_add_hackathon_and_achievement_fields.sql
-- Status: PREPARED ONLY (DO NOT EXECUTE AGAINST PRODUCTION WITHOUT DBA REVIEW)
-- ==============================================================================
--
-- Context:
-- When students register a Hackathon project in the JSPM RSCOE PBL Portal:
--   1. Hackathon Details:
--      - hackathon_title: Name of the event / competition
--      - location_mode: Mode of participation ('In-Person / Physical Venue' or 'Online / Virtual')
--      - city: City where the hackathon took place
--      - state: State / Region
--      - pincode: 6-digit Indian Postal PIN code
--      - venue_details: Specific campus / hall / organization address
--
--   2. Position & Achievement Tracking:
--      - hackathon_position: '1st', '2nd', '3rd', 'Participant', 'Other'
--      - hackathon_award_type: For 'Other': 'Consolation', 'Special Mention'
--      - achievement_title: Title when highlighting achievement
--      - achievement_description: Description of achievement (max 100 words)
--
-- Backward Compatibility:
-- - All columns are NULLABLE, ensuring existing records remain completely intact.
-- - No downtime or full-table rewrite lock required.
-- - Frontend sanitizes and strips stale conditional values before submission.
--
-- Security & Permissions:
-- - Standard Supabase permissions for 'authenticated' already apply to public.projects.
-- - Row-Level Security (RLS) policies on public.projects automatically govern access.
-- - No table-level GRANT statements are required or included.
-- ==============================================================================

-- 1. ADD HACKATHON EVENT & VENUE COLUMNS
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS hackathon_title text,
ADD COLUMN IF NOT EXISTS location_mode text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS venue_details text;

-- 2. ADD POSITION & ACHIEVEMENT COLUMNS
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS hackathon_position text,
ADD COLUMN IF NOT EXISTS hackathon_award_type text,
ADD COLUMN IF NOT EXISTS achievement_title text,
ADD COLUMN IF NOT EXISTS achievement_description text;

-- 3. INTEGRITY CONSTRAINTS
-- Validate hackathon position options
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS chk_projects_hackathon_position;

ALTER TABLE public.projects
ADD CONSTRAINT chk_projects_hackathon_position
CHECK (
  hackathon_position IS NULL OR 
  hackathon_position IN ('1st', '2nd', '3rd', 'Participant', 'Other')
);

-- Validate secondary award options when position is 'Other'
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS chk_projects_hackathon_award_type;

ALTER TABLE public.projects
ADD CONSTRAINT chk_projects_hackathon_award_type
CHECK (
  hackathon_award_type IS NULL OR 
  hackathon_award_type IN ('Consolation', 'Special Mention')
);

-- Validate Indian PIN code format (6 digits, first digit 1-9)
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS chk_projects_pincode_format;

ALTER TABLE public.projects
ADD CONSTRAINT chk_projects_pincode_format
CHECK (
  pincode IS NULL OR 
  pincode ~ '^[1-9][0-9]{5}$'
);

-- 4. COLUMN COMMENTS FOR DOCUMENTATION
COMMENT ON COLUMN public.projects.hackathon_title IS 'Official name of the hackathon event or competition.';
COMMENT ON COLUMN public.projects.location_mode IS 'Mode of participation: In-Person / Physical Venue or Online / Virtual.';
COMMENT ON COLUMN public.projects.city IS 'City where the hackathon event was hosted.';
COMMENT ON COLUMN public.projects.state IS 'State / Region of the hackathon location.';
COMMENT ON COLUMN public.projects.pincode IS 'Standard 6-digit Indian PIN code of the venue.';
COMMENT ON COLUMN public.projects.venue_details IS 'Manual venue / location address details.';
COMMENT ON COLUMN public.projects.hackathon_position IS 'Secured position: 1st, 2nd, 3rd, Participant, or Other.';
COMMENT ON COLUMN public.projects.hackathon_award_type IS 'Secondary award category when position is Other: Consolation or Special Mention.';
COMMENT ON COLUMN public.projects.achievement_title IS 'Title of the highlighted achievement (for Special Mention).';
COMMENT ON COLUMN public.projects.achievement_description IS 'Short description of the achievement (maximum 100 words).';

-- ==============================================================================
-- ROLLBACK SCRIPT (In case of reversion):
-- ==============================================================================
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS chk_projects_pincode_format;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS chk_projects_hackathon_award_type;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS chk_projects_hackathon_position;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS achievement_description;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS achievement_title;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS hackathon_award_type;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS hackathon_position;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS venue_details;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS pincode;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS state;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS city;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS location_mode;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS hackathon_title;
-- ==============================================================================
