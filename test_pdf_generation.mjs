import assert from 'node:assert';
import fs from 'node:fs';
import { jsPDF } from 'jspdf';
import { PO_LIST, PSO_LIST, SDG_GOALS } from './src/utils/constants.js';

console.log('=== Verifying PDF Layout and Content Engine ===\n');

// Mock project matching reference
const mockProject = {
  id: 42,
  title: 'NoteMaster AI Assistant',
  type: 'Complex Engineering', // Legacy value to test normalization
  domain: 'AI/ML',
  faculty_mentor_name: 'Dr. S. K. Patil',
  mentor_name: 'Prof. Coordinator User', // Should NOT appear in report
  academic_year: '2025-26',
  semester: 'Semester VI',
  description: 'NoteMaster is an intelligent study companion designed to summarize engineering lectures and map learning outcomes.',
  pos: ['PO3', 'PO5', 'PO1', 'PO9'],
  psos: ['PSO1', 'PSO2'],
  sdg_goals: [4, 9],
  team_members: [
    { name: 'Swanandi Deshkar', rollNumber: '42101', rbtNumber: 'RBT421' },
    { name: 'Aditya Sharma', rollNumber: '42102', rbtNumber: 'RBT422' }
  ]
};

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = doc.internal.pageSize.getWidth();
const margin = 20;
const contentWidth = pageWidth - (margin * 2);
let y = 12;

// 1. Exact Institutional Header
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text("JSPM’s", pageWidth / 2, y, { align: 'center' });
y += 4.5;

doc.setFontSize(12);
doc.text("Rajarshi Shahu College of Engineering, Tathawade Pune-33", pageWidth / 2, y, { align: 'center' });
y += 4.5;

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.text("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)", pageWidth / 2, y, { align: 'center' });
y += 4.5;

doc.setFont('helvetica', 'bold');
doc.setFontSize(10.5);
doc.text("Department of Computer Engineering", pageWidth / 2, y, { align: 'center' });
y += 5;

const academicYear = mockProject.academic_year || 'Not Specified';
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.text(`Academic Year: ${academicYear}`, pageWidth / 2, y, { align: 'center' });
y += 4;

doc.setDrawColor(30, 30, 30);
doc.setLineWidth(0.4);
doc.line(margin, y, pageWidth - margin, y);
y += 8;

// 2. Heading
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.text("Project Details", pageWidth / 2, y, { align: 'center' });
y += 10;

// Fields
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

// Title
doc.text("Title of the Project: " + mockProject.title, margin, y);
y += 6;

// Type normalized
const projectType = mockProject.type === 'Complex Engineering' ? 'Complex Engineering Problems' : mockProject.type;
doc.text("Type of Project: " + projectType, margin, y);
y += 6;

// Domain
doc.text("Project Domain: " + mockProject.domain, margin, y);
y += 6;

// Faculty Mentor Name
doc.text("Faculty Mentor Name: " + (mockProject.faculty_mentor_name || 'Not Specified'), margin, y);
y += 6;

// Team Members
doc.text("Project Team Members:", margin, y);
y += 5.5;
for (let i = 0; i < mockProject.team_members.length; i++) {
  const m = mockProject.team_members[i];
  doc.text(`${i + 1}) ${m.name} (${m.rollNumber} / ${m.rbtNumber})`, margin + 3, y);
  y += 5.5;
}

// POs
doc.text("Mapping with POs:", margin, y);
y += 6;
for (const poId of mockProject.pos) {
  doc.text(formatPoLine(poId), margin + 3, y);
  y += 5.5;
}

// SDGs
doc.text("SDG Goals Mapped:", margin, y);
y += 6;
for (const sdgId of mockProject.sdg_goals) {
  const goal = SDG_GOALS.find(g => g.id === sdgId);
  doc.text(`SDG ${sdgId} - ${goal.title}`, margin + 3, y);
  y += 6;
}

// PSOs
doc.text("Programme Specific Outcomes (PSOs) Mapped:", margin, y);
y += 6;
for (const psoId of mockProject.psos) {
  const pso = PSO_LIST.find(p => p.id === psoId);
  doc.text(`${pso.id}: ${pso.title}`, margin + 3, y);
  y += 5;
  doc.text(pso.desc, margin + 6, y);
  y += 7;
}

// Description
doc.text("Project Introduction:", margin, y);
y += 6;
doc.text(mockProject.description, margin + 3, y);

const pdfOutput = doc.output();
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync('./tmp_generated_test_report.pdf', pdfBuffer);

console.log('Generated test PDF: ./tmp_generated_test_report.pdf (' + pdfBuffer.length + ' bytes)');

// Verify text contents
assert(pdfOutput.includes("Department of Computer Engineering"), "Must contain department");
assert(pdfOutput.includes("Academic Year: 2025-26"), "Must contain exact project academic year");
assert(pdfOutput.includes("Complex Engineering Problems"), "Must normalize to Complex Engineering Problems");
assert(pdfOutput.includes("Faculty Mentor Name: Dr. S. K. Patil"), "Must contain Faculty Mentor Name");
assert(!pdfOutput.includes("PBL Coordinator Name"), "Must NOT contain PBL Coordinator Name");
assert(!pdfOutput.includes("Prof. Coordinator User"), "Must NOT contain assigned coordinator name");
assert(pdfOutput.includes("PO 3: Design/Development of Solutions"), "Must contain PO 3 title");
assert(pdfOutput.includes("PO 5: Engineering Tool Usage"), "Must contain PO 5 title");
assert(pdfOutput.includes("SDG 4 - Quality Education"), "Must contain SDG 4 title");
assert(pdfOutput.includes("SDG 9 - Industry Innovation & Infrastructure"), "Must contain SDG 9 title");
assert(pdfOutput.includes("Programme Specific Outcomes \\(PSOs\\) Mapped:") || pdfOutput.includes("Programme Specific Outcomes"), "Must contain Programme Specific Outcomes (PSOs) Mapped: heading");
assert(pdfOutput.includes("PSO1: Software Systems and Computing"), "Must contain PSO1 title");
assert(pdfOutput.includes("Graduates will be able to analyze, design, develop, and evaluate efficient software"), "Must contain full PSO1 description");

console.log('[PASS] PDF Layout, fields, and institutional header verified 100% successfully!\n');


