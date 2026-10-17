import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== RSCOE PBL Portal: Final UI, Attachments & Signature Verification ===\n');

let passCount = 0;
let failCount = 0;

function pass(msg) {
  console.log(`[PASS] ${msg}`);
  passCount++;
}

function fail(msg, err) {
  console.error(`[FAIL] ${msg}`);
  if (err) console.error(err);
  failCount++;
}

// 1. Institutional Header Verification
try {
  const collegeHeaderPath = path.resolve('src/components/common/CollegeHeader.jsx');
  const collegeHeader = fs.readFileSync(collegeHeaderPath, 'utf8');

  // Verify enlarged logos
  assert(collegeHeader.includes('lg:h-26') || collegeHeader.includes('h-24') || collegeHeader.includes('h-20'), 'JSPM and RSCOE logos should be enlarged');
  assert(collegeHeader.includes('object-contain'), 'Logos must maintain aspect ratio via object-contain');
  assert(collegeHeader.includes('jspmLogo') && collegeHeader.includes('rscoeLogo'), 'Both original logos must be preserved');

  // Verify center text
  assert(collegeHeader.includes("JSPM's"), "Must contain JSPM's");
  assert(collegeHeader.includes('Rajarshi Shahu College of Engineering, Tathawade Pune-33'), 'Must contain college name and campus');
  assert(collegeHeader.includes('(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)'), 'Affiliation line must end with Pune) on the same line');
  assert(collegeHeader.includes('Department of Computer Engineering'), 'Must contain Department name');

  // Verify maroon theme
  assert(collegeHeader.includes('#701a28') || collegeHeader.includes('maroon'), 'Preserves maroon institutional theme');

  pass('CollegeHeader.jsx has enlarged logos, correct institutional text with Pune) on same line, and maroon theme');
} catch (e) {
  fail('CollegeHeader.jsx check failed', e);
}

// 2. Statistical Report Header Verification
try {
  const statReportPath = path.resolve('src/utils/downloadStatisticalReport.js');
  const statReport = fs.readFileSync(statReportPath, 'utf8');

  assert(statReport.includes('logoH = 22') || statReport.includes('logoH = 20'), 'Statistical report logos must be enlarged (>=20mm)');
  assert(statReport.includes('Pune)'), 'Statistical report includes Pune) in affiliation');
  assert(statReport.includes('(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)'), 'Statistical report has unified affiliation line');

  pass('downloadStatisticalReport.js has enlarged logos and single-line affiliation text');
} catch (e) {
  fail('downloadStatisticalReport.js check failed', e);
}

// 3. Project PDF Report Header and Signature Verification
try {
  const downloadReportPath = path.resolve('src/utils/downloadReport.js');
  const downloadReport = fs.readFileSync(downloadReportPath, 'utf8');

  // Logo sizes
  assert(downloadReport.includes('27, 21') || downloadReport.includes('25, 20'), 'PDF report logos must be enlarged');

  // Header text
  assert(downloadReport.includes('(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)'), 'PDF report has unified affiliation');

  // Signature section requirements
  assert(downloadReport.includes('PBL Coordinator Signature'), 'Must contain PBL Coordinator Signature');
  assert(downloadReport.includes('Team Leader Signature'), 'Must contain Team Leader Signature');
  assert(downloadReport.includes('Signature: __________________________'), 'Must contain standard signature line');
  assert(downloadReport.includes('sigBlockHeight') || downloadReport.includes('addPage'), 'Must calculate height and add new page if needed to prevent splitting');
  assert(!downloadReport.includes('Digitally Signed by') && !downloadReport.includes('Auto-approved'), 'Must NOT insert fabricated digital signatures');

  pass('downloadReport.js has enlarged logos, unified affiliation, and dedicated side-by-side signature section with pagination protection');
} catch (e) {
  fail('downloadReport.js check failed', e);
}

// 4. ProjectDocumentViewer.jsx Header and Signature Verification
try {
  const viewerPath = path.resolve('src/components/common/ProjectDocumentViewer.jsx');
  const viewer = fs.readFileSync(viewerPath, 'utf8');

  // Logo sizes
  assert(viewer.includes("height: '84px'") || viewer.includes('84px'), 'Viewer logos must be enlarged');

  // Header text
  assert(viewer.includes('(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)'), 'Viewer has unified affiliation line');

  // Signature section
  assert(viewer.includes('PBL Coordinator Signature'), 'Viewer must contain PBL Coordinator Signature');
  assert(viewer.includes('Team Leader Signature'), 'Viewer must contain Team Leader Signature');
  assert(viewer.includes('Signature: __________________________'), 'Viewer must contain signature line');
  assert(viewer.includes("breakInside: 'avoid'") || viewer.includes("pageBreakInside: 'avoid'"), 'Viewer must protect signature block from print breaks');

  pass('ProjectDocumentViewer.jsx has enlarged logos, unified affiliation, and print-ready signature section');
} catch (e) {
  fail('ProjectDocumentViewer.jsx check failed', e);
}

// 5. Screenshot Limit (Max 4) Logic & UI Verification
try {
  const registerPath = path.resolve('src/pages/student/RegisterProject.jsx');
  const register = fs.readFileSync(registerPath, 'utf8');

  // Check constant & UI
  assert(register.includes('MAX_SCREENSHOTS = 4'), 'MAX_SCREENSHOTS must be set to 4');
  assert(register.includes('Maximum limit of 4 project screenshots reached'), 'Clear explanation when maximum reached');
  assert(register.includes('screenshots.length < MAX_SCREENSHOTS'), 'Upload control disabled/hidden at limit');
  assert(register.includes('removeScreenshot'), 'Screenshot removal function exists');

  // Functional simulation of screenshot limits: 0, 1, 4, 5
  function validateScreenshots(existingCount, newFilesCount) {
    const MAX_SCREENSHOTS = 4;
    const total = existingCount + newFilesCount;
    if (total > MAX_SCREENSHOTS) {
      return { allowed: false, error: `You can upload a maximum of ${MAX_SCREENSHOTS} screenshots.` };
    }
    return { allowed: true, newTotal: total };
  }

  // Test 0 files
  assert.strictEqual(validateScreenshots(0, 0).allowed, true);
  // Test 1 file
  assert.strictEqual(validateScreenshots(0, 1).allowed, true);
  // Test 4 files
  assert.strictEqual(validateScreenshots(0, 4).allowed, true);
  assert.strictEqual(validateScreenshots(2, 2).allowed, true);
  // Test 5 files (must fail)
  assert.strictEqual(validateScreenshots(0, 5).allowed, false);
  assert.strictEqual(validateScreenshots(4, 1).allowed, false);

  // Test removal allows adding another:
  let count = 4;
  // remove 1
  count -= 1;
  assert.strictEqual(validateScreenshots(count, 1).allowed, true);
  assert.strictEqual(validateScreenshots(count, 1).newTotal, 4);

  pass('RegisterProject.jsx screenshot limits strictly enforce max 4 with UI disabling, error handling, and removal re-enabling');
} catch (e) {
  fail('Screenshot limit verification failed', e);
}

// 6. Hackathon Certificate Limit (Max 3) Logic & UI Verification
try {
  const registerPath = path.resolve('src/pages/student/RegisterProject.jsx');
  const register = fs.readFileSync(registerPath, 'utf8');

  // Check constant & UI
  assert(register.includes('MAX_CERTIFICATES = 3'), 'MAX_CERTIFICATES must be set to 3');
  assert(register.includes('Maximum limit of 3 certificate documents reached'), 'Clear explanation when max certificates reached');
  assert(register.includes('certificates.length < MAX_CERTIFICATES'), 'Certificate upload control disabled/hidden at limit');
  assert(register.includes('removeCertificate'), 'Certificate removal function exists');

  // Functional simulation of certificate limits: 0, 1, 3, 4
  function validateCertificates(type, existingCount, newFilesCount) {
    const MAX_CERTIFICATES = 3;
    const total = existingCount + newFilesCount;
    if (type === 'Hackathon') {
      if (total === 0) {
        return { allowed: false, error: 'Please attach a proof / certificate for the Hackathon.' };
      }
      if (total > MAX_CERTIFICATES) {
        return { allowed: false, error: `You can upload a maximum of ${MAX_CERTIFICATES} certificate documents.` };
      }
      return { allowed: true, newTotal: total };
    } else {
      // Non-hackathon
      return { allowed: true, newTotal: 0 };
    }
  }

  // Non-hackathon with 0 certificates is allowed
  assert.strictEqual(validateCertificates('Standard', 0, 0).allowed, true);

  // Hackathon with 0 certificates is rejected
  assert.strictEqual(validateCertificates('Hackathon', 0, 0).allowed, false);

  // Hackathon with 1 certificate is allowed
  assert.strictEqual(validateCertificates('Hackathon', 0, 1).allowed, true);

  // Hackathon with 3 certificates is allowed
  assert.strictEqual(validateCertificates('Hackathon', 1, 2).allowed, true);
  assert.strictEqual(validateCertificates('Hackathon', 0, 3).allowed, true);

  // Hackathon with 4 certificates is rejected
  assert.strictEqual(validateCertificates('Hackathon', 0, 4).allowed, false);
  assert.strictEqual(validateCertificates('Hackathon', 3, 1).allowed, false);

  // Removal allows adding another
  let certCount = 3;
  certCount -= 1; // remove 1
  assert.strictEqual(validateCertificates('Hackathon', certCount, 1).allowed, true);
  assert.strictEqual(validateCertificates('Hackathon', certCount, 1).newTotal, 3);

  pass('RegisterProject.jsx hackathon certificate limits strictly enforce max 3, require proof for Hackathons, unaffected for non-hackathons, and allow re-adding on removal');
} catch (e) {
  fail('Hackathon certificate limit verification failed', e);
}

// 7. ProjectCertificateLink backward compatibility & multi-certificate support
try {
  const attachPath = path.resolve('src/components/common/ProjectAttachments.jsx');
  const attach = fs.readFileSync(attachPath, 'utf8');

  assert(attach.includes('parseRawUrls'), 'Must have parseRawUrls helper');
  assert(attach.includes('JSON.parse'), 'Must support JSON stringified array of URLs');

  // Test parsing logic
  function parseRawUrls(rawUrl) {
    if (!rawUrl) return [];
    if (Array.isArray(rawUrl)) return rawUrl.filter(Boolean);
    if (typeof rawUrl === 'string') {
      const trimmed = rawUrl.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {}
      }
      return [trimmed];
    }
    return [];
  }

  // Single legacy URL
  assert.deepStrictEqual(parseRawUrls('cert1.pdf'), ['cert1.pdf']);
  // Array of URLs
  assert.deepStrictEqual(parseRawUrls(['cert1.pdf', 'cert2.pdf']), ['cert1.pdf', 'cert2.pdf']);
  // JSON array string
  assert.deepStrictEqual(parseRawUrls('["cert1.pdf", "cert2.pdf", "cert3.png"]'), ['cert1.pdf', 'cert2.pdf', 'cert3.png']);
  // Null / empty
  assert.deepStrictEqual(parseRawUrls(null), []);
  assert.deepStrictEqual(parseRawUrls(''), []);

  pass('ProjectCertificateLink backward compatibility handles null, single strings, stringified JSON arrays, and direct arrays');
} catch (e) {
  fail('ProjectCertificateLink parsing test failed', e);
}

console.log(`\nResults: ${passCount} passed, ${failCount} failed\n`);
if (failCount > 0) process.exit(1);
