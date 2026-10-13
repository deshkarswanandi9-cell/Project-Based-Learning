import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import jspmLogo from '../assets/jspm_logo.jpeg';
import rscoeLogo from '../assets/rscoe_logo.png';
import { SDG_GOALS } from './constants';

/**
 * Loads an image from URL and converts it to a clean base64 data URL with natural dimensions.
 */
const loadImageData = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Generates an official, college-branded Statistical Report in PDF format.
 *
 * @param {Object} options
 * @param {Object} options.stats - Compiled statistics { total, pending, approved, rejected, students, domains, types }
 * @param {Array}  options.projects - List of project objects with student info
 * @param {Object} options.profile - Authenticated teacher/coordinator profile
 * @param {Object} options.sdgCounts - Map of SDG goal number to project count
 */
export const downloadStatisticalReportPDF = async ({
  stats = {},
  projects = [],
  profile = {},
  sdgCounts = {},
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 12;
  const _printableWidth = pageWidth - margin * 2; // 186mm

  // Fetch logos
  const [jspmImg, rscoeImg] = await Promise.all([
    loadImageData(jspmLogo),
    loadImageData(rscoeLogo),
  ]);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dateSlug = now.toISOString().split('T')[0];
  const coordinatorName = profile?.full_name || 'PBL Coordinator';
  const deptName = profile?.department || 'Department of Computer Engineering';

  // 1. ADD LOGOS (Header)
  const logoH = 17;
  if (jspmImg?.dataUrl) {
    const w = logoH * (jspmImg.width / jspmImg.height);
    doc.addImage(jspmImg.dataUrl, 'PNG', margin, 10, w, logoH);
  }
  if (rscoeImg?.dataUrl) {
    const w = logoH * (rscoeImg.width / rscoeImg.height);
    doc.addImage(rscoeImg.dataUrl, 'PNG', pageWidth - margin - w, 10, w, logoH);
  }

  // 2. COLLEGE HEADER TEXT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("JSPM'S RAJARSHI SHAHU COLLEGE OF ENGINEERING", pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text('(An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(45, 45, 45);
  doc.text(deptName.toUpperCase(), pageWidth / 2, 22.5, { align: 'center' });

  // Report Title (Maroon Banner text)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(138, 58, 58); // Maroon #8a3a3a
  doc.text('PROJECT BASED LEARNING – STATISTICAL REPORT', pageWidth / 2, 28, { align: 'center' });

  // Metadata Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Academic Year: 2026–2027   |   Generated On: ${dateFormatted}   |   PBL Coordinator: ${coordinatorName}`,
    pageWidth / 2,
    33,
    { align: 'center' }
  );

  // Horizontal Maroon Divider
  doc.setDrawColor(138, 58, 58);
  doc.setLineWidth(0.6);
  doc.line(margin, 36, pageWidth - margin, 36);

  let currentY = 41;
  const totalProjects = stats.total || projects.length || 0;

  // Helper for section headings in PDF
  const addSectionTitle = (title) => {
    // Check if near page bottom
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(138, 58, 58);
    doc.text(title, margin, currentY);
    currentY += 3;
  };

  // ══════════════════════════════════════════════════════════════════════
  // SECTION A: STATISTICAL OVERVIEW
  // ══════════════════════════════════════════════════════════════════════
  addSectionTitle('A. STATISTICAL OVERVIEW');

  const pendingCount = stats.pending || projects.filter((p) => p.status === 'Pending').length || 0;
  const approvedCount = stats.approved || projects.filter((p) => p.status === 'Approved').length || 0;
  const rejectedCount = stats.rejected || projects.filter((p) => p.status === 'Rejected').length || 0;
  const studentCount = stats.students || new Set(projects.map((p) => p.student_id)).size || 0;

  const overviewRows = [
    ['Total Enrolled Students', studentCount.toString(), 'Active Registered Cohort'],
    ['Total Submitted Projects', totalProjects.toString(), totalProjects > 0 ? '100.0% of submissions' : '0.0%'],
    [
      'Projects Pending Approval',
      pendingCount.toString(),
      totalProjects > 0 ? `${((pendingCount / totalProjects) * 100).toFixed(1)}% Pending Coordinator Review` : '0.0%',
    ],
    [
      'Fully Approved Projects',
      approvedCount.toString(),
      totalProjects > 0 ? `${((approvedCount / totalProjects) * 100).toFixed(1)}% Certified & Approved` : '0.0%',
    ],
  ];

  if (rejectedCount > 0) {
    overviewRows.push([
      'Projects Requiring Revision / Rejected',
      rejectedCount.toString(),
      totalProjects > 0 ? `${((rejectedCount / totalProjects) * 100).toFixed(1)}% Returned with remarks` : '0.0%',
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Key Academic Metric', 'Value / Count', 'Distribution / Status Summary']],
    body: overviewRows,
    theme: 'striped',
    headStyles: {
      fillColor: [138, 58, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 81 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION B: PROJECT DOMAIN & TYPE BREAKDOWN
  // ══════════════════════════════════════════════════════════════════════
  addSectionTitle('B. PROJECT DOMAIN & TYPE BREAKDOWN');

  // 1. Domains Table
  const domainData = [];
  const domainObj = stats.domains || {};
  const domainEntries = Object.entries(domainObj);

  if (domainEntries.length > 0) {
    domainEntries.forEach(([dom, count]) => {
      const pct = totalProjects > 0 ? `${((count / totalProjects) * 100).toFixed(1)}%` : '0.0%';
      domainData.push([dom, count.toString(), pct]);
    });
    domainData.push(['Total by Domain', totalProjects.toString(), '100.0%']);
  } else {
    domainData.push(['No domain data recorded', '0', '0.0%']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Project Domain', 'Project Count', 'Percentage Share (%)']],
    body: domainData,
    theme: 'striped',
    headStyles: {
      fillColor: [138, 58, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'center', cellWidth: 43 },
      2: { halign: 'center', cellWidth: 43 },
    },
    didParseCell: (data) => {
      if (data.row.index === domainData.length - 1 && domainEntries.length > 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 2. Types Table
  const typeData = [];
  const typeObj = stats.types || {};
  const typeEntries = Object.entries(typeObj);

  if (typeEntries.length > 0) {
    typeEntries.forEach(([t, count]) => {
      const pct = totalProjects > 0 ? `${((count / totalProjects) * 100).toFixed(1)}%` : '0.0%';
      typeData.push([t, count.toString(), pct]);
    });
    typeData.push(['Total by Type', totalProjects.toString(), '100.0%']);
  } else {
    typeData.push(['No project type data recorded', '0', '0.0%']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Project Type', 'Project Count', 'Percentage Share (%)']],
    body: typeData,
    theme: 'striped',
    headStyles: {
      fillColor: [100, 40, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'center', cellWidth: 43 },
      2: { halign: 'center', cellWidth: 43 },
    },
    didParseCell: (data) => {
      if (data.row.index === typeData.length - 1 && typeEntries.length > 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION C: UN SUSTAINABLE DEVELOPMENT GOALS (SDG) COVERAGE
  // ══════════════════════════════════════════════════════════════════════
  addSectionTitle('C. UN SUSTAINABLE DEVELOPMENT GOALS (SDG) COVERAGE');

  const sdgRows = [];
  const activeSdgEntries = Object.entries(sdgCounts);

  if (activeSdgEntries.length > 0) {
    activeSdgEntries
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([numStr, count]) => {
        const goal = SDG_GOALS.find((g) => g.id === parseInt(numStr));
        const pct = totalProjects > 0 ? `${((count / totalProjects) * 100).toFixed(1)}%` : '0.0%';
        sdgRows.push([`Goal ${numStr}`, goal?.title || `SDG Goal ${numStr}`, count.toString(), pct]);
      });
  } else {
    sdgRows.push(['—', 'No SDG coverage mapped for current project submissions', '0', '0.0%']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Goal #', 'Sustainable Development Goal Title / Description', 'Projects Count', 'Coverage (%)']],
    body: sdgRows,
    theme: 'striped',
    headStyles: {
      fillColor: [138, 58, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold' },
      1: { cellWidth: 105 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 28 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION D: PROJECT SUBMISSION REGISTER (ALL / RECENT PROJECTS)
  // ══════════════════════════════════════════════════════════════════════
  addSectionTitle('D. PROJECT SUBMISSION REGISTER');

  const projectRows = [];
  if (projects.length > 0) {
    projects.forEach((p, idx) => {
      projectRows.push([
        (idx + 1).toString(),
        p.students?.full_name || '—',
        p.students?.roll_number || '—',
        p.title || 'Untitled Project',
        p.domain || '—',
        p.type || '—',
        p.status || 'Pending',
      ]);
    });
  } else {
    projectRows.push(['—', 'No student project applications found.', '—', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Sr.', 'Student Name', 'Roll No', 'Project Title', 'Domain', 'Type', 'Status']],
    body: projectRows,
    showHead: 'everyPage',
    theme: 'striped',
    headStyles: {
      fillColor: [138, 58, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 55 },
      4: { cellWidth: 25 },
      5: { cellWidth: 21 },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw;
        if (val === 'Approved') data.cell.styles.textColor = [16, 120, 50];
        else if (val === 'Pending') data.cell.styles.textColor = [180, 110, 0];
        else if (val === 'Rejected') data.cell.styles.textColor = [180, 30, 30];
      }
    },
  });

  // ══════════════════════════════════════════════════════════════════════
  // PAGE NUMBERS & INSTITUTIONAL FOOTER ON ALL PAGES
  // ══════════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    // Footer divider line
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageWidth - margin, pageH - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(
      "JSPM's Rajarshi Shahu College of Engineering, Pune · Dept. of Computer Engineering",
      margin,
      pageH - 7
    );

    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageH - 7, { align: 'right' });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SAVE FILE
  // ══════════════════════════════════════════════════════════════════════
  const filename = `RSCOE_PBL_Statistical_Report_${dateSlug}.pdf`;
  doc.save(filename);
};
