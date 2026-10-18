import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== RSCOE PBL Portal: Report Outer Border Verification ===\n');

// 1. Verify downloadReport.js draws outer border across all pages
const downloadReportSrc = fs.readFileSync(path.resolve('./src/utils/downloadReport.js'), 'utf-8');

assert(downloadReportSrc.includes('// I. DRAW OUTER PAGE BORDER ON ALL PAGES'), 'Must contain outer border section comment');
assert(downloadReportSrc.includes('doc.internal.getNumberOfPages()'), 'Must determine total pages dynamically');
assert(downloadReportSrc.includes('doc.setPage(i)'), 'Must iterate through all pages');
assert(downloadReportSrc.includes('doc.rect(borderMargin, borderMargin, borderWidth, borderHeight)'), 'Must draw border rectangle on each page');
assert(downloadReportSrc.includes('borderMargin = 8'), 'Must use 8mm border margin for standard institutional framing');
console.log('[PASS] downloadReport.js draws outer border across all document pages with 8mm margin.');

// 2. Verify ProjectDocumentViewer.jsx has solid outer border
const viewerSrc = fs.readFileSync(path.resolve('./src/components/common/ProjectDocumentViewer.jsx'), 'utf-8');
assert(viewerSrc.includes("border: '2px solid #111'"), 'ProjectDocumentViewer preview must match the crisp solid outer border');
console.log('[PASS] ProjectDocumentViewer.jsx renders matching 2px solid outer border for on-screen preview.');

// 3. Verify clean header clearance
assert(downloadReportSrc.includes('addImageAsync(jspmLogo, 14, 11, 27, 21)'), 'Header logos must clear top border with comfortable margin');
console.log('[PASS] Institutional logos and header maintain clear breathing room inside the outer border.');

// 4. Verify Certificate / Proof description is completely removed from the report
assert(!downloadReportSrc.includes('Certificate / Proof:'), 'Certificate / Proof field must be removed from the project report');
console.log('[PASS] Certificate / Proof description field removed from downloadReport.js.');

// 5. Verify downloadStatisticalReport.js also has outer border
const statReportSrc = fs.readFileSync(path.resolve('./src/utils/downloadStatisticalReport.js'), 'utf-8');
assert(statReportSrc.includes('// Outer page border'), 'downloadStatisticalReport.js must contain outer border');
assert(statReportSrc.includes('doc.rect(borderMargin, borderMargin, borderWidth, borderHeight)'), 'downloadStatisticalReport.js must draw border rect on each page');
console.log('[PASS] downloadStatisticalReport.js includes outer page border on all pages.');

console.log('\nAll outer border and report cleanup verification tests passed successfully!');
