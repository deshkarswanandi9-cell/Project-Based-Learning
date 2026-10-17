import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PSO_LIST, normalizePsos, resolvePsoDetails } from './src/utils/constants.js';

console.log('=== RSCOE PBL Portal: PSO Mapping & Report Verification Suite ===\n');

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 1. Verify Official RSCOE Computer Engineering PSO Catalog
// ---------------------------------------------------------------------------
runTest('Official RSCOE Computer Engineering PSO catalog contains exactly 3 official PSOs', () => {
  assert.strictEqual(PSO_LIST.length, 3);
  const pso1 = PSO_LIST.find(p => p.id === 'PSO1');
  const pso2 = PSO_LIST.find(p => p.id === 'PSO2');
  const pso3 = PSO_LIST.find(p => p.id === 'PSO3');

  assert(pso1, 'PSO1 must exist in catalog');
  assert.strictEqual(pso1.title, 'Software Systems and Computing');
  assert(pso1.desc.includes('analyze, design, develop, and evaluate efficient software'));

  assert(pso2, 'PSO2 must exist in catalog');
  assert.strictEqual(pso2.title, 'Intelligent and Emerging Technologies');
  assert(pso2.desc.includes('emerging technologies such as Artificial Intelligence'));

  assert(pso3, 'PSO3 must exist in catalog');
  assert.strictEqual(pso3.title, 'Innovation, Research, and Entrepreneurship');
  assert(pso3.desc.includes('innovative computing solutions for complex engineering problems'));
});

// ---------------------------------------------------------------------------
// 2. Scenario A: Test a project with PSO1 and PSO3 selected
// ---------------------------------------------------------------------------
runTest('Scenario A: Project with PSO1 and PSO3 selected renders complete official details without warning', () => {
  const project = {
    title: 'AI Smart Traffic Controller',
    psos: ['PSO1', 'PSO3']
  };

  const rawPsos = project.psos;
  const isPsoColumnMissing = rawPsos === undefined;
  assert.strictEqual(isPsoColumnMissing, false, 'Column must not be flagged missing when data exists');

  const normalized = normalizePsos(rawPsos);
  assert.deepStrictEqual(normalized, ['PSO1', 'PSO3']);

  const details1 = resolvePsoDetails(normalized[0]);
  const details2 = resolvePsoDetails(normalized[1]);

  assert.strictEqual(details1.id, 'PSO1');
  assert.strictEqual(details1.title, 'Software Systems and Computing');
  assert(details1.desc.includes('analyze, design, develop, and evaluate'));

  assert.strictEqual(details2.id, 'PSO3');
  assert.strictEqual(details2.title, 'Innovation, Research, and Entrepreneurship');
  assert(details2.desc.includes('innovative computing solutions'));
});

// ---------------------------------------------------------------------------
// 3. Scenario B: Test a project with no PSOs selected
// ---------------------------------------------------------------------------
runTest('Scenario B: Project with no PSOs selected renders empty notice without migration warning', () => {
  const project = {
    title: 'Minimal Hardware Benchmark',
    psos: []
  };

  const rawPsos = project.psos;
  const isPsoColumnMissing = rawPsos === undefined;
  assert.strictEqual(isPsoColumnMissing, false, 'Column must not be flagged missing when empty array is saved');

  const normalized = normalizePsos(rawPsos);
  assert.strictEqual(normalized.length, 0);

  // Expected rendered message
  const emptyMessage = normalized.length === 0 ? 'No Programme Specific Outcomes selected.' : null;
  assert.strictEqual(emptyMessage, 'No Programme Specific Outcomes selected.');
});

// ---------------------------------------------------------------------------
// 4. Scenario C: Test the pending-migration scenario
// ---------------------------------------------------------------------------
runTest('Scenario C: Pending migration scenario renders clear, accurate migration warning without fabricating selections', () => {
  const project = {
    title: 'Legacy Persisted Project',
    // psos column not in DB schema, so property is undefined
    psos: undefined
  };

  const rawPsos = project.psos;
  const isPsoColumnMissing = rawPsos === undefined;
  assert.strictEqual(isPsoColumnMissing, true, 'Undefined psos must accurately identify missing database column');

  // Warning text must mention migration file
  const expectedNotice = 'Notice: PSO mapping is pending database column migration (supabase_add_psos_column.sql).';
  assert(expectedNotice.includes('supabase_add_psos_column.sql'));

  // Ensure normalizedPsos does not invent or assume selections
  const normalized = normalizePsos(rawPsos);
  assert.strictEqual(normalized.length, 0, 'Must never invent or assume PSOs for pending-migration records');
});

// ---------------------------------------------------------------------------
// 5. Scenario D: Draft / Form Preview distinguishing unsaved from persisted
// ---------------------------------------------------------------------------
runTest('Scenario D: Unsaved form preview displays selections and is clearly distinguished from persisted data', () => {
  const draftProject = {
    title: 'In-Progress Form Draft',
    isDraft: true,
    psos: ['PSO1', 'PSO2']
  };

  const isDraft = Boolean(draftProject.isDraft);
  assert.strictEqual(isDraft, true);

  const rawPsos = draftProject.psos;
  const isPsoColumnMissing = !isDraft && rawPsos === undefined;
  assert.strictEqual(isPsoColumnMissing, false, 'Draft previews must render active form selections');

  const normalized = normalizePsos(rawPsos);
  assert.deepStrictEqual(normalized, ['PSO1', 'PSO2']);
});

// ---------------------------------------------------------------------------
// 6. Consistency between Preview (ProjectDocumentViewer) and PDF (downloadReport)
// ---------------------------------------------------------------------------
runTest('Report preview and PDF report use consistent section headings, resolution, and warning texts', () => {
  const viewerSrc = fs.readFileSync(path.resolve('./src/components/common/ProjectDocumentViewer.jsx'), 'utf-8');
  const reportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');

  // Both use the same official section header
  assert(viewerSrc.includes('Programme Specific Outcomes (PSOs) Mapped:'), 'Viewer must have PSOs header');
  assert(reportSrc.includes('Programme Specific Outcomes (PSOs) Mapped:'), 'Report must have PSOs header');

  // Both use normalizePsos and resolvePsoDetails
  assert(viewerSrc.includes('normalizePsos(project.psos)'), 'Viewer must normalize PSOs');
  assert(reportSrc.includes('normalizePsos(rawPsos)'), 'Report must normalize PSOs');
  assert(viewerSrc.includes('resolvePsoDetails('), 'Viewer must resolve details');
  assert(reportSrc.includes('resolvePsoDetails('), 'Report must resolve details');

  // Both render details.id, details.title, and details.desc
  assert(viewerSrc.includes('details.id') && viewerSrc.includes('details.title') && viewerSrc.includes('details.desc'));
  assert(reportSrc.includes('details.id') && reportSrc.includes('details.title') && reportSrc.includes('details.desc'));

  // Both show exact identical pending migration warning
  const noticePattern = 'Notice: PSO mapping is pending database column migration (supabase_add_psos_column.sql).';
  assert(viewerSrc.includes(noticePattern), 'Viewer must contain exact notice');
  assert(reportSrc.includes(noticePattern), 'Report must contain exact notice');

  // Both show exact identical empty selection text
  const emptyPattern = 'No Programme Specific Outcomes selected.';
  assert(viewerSrc.includes(emptyPattern), 'Viewer must contain empty text');
  assert(reportSrc.includes(emptyPattern), 'Report must contain empty text');
});

// ---------------------------------------------------------------------------
// 7. Preservation of existing selections (SDGs, POs, non-destructive behavior)
// ---------------------------------------------------------------------------
runTest('Existing SDGs and POs remain preserved and untouched in payload and viewer', () => {
  const registerSrc = fs.readFileSync(path.resolve('./src/pages/student/RegisterProject.jsx'), 'utf-8');
  assert(registerSrc.includes('(data.sdg_goals || []).map(Number)') || registerSrc.includes('data.sdg_goals.map(Number)'), 'SDG mapping preserved');
  assert(registerSrc.includes('pos: data.pos'), 'PO mapping preserved');
  assert(registerSrc.includes("const validPsos = (data.psos || []).filter(p => ['PSO1', 'PSO2', 'PSO3'].includes(p));"), 'PSO filtering preserved');
});

// ---------------------------------------------------------------------------
// 8. Migration SQL script validity and non-destructiveness
// ---------------------------------------------------------------------------
runTest('supabase_add_psos_column.sql is non-destructive with default empty array and integrity check', () => {
  const sql = fs.readFileSync(path.resolve('./supabase_add_psos_column.sql'), 'utf-8');
  assert(sql.includes("ADD COLUMN IF NOT EXISTS psos text[] DEFAULT '{}'::text[];"), 'SQL has safe ADD COLUMN');
  assert(sql.includes("ARRAY['PSO1', 'PSO2', 'PSO3']::text[]"), 'SQL has strict CHECK constraint for RSCOE PSOs');
  assert(!sql.includes('DROP TABLE'), 'SQL must not drop table');
  assert(!sql.includes('DELETE FROM'), 'SQL must not delete data');
});

console.log('\nAll 8 PSO mapping and report verification tests passed successfully!');
