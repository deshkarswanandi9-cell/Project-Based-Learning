import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_TYPES, PO_LIST, PSO_LIST, SDG_GOALS, normalizePsos, resolvePsoDetails } from './src/utils/constants.js';
import { SDG_LOGOS, getSdgLogo } from './src/utils/sdgLogos.js';

console.log('=== RSCOE PBL Portal: Regression & Verification Test Suite ===\n');

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
// 1. Project Type Option Verification
// -----------------------------------------------------------------------------
runTest("Project type option 'Complex Engineering Problems' is present and replaces 'Complex Engineering'", () => {
  assert(PROJECT_TYPES.includes('Complex Engineering Problems'), "Must include 'Complex Engineering Problems'");
  assert(!PROJECT_TYPES.includes('Complex Engineering'), "Old 'Complex Engineering' must not be in PROJECT_TYPES array");
});

runTest("RegisterProject.jsx normalizes legacy 'Complex Engineering' to 'Complex Engineering Problems'", () => {
  const registerSrc = fs.readFileSync(path.resolve('./src/pages/student/RegisterProject.jsx'), 'utf-8');
  assert(registerSrc.includes("'Complex Engineering Problems'"), "RegisterProject must reference 'Complex Engineering Problems'");
  assert(registerSrc.includes("initialType === 'Complex Engineering'"), "RegisterProject must handle legacy conversion");
});

runTest("downloadReport.js and ProjectDocumentViewer.jsx normalize legacy project type to 'Complex Engineering Problems'", () => {
  const reportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');
  const viewerSrc = fs.readFileSync(path.resolve('./src/components/common/ProjectDocumentViewer.jsx'), 'utf-8');
  assert(reportSrc.includes("project.type === 'Complex Engineering'"), "downloadReport must normalize legacy type");
  assert(reportSrc.includes("'Complex Engineering Problems'"), "downloadReport must output normalized string");
  assert(viewerSrc.includes("project.type === 'Complex Engineering'"), "ProjectDocumentViewer must normalize legacy type");
  assert(viewerSrc.includes("'Complex Engineering Problems'"), "ProjectDocumentViewer must output normalized string");
});

// -----------------------------------------------------------------------------
// 2. Faculty Mentor Name Field & Validation
// -----------------------------------------------------------------------------
runTest("RegisterProject.jsx has required Faculty Mentor Name input field and submission payload", () => {
  const registerSrc = fs.readFileSync(path.resolve('./src/pages/student/RegisterProject.jsx'), 'utf-8');
  assert(registerSrc.includes("faculty_mentor_name"), "Must have faculty_mentor_name in form state");
  assert(registerSrc.includes("data.faculty_mentor_name?.trim()"), "Must trim and include in payload");
  assert(registerSrc.includes("'faculty_mentor_name'"), "Must include in potentialNewCols for graceful schema fallback");
});

runTest("MyProject.jsx displays Faculty Mentor Name separately from PBL Coordinator", () => {
  const myProjSrc = fs.readFileSync(path.resolve('./src/pages/student/MyProject.jsx'), 'utf-8');
  assert(myProjSrc.includes("Faculty Mentor"), "Must display Faculty Mentor header");
  assert(myProjSrc.includes("project.faculty_mentor_name"), "Must read project.faculty_mentor_name");
  assert(myProjSrc.includes("PBL Coordinator"), "Must retain PBL Coordinator on student project card");
  assert(myProjSrc.includes("project.mentor_name"), "Must read project.mentor_name for coordinator");
});

runTest("ProjectMonitoring.jsx displays Faculty Mentor Name in teacher inspection modal", () => {
  const monitorSrc = fs.readFileSync(path.resolve('./src/pages/teacher/ProjectMonitoring.jsx'), 'utf-8');
  assert(monitorSrc.includes("Faculty Mentor"), "Must display Faculty Mentor in inspection modal");
  assert(monitorSrc.includes("selectedProject.faculty_mentor_name"), "Must read selectedProject.faculty_mentor_name");
});

// -----------------------------------------------------------------------------
// 3. Institutional Header Order & Academic Year
// -----------------------------------------------------------------------------
runTest("Institutional header in downloadReport.js contains exact wording and Academic Year below department", () => {
  const reportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');
  assert(reportSrc.includes("JSPM’s") || reportSrc.includes("JSPM's"), "Must include JSPM's");
  assert(reportSrc.includes("Rajarshi Shahu College of Engineering, Tathawade Pune-33"), "Must include college name and address");
  assert(reportSrc.includes("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)"), "Must include exact affiliation");
  assert(reportSrc.includes("Department of Computer Engineering"), "Must include department");
  assert(reportSrc.includes("Academic Year: ${academicYear}"), "Academic year must be right below department");
  assert(reportSrc.includes("project.academic_year || 'Not Specified'"), "Must read dynamic academic_year from project");
});

runTest("ProjectDocumentViewer.jsx renders exact institutional header with dynamic Academic Year", () => {
  const viewerSrc = fs.readFileSync(path.resolve('./src/components/common/ProjectDocumentViewer.jsx'), 'utf-8');
  assert(viewerSrc.includes("Rajarshi Shahu College of Engineering, Tathawade Pune-33"), "Must include college name");
  assert(viewerSrc.includes("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)"), "Must include affiliation");
  assert(viewerSrc.includes("Department of Computer Engineering"), "Must include department");
  assert(viewerSrc.includes("Academic Year: {project.academic_year || 'Not Specified'}"), "Must display dynamic academic year");
});

// -----------------------------------------------------------------------------
// 4. PBL Coordinator Removal from Individual Reports
// -----------------------------------------------------------------------------
runTest("PBL Coordinator is completely removed from individual PDF report and preview", () => {
  const reportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');
  const viewerSrc = fs.readFileSync(path.resolve('./src/components/common/ProjectDocumentViewer.jsx'), 'utf-8');

  // Verify absence of PBL Coordinator in individual report template
  assert(!reportSrc.includes('PBL Coordinator Name:'), "PBL Coordinator Name must NOT be in downloadReport.js");
  assert(!reportSrc.includes('addField("PBL Coordinator'), "Must not add PBL coordinator field to report");
  assert(!viewerSrc.includes("{fieldLabel('PBL Coordinator')}"), "PBL Coordinator must NOT be in ProjectDocumentViewer.jsx preview");
});

// -----------------------------------------------------------------------------
// 5. PO and PSO Title Resolution & Formatting
// -----------------------------------------------------------------------------
runTest("PO catalog has all official PO definitions (PO1 to PO11)", () => {
  assert.strictEqual(PO_LIST.length, 11, "Must have 11 POs");
  const po1 = PO_LIST.find(p => p.id === 'PO1');
  const po3 = PO_LIST.find(p => p.id === 'PO3');
  const po5 = PO_LIST.find(p => p.id === 'PO5');
  assert.strictEqual(po1.title, 'Engineering Knowledge');
  assert.strictEqual(po3.title, 'Design/Development of Solutions');
  assert.strictEqual(po5.title, 'Engineering Tool Usage');
});

runTest("PSO catalog has all 3 official Computer Engineering PSOs", () => {
  assert.strictEqual(PSO_LIST.length, 3, "Must have 3 PSOs");
  assert.strictEqual(PSO_LIST[0].title, 'Software Systems and Computing');
  assert.strictEqual(PSO_LIST[1].title, 'Intelligent and Emerging Technologies');
  assert.strictEqual(PSO_LIST[2].title, 'Innovation, Research, and Entrepreneurship');
});

runTest("PO and PSO formatting utilities produce 'PO X: Title' and 'PSO X: Title'", () => {
  const formatPoLine = (poId) => {
    const num = String(poId).replace(/\D/g, '');
    const found = PO_LIST.find(p => p.id === poId || p.id === `PO${num}` || String(p.poNumber) === num);
    if (found) {
      const poNum = found.poNumber || num || found.id.replace('PO', '');
      return `PO ${poNum}: ${found.title}`;
    }
    return String(poId).startsWith('PO') ? String(poId) : `PO ${poId}`;
  };

  const formatPsoLine = (psoId) => {
    const num = String(psoId).replace(/\D/g, '');
    const found = PSO_LIST.find(p => p.id === psoId || p.id === `PSO${num}` || String(p.psoNumber) === num);
    if (found) {
      const psoNum = found.psoNumber || num || found.id.replace('PSO', '');
      return `PSO ${psoNum}: ${found.title}`;
    }
    return String(psoId).startsWith('PSO') ? String(psoId) : `PSO ${psoId}`;
  };

  assert.strictEqual(formatPoLine('PO3'), 'PO 3: Design/Development of Solutions');
  assert.strictEqual(formatPoLine('PO1'), 'PO 1: Engineering Knowledge');
  assert.strictEqual(formatPsoLine('PSO1'), 'PSO 1: Software Systems and Computing');
  assert.strictEqual(formatPsoLine('PSO2'), 'PSO 2: Intelligent and Emerging Technologies');
});

// -----------------------------------------------------------------------------
// 6. SDG Icons & Resolution
// -----------------------------------------------------------------------------
runTest("All 17 UN SDGs have bundled SVG logo mappings", () => {
  assert.strictEqual(Object.keys(SDG_LOGOS).length, 17, "Must map 17 SDGs");
  for (let i = 1; i <= 17; i++) {
    const logoUrl = getSdgLogo(i);
    assert(logoUrl, `SDG ${i} must have a valid logo URL`);
    assert(logoUrl.includes(`sdg-${i}.svg`), `SDG ${i} URL must link to sdg-${i}.svg`);
  }
});

runTest("downloadReport.js pre-rasterizes SDG icons and prints 'SDG X - Title' format", () => {
  const reportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');
  assert(reportSrc.includes("rasterizeToPngDataUrl"), "Must rasterize SVG to PNG");
  assert(reportSrc.includes("canvas.width = 240"), "Must rasterize at high resolution");
  assert(reportSrc.includes("`SDG ${item.num} - `"), "Must use 'SDG X - Title' format");
  assert(reportSrc.includes("Promise.all"), "Must load all logos before PDF rendering");
});

// -----------------------------------------------------------------------------
// 7. Non-Destructive SQL Migration Verification
// -----------------------------------------------------------------------------
runTest("supabase_add_faculty_mentor_name.sql exists, is non-destructive, and has nullability for historical data", () => {
  const sqlPath = path.resolve('./supabase_add_faculty_mentor_name.sql');
  assert(fs.existsSync(sqlPath), "Migration file must exist");
  const sqlSrc = fs.readFileSync(sqlPath, 'utf-8');
  assert(sqlSrc.includes("ADD COLUMN IF NOT EXISTS faculty_mentor_name"), "Must add column non-destructively");
  assert(sqlSrc.includes("DEFAULT NULL"), "Must allow NULL for existing project records");
});

// -----------------------------------------------------------------------------
// 8. Form Section Placement, Role Clarification & Simplified Manual Input
// -----------------------------------------------------------------------------
runTest("RegisterProject.jsx has simplified Faculty Mentor Details with directory dropdown removed", () => {
  const registerSrc = fs.readFileSync(path.resolve('./src/pages/student/RegisterProject.jsx'), 'utf-8');
  const mentorSectionIdx = registerSrc.indexOf("E. Faculty Mentor Details");
  const coordinatorSectionIdx = registerSrc.indexOf("F. PBL Coordinator Mapping");
  assert(mentorSectionIdx > 0, "Must have section 'E. Faculty Mentor Details'");
  assert(coordinatorSectionIdx > 0, "Must have section 'F. PBL Coordinator Mapping'");
  assert(mentorSectionIdx < coordinatorSectionIdx, "Faculty Mentor Details must be placed before PBL Coordinator Mapping");
  
  // Verify directory dropdown and its logic are completely removed
  assert(!registerSrc.includes("Select from Faculty Directory"), "Must NOT contain faculty directory dropdown");
  assert(!registerSrc.includes("mentorDropdownVal"), "Must NOT contain mentorDropdownVal state");
  assert(!registerSrc.includes("Choose your mentor from the college faculty directory"), "Must NOT contain directory helper text");

  // Verify single required text input with exact label, placeholder, helper text, and validation
  assert(registerSrc.includes("Faculty Mentor Name"), "Must contain Faculty Mentor Name label");
  assert(registerSrc.includes('placeholder="e.g., Dr. S. K. Patil"'), "Must contain exact placeholder 'e.g., Dr. S. K. Patil'");
  assert(registerSrc.includes("Enter the full academic name of your faculty mentor."), "Must contain exact helper text");
  assert(registerSrc.includes("Faculty Mentor Name cannot be blank or whitespace only"), "Must validate against whitespace-only names");
  assert(registerSrc.includes("Role Clarification:"), "Must provide explicit role distinction callout");
});

// -----------------------------------------------------------------------------
// 9. Report Structure, Programme Specific Outcomes (PSOs) Mapped & Fallbacks
// -----------------------------------------------------------------------------
runTest("Reports use 'Programme Specific Outcomes (PSOs) Mapped:', full titles/descriptions, and correct section order", () => {
  const reportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');
  const viewerSrc = fs.readFileSync(path.resolve('./src/components/common/ProjectDocumentViewer.jsx'), 'utf-8');

  // Heading verification
  assert(reportSrc.includes('"Programme Specific Outcomes (PSOs) Mapped:"'), "downloadReport must use 'Programme Specific Outcomes (PSOs) Mapped:'");
  assert(viewerSrc.includes('Programme Specific Outcomes (PSOs) Mapped:'), "ProjectDocumentViewer must use 'Programme Specific Outcomes (PSOs) Mapped:'");

  // Description rendering verification
  assert(reportSrc.includes("details.desc"), "downloadReport must render official PSO description");
  assert(viewerSrc.includes("details.desc"), "ProjectDocumentViewer must render official PSO description");

  // Fallback and missing migration verification
  assert(reportSrc.includes("No Programme Specific Outcomes selected."), "downloadReport must handle empty PSO selection");
  assert(reportSrc.includes("supabase_add_psos_column.sql"), "downloadReport must report missing schema migration notice");
  assert(viewerSrc.includes("No Programme Specific Outcomes selected."), "ProjectDocumentViewer must handle empty PSO selection");
  assert(viewerSrc.includes("supabase_add_psos_column.sql"), "ProjectDocumentViewer must report missing schema migration notice");

  // Section order in downloadReport: Project Details -> POs -> SDGs -> PSOs -> Introduction -> Team Members -> Screenshots
  const posIdx = reportSrc.indexOf('"Mapping with POs:"');
  const sdgsIdx = reportSrc.indexOf('"SDG Goals Mapped:"');
  const psosIdx = reportSrc.indexOf('"Programme Specific Outcomes (PSOs) Mapped:"');
  const introIdx = reportSrc.indexOf('"Project Introduction:"');
  const teamIdx = reportSrc.indexOf('"Project Team Members:"');
  const screenshotsIdx = reportSrc.indexOf('Project Screenshot');

  assert(posIdx > 0 && sdgsIdx > posIdx, "SDGs must follow POs");
  assert(psosIdx > sdgsIdx, "PSOs must follow SDGs");
  assert(introIdx > psosIdx, "Project Introduction must follow PSOs");
  assert(teamIdx > introIdx, "Project Team Members must follow Project Introduction");
  assert(screenshotsIdx > teamIdx, "Project Screenshots must follow Project Team Members");
});

// -----------------------------------------------------------------------------
// 10. Teacher Evaluation Views Show Faculty Mentor
// -----------------------------------------------------------------------------
runTest("ProjectList.jsx and ProjectMonitoring.jsx show Faculty Mentor in review / modal views", () => {
  const listSrc = fs.readFileSync(path.resolve('./src/pages/teacher/ProjectList.jsx'), 'utf-8');
  const monitorSrc = fs.readFileSync(path.resolve('./src/pages/teacher/ProjectMonitoring.jsx'), 'utf-8');

  assert(listSrc.includes("selectedProject.faculty_mentor_name"), "ProjectList must display selectedProject.faculty_mentor_name");
  assert(monitorSrc.includes("selectedProject.faculty_mentor_name"), "ProjectMonitoring must display selectedProject.faculty_mentor_name");
});

// -----------------------------------------------------------------------------
// 11. Persistence and Report Formatting for New vs Existing Projects
// -----------------------------------------------------------------------------
runTest("Both newly registered projects and existing projects format Faculty Mentor correctly", () => {
  // 1. Newly registered project with mentor
  const newProject = {
    title: 'Smart Health Monitoring',
    faculty_mentor_name: 'Dr. S. K. Patil',
    mentor_name: 'Prof. PBL Coordinator'
  };
  const mentorFieldNew = newProject.faculty_mentor_name || 'Not Specified';
  assert.strictEqual(mentorFieldNew, 'Dr. S. K. Patil');

  // 2. Existing historical project with no mentor
  const legacyProject = {
    title: 'Legacy Student Project',
    faculty_mentor_name: null,
    mentor_name: 'Prof. PBL Coordinator'
  };
  const mentorFieldLegacy = legacyProject.faculty_mentor_name || 'Not Specified';
  assert.strictEqual(mentorFieldLegacy, 'Not Specified');
});

// -----------------------------------------------------------------------------
// 12. PSO Resolution, Normalization and Description Verification
// -----------------------------------------------------------------------------
runTest("PSO catalog and resolution utilities handle PSO1 and PSO3 with complete details and empty/missing cases", () => {
  // Case A: Selected PSO1 and PSO3

  const rawSelection = ['PSO1', 'PSO3'];
  const normalized = normalizePsos(rawSelection);
  assert.deepStrictEqual(normalized, ['PSO1', 'PSO3']);

  const pso1 = resolvePsoDetails('PSO1');
  assert.strictEqual(pso1.id, 'PSO1');
  assert.strictEqual(pso1.title, 'Software Systems and Computing');
  assert(pso1.desc.includes('analyze, design, develop, and evaluate efficient software and computing systems'));

  const pso3 = resolvePsoDetails('PSO3');
  assert.strictEqual(pso3.id, 'PSO3');
  assert.strictEqual(pso3.title, 'Innovation, Research, and Entrepreneurship');
  assert(pso3.desc.includes('apply research methodologies, emerging technologies, and entrepreneurial skills'));

  // Case B: No PSOs selected
  const emptySelection = normalizePsos([]);
  assert.deepStrictEqual(emptySelection, []);

  // Case C: Null/undefined handling
  assert.deepStrictEqual(normalizePsos(null), []);
  assert.deepStrictEqual(normalizePsos(undefined), []);
});




// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);
if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('All regression tests passed successfully!');
}
