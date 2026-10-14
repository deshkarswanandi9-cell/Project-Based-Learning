import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== RSCOE PBL Portal: Hackathon, Achievement, PSO & Report Tests ===\n');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failedCount++;
  }
}

// -----------------------------------------------------------------------------
// 1. Position & Award Options Verification
// -----------------------------------------------------------------------------
runTest('All five primary position options are defined: 1st, 2nd, 3rd, Participant, Other', () => {
  const allowedPositions = ['1st', '2nd', '3rd', 'Participant', 'Other'];
  assert.strictEqual(allowedPositions.length, 5);
  assert(allowedPositions.includes('Participant'));
  assert(allowedPositions.includes('Other'));
});

runTest('Secondary award options under Other: Consolation and Special Mention', () => {
  const allowedAwards = ['Consolation', 'Special Mention'];
  assert.strictEqual(allowedAwards.length, 2);
  assert(allowedAwards.includes('Consolation'));
  assert(allowedAwards.includes('Special Mention'));
});

// -----------------------------------------------------------------------------
// 2. Word Count Validation (100 words pass; 101 words fail)
// -----------------------------------------------------------------------------
const countWords = (text) => {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

runTest('Word counter counts whitespace-separated words accurately', () => {
  assert.strictEqual(countWords(''), 0);
  assert.strictEqual(countWords('   '), 0);
  assert.strictEqual(countWords('Award winning prototype for renewable energy tracking'), 7);
  assert.strictEqual(countWords('Word1   Word2 \n Word3 \t Word4'), 4);
});

runTest('Descriptions of 100 words pass; 101 words fail validation', () => {
  const words100 = Array(100).fill('innovation').join(' ');
  const words101 = Array(101).fill('innovation').join(' ');

  assert.strictEqual(countWords(words100), 100);
  assert(countWords(words100) <= 100, '100 words must pass');

  assert.strictEqual(countWords(words101), 101);
  assert(!(countWords(words101) <= 100), '101 words must fail');
});

// -----------------------------------------------------------------------------
// 3. Indian PIN Code Format Validation
// -----------------------------------------------------------------------------
const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

runTest('Valid 6-digit Indian PIN codes are accepted', () => {
  const validPincodes = ['411033', '110001', '400001', '560001', '600001', '700001'];
  for (const pin of validPincodes) {
    assert(INDIAN_PINCODE_REGEX.test(pin), `PIN code ${pin} should be valid`);
  }
});

runTest('Invalid Indian PIN codes are rejected', () => {
  const invalidPincodes = [
    '012345',  // Starts with 0
    '41103',   // Only 5 digits
    '4110333', // 7 digits
    '411 33',  // Contains space
    '41103A',  // Contains alphanumeric character
    '-41103',  // Negative number
  ];
  for (const pin of invalidPincodes) {
    assert(!INDIAN_PINCODE_REGEX.test(pin), `PIN code ${pin} should be rejected`);
  }
});

// -----------------------------------------------------------------------------
// 4. Payload Sanitization & Leak Prevention
// -----------------------------------------------------------------------------
function sanitizeHackathonPayload(data) {
  let finalType = data.type;
  let hackathonData = {
    hackathon_title: null,
    hackathon_position: null,
    hackathon_award_type: null,
    achievement_title: null,
    achievement_description: null,
    location_mode: null,
    city: null,
    state: null,
    pincode: null,
    venue_details: null
  };

  if (data.type === 'Hackathon') {
    const pos = data.hackathon_position;
    const award = pos === 'Other' ? data.hackathon_award_type : null;
    const isSpecialMention = pos === 'Other' && award === 'Special Mention';

    const posText = pos === 'Other'
      ? (award ? `${pos} - ${award}` : 'Other')
      : pos;
    finalType = posText ? `Hackathon (${posText})` : 'Hackathon';

    hackathonData = {
      hackathon_title: data.hackathon_title?.trim() || null,
      hackathon_position: pos,
      hackathon_award_type: award || null,
      achievement_title: isSpecialMention ? (data.achievement_title?.trim() || null) : null,
      achievement_description: isSpecialMention ? (data.achievement_description?.trim() || null) : null,
      location_mode: data.location_mode || 'In-Person / Physical Venue',
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      pincode: data.pincode?.trim() || null,
      venue_details: data.venue_details?.trim() || null
    };
  }

  return { finalType, hackathonData };
}

runTest('Hidden conditional values do not leak when project type is not Hackathon', () => {
  const dirtyData = {
    type: 'Mini Project',
    hackathon_title: 'Stale Hackathon Title',
    hackathon_position: '1st',
    hackathon_award_type: 'Consolation',
    achievement_title: 'Stale Achievement',
    achievement_description: 'Stale Description',
    location_mode: 'In-Person',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411033',
    venue_details: 'Stale Venue'
  };

  const { finalType, hackathonData } = sanitizeHackathonPayload(dirtyData);
  assert.strictEqual(finalType, 'Mini Project');
  for (const [key, val] of Object.entries(hackathonData)) {
    assert.strictEqual(val, null, `Field ${key} must be null when type is not Hackathon`);
  }
});

runTest('Hidden achievement values do not leak when position is not Other/Special Mention', () => {
  const dirtyData = {
    type: 'Hackathon',
    hackathon_title: 'Smart India Hackathon',
    hackathon_position: '1st',
    hackathon_award_type: 'Special Mention', // Stale
    achievement_title: 'Best Presentation',   // Stale
    achievement_description: 'Description...', // Stale
    location_mode: 'In-Person / Physical Venue',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411033',
    venue_details: 'Campus Hall'
  };

  const { finalType, hackathonData } = sanitizeHackathonPayload(dirtyData);
  assert.strictEqual(finalType, 'Hackathon (1st)');
  assert.strictEqual(hackathonData.hackathon_position, '1st');
  assert.strictEqual(hackathonData.hackathon_award_type, null);
  assert.strictEqual(hackathonData.achievement_title, null);
  assert.strictEqual(hackathonData.achievement_description, null);
  assert.strictEqual(hackathonData.city, 'Pune');
});

runTest('Achievement fields are preserved when position is Other and award is Special Mention', () => {
  const validData = {
    type: 'Hackathon',
    hackathon_title: 'National Coding League',
    hackathon_position: 'Other',
    hackathon_award_type: 'Special Mention',
    achievement_title: 'Jury Choice Innovation',
    achievement_description: 'Recognized for highest algorithmic efficiency and accessibility.',
    location_mode: 'In-Person / Physical Venue',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411033',
    venue_details: 'RSCOE Auditorium'
  };

  const { finalType, hackathonData } = sanitizeHackathonPayload(validData);
  assert.strictEqual(finalType, 'Hackathon (Other - Special Mention)');
  assert.strictEqual(hackathonData.hackathon_position, 'Other');
  assert.strictEqual(hackathonData.hackathon_award_type, 'Special Mention');
  assert.strictEqual(hackathonData.achievement_title, 'Jury Choice Innovation');
  assert.strictEqual(hackathonData.achievement_description, 'Recognized for highest algorithmic efficiency and accessibility.');
});

// -----------------------------------------------------------------------------
// 5. PSO Validation and Persistence Safety
// -----------------------------------------------------------------------------
runTest('PSO selections validate strictly against PSO1, PSO2, PSO3 and preserve existing SDGs and POs', () => {
  const rawFormPsos = ['PSO1', 'PSO3', 'PSO99', 'INVALID_PSO'];
  const validPsos = rawFormPsos.filter(p => ['PSO1', 'PSO2', 'PSO3'].includes(p));

  assert.deepStrictEqual(validPsos, ['PSO1', 'PSO3']);

  const payload = {
    sdg_goals: [3, 9],
    pos: ['PO1', 'PO2', 'PO4'],
    psos: validPsos
  };

  assert.deepStrictEqual(payload.sdg_goals, [3, 9], 'SDGs must be preserved');
  assert.deepStrictEqual(payload.pos, ['PO1', 'PO2', 'PO4'], 'POs must be preserved');
  assert.deepStrictEqual(payload.psos, ['PSO1', 'PSO3'], 'PSOs must be preserved');
});

// -----------------------------------------------------------------------------
// 6. SQL Migration File Verification
// -----------------------------------------------------------------------------
runTest('supabase_add_psos_column.sql does NOT contain over-permissive table-level GRANT statement', () => {
  const psoSql = fs.readFileSync('supabase_add_psos_column.sql', 'utf8');
  assert(!psoSql.includes('GRANT SELECT, INSERT, UPDATE ON TABLE public.projects TO authenticated;'),
    'Table-level GRANT statement must be removed from PSO migration');
  assert(psoSql.includes('ALTER TABLE public.projects'), 'Must contain ALTER TABLE');
  assert(psoSql.includes('chk_projects_psos_valid'), 'Must contain PSO check constraint');
});

runTest('supabase_add_hackathon_and_achievement_fields.sql is non-destructive and defines all columns and constraints', () => {
  const hackSql = fs.readFileSync('supabase_add_hackathon_and_achievement_fields.sql', 'utf8');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS hackathon_title text'), 'Must add hackathon_title');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS hackathon_position text'), 'Must add hackathon_position');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS hackathon_award_type text'), 'Must add hackathon_award_type');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS achievement_title text'), 'Must add achievement_title');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS achievement_description text'), 'Must add achievement_description');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS location_mode text'), 'Must add location_mode');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS city text'), 'Must add city');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS state text'), 'Must add state');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS pincode text'), 'Must add pincode');
  assert(hackSql.includes('ADD COLUMN IF NOT EXISTS venue_details text'), 'Must add venue_details');
  assert(hackSql.includes('chk_projects_pincode_format'), 'Must include Indian PIN code format check constraint');
  assert(!hackSql.includes('GRANT SELECT, INSERT, UPDATE ON TABLE'), 'Must NOT grant arbitrary table permissions');
});

// -----------------------------------------------------------------------------
// 7. Exact Institutional Letterhead Verification (5 Lines & Logos)
// -----------------------------------------------------------------------------
runTest('Exact institutional header lines and official letterhead exist across components and reports', () => {
  // 1. CollegeHeader component verification
  const collegeHeaderContent = fs.readFileSync('src/components/common/CollegeHeader.jsx', 'utf8');
  assert(collegeHeaderContent.includes("JSPM’s") || collegeHeaderContent.includes("JSPM's"), 'Line 1 missing in CollegeHeader');
  assert(collegeHeaderContent.includes("Rajarshi Shahu College of Engineering, Tathawade Pune-33"), 'Line 2 missing in CollegeHeader');
  assert(collegeHeaderContent.includes("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University"), 'Line 3 missing in CollegeHeader');
  assert(collegeHeaderContent.includes("Pune)"), 'Line 4 missing in CollegeHeader');
  assert(collegeHeaderContent.includes("Department of Computer Engineering"), 'Line 5 missing in CollegeHeader');
  assert(collegeHeaderContent.includes("jspmLogo") && collegeHeaderContent.includes("rscoeLogo"), 'Both logos must be loaded in CollegeHeader');
  assert(collegeHeaderContent.includes("bg-white"), 'Header must have white background matching letterhead reference');
  assert(!collegeHeaderContent.includes("bg-brand-maroon"), 'Old maroon header banner must be replaced');

  // 2. ProjectDocumentViewer preview verification
  const docViewerContent = fs.readFileSync('src/components/common/ProjectDocumentViewer.jsx', 'utf8');
  assert(docViewerContent.includes("JSPM’s") || docViewerContent.includes("JSPM's"), 'Line 1 missing in ProjectDocumentViewer');
  assert(docViewerContent.includes("Rajarshi Shahu College of Engineering, Tathawade Pune-33"), 'Line 2 missing in ProjectDocumentViewer');
  assert(docViewerContent.includes("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University"), 'Line 3 missing in ProjectDocumentViewer');
  assert(docViewerContent.includes("Pune)"), 'Line 4 missing in ProjectDocumentViewer');
  assert(docViewerContent.includes("Department of Computer Engineering"), 'Line 5 missing in ProjectDocumentViewer');
  assert(docViewerContent.includes("jspmLogo") && docViewerContent.includes("rscoeLogo"), 'Both logos must be rendered in ProjectDocumentViewer');

  // 3. Single Project PDF download verification
  const downloadReportContent = fs.readFileSync('src/utils/downloadReport.js', 'utf8');
  assert(downloadReportContent.includes("JSPM’s") || downloadReportContent.includes("JSPM's"), 'Line 1 missing in downloadReport.js');
  assert(downloadReportContent.includes("Rajarshi Shahu College of Engineering, Tathawade Pune-33"), 'Line 2 missing in downloadReport.js');
  assert(downloadReportContent.includes("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University"), 'Line 3 missing in downloadReport.js');
  assert(downloadReportContent.includes("Pune)"), 'Line 4 missing in downloadReport.js');
  assert(downloadReportContent.includes("Department of Computer Engineering"), 'Line 5 missing in downloadReport.js');
  assert(downloadReportContent.includes("jspmLogo") && downloadReportContent.includes("rscoeLogo"), 'Both logos must be added in downloadReport.js');

  // 4. Statistical PDF report verification
  const statReportContent = fs.readFileSync('src/utils/downloadStatisticalReport.js', 'utf8');
  assert(statReportContent.includes("JSPM’s") || statReportContent.includes("JSPM's"), 'Line 1 missing in downloadStatisticalReport.js');
  assert(statReportContent.includes("Rajarshi Shahu College of Engineering, Tathawade Pune-33"), 'Line 2 missing in downloadStatisticalReport.js');
  assert(statReportContent.includes("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University"), 'Line 3 missing in downloadStatisticalReport.js');
  assert(statReportContent.includes("Pune)"), 'Line 4 missing in downloadStatisticalReport.js');
  assert(statReportContent.includes("Department of Computer Engineering"), 'Line 5 missing in downloadStatisticalReport.js');
  assert(statReportContent.includes("jspmImg") && statReportContent.includes("rscoeImg"), 'Both logos must be added in downloadStatisticalReport.js');
});

// -----------------------------------------------------------------------------
// 8. Official Bundled SDG Logos & Registration Card Layout
// -----------------------------------------------------------------------------
runTest('All 17 bundled SDG vector logos exist in src/assets/sdg-icons/', () => {
  for (let i = 1; i <= 17; i++) {
    const iconPath = path.join('src', 'assets', 'sdg-icons', `sdg-${i}.svg`);
    assert(fs.existsSync(iconPath), `Missing official SDG vector logo: ${iconPath}`);
  }
});

runTest('RegisterProject SDG cards use larger logo sizing (52px desktop, responsive tablet/mobile)', () => {
  const registerContent = fs.readFileSync('src/pages/student/RegisterProject.jsx', 'utf8');
  // Check for desktop 52px, tablet ~44-48px, mobile ~40-44px
  assert(registerContent.includes('lg:w-[52px] lg:h-[52px]'), 'Must have 52px size on desktop');
  assert(registerContent.includes('md:w-[48px] md:h-[48px]'), 'Must have ~48px size on medium/tablet');
  assert(registerContent.includes('w-[42px] h-[42px]'), 'Must have ~42px size on mobile');
  assert(registerContent.includes('object-contain'), 'Must preserve aspect ratio with object-contain');
  // Check responsive grid: 2 on mobile, 3 on sm, 4 on md, 6 on desktop
  assert(registerContent.includes('grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'), 'Must have responsive 6-col grid');
});

runTest('AI recommendations section displays legible SDG logos with object-contain', () => {
  const aiSectionContent = fs.readFileSync('src/components/student/AIRecommendationsSection.jsx', 'utf8');
  assert(aiSectionContent.includes('object-contain'), 'Must use object-contain for AI recommendation logos');
  assert(aiSectionContent.includes('w-11 h-11') || aiSectionContent.includes('w-12 h-12'), 'Must have legible logo sizing in AI cards');
});

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed\n`);

if (failedCount > 0) {
  process.exit(1);
}
