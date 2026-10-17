import jsPDF from 'jspdf';
import jspmLogo from '../assets/jspm_logo.jpeg';
import rscoeLogo from '../assets/rscoe_logo.png';
import { getSignedViewUrls } from './storageUtils';
import { SDG_GOALS, PO_LIST, PSO_LIST, normalizePsos, resolvePsoDetails, getEffectivePsos } from './constants';
import { getSdgLogo } from './sdgLogos';

/**
 * Rasterizes an image (including SVGs) into a clean, high-DPI base64 PNG data URL using HTML5 Canvas.
 * This ensures vector SVGs can be embedded directly into jsPDF without error or external dependencies.
 */
const rasterizeToPngDataUrl = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, 240, 240);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

/**
 * Resolves a PO ID to its official formatted string: "PO X: [Official Title]"
 */
const formatPoLine = (poId) => {
  const num = String(poId).replace(/\D/g, '');
  const found = PO_LIST.find(p => p.id === poId || p.id === `PO${num}` || String(p.poNumber) === num);
  if (found) {
    const poNum = found.poNumber || num || found.id.replace('PO', '');
    return `PO ${poNum}: ${found.title}`;
  }
  return String(poId).startsWith('PO') ? String(poId) : `PO ${poId}`;
};

/**
 * Resolves a PSO ID to its official formatted string: "PSO X: [Official Title]"
 */
export const formatPsoLine = (psoId) => {
  const details = resolvePsoDetails(psoId);
  return details ? `${details.id}: ${details.title}` : `PSO ${psoId}`;
};


/**
 * Generates an official PDF report for a project matching the JSPM RSCOE NoteMaster format.
 */
export const downloadReport = async (project, _studentProfile) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 12;

  const isDraft = Boolean(project.isDraft);
  if (isDraft) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text("[ UNSAVED DRAFT PREVIEW — NOT PERSISTED TO DATABASE ]", pageWidth / 2, 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  // Function to add image and wait for it
  const addImageAsync = (src, x, yPos, w, h) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        doc.addImage(img, 'JPEG', x, yPos, w, h);
        resolve();
      };
      img.onerror = () => resolve();
    });
  };

  // 1. ADD INSTITUTION LOGOS
  await Promise.all([
    addImageAsync(jspmLogo, 14, 9, 27, 21),
    addImageAsync(rscoeLogo, pageWidth - 41, 9, 27, 21)
  ]);

  // 2. EXACT INSTITUTION HEADER
  // JSPM's
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("JSPM’s", pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  // College Name
  doc.setFontSize(12);
  doc.text("Rajarshi Shahu College of Engineering, Tathawade Pune-33", pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  // Autonomy Affiliation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text("(An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)", pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  // Department Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text("Department of Computer Engineering", pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Academic Year directly below Department of Computer Engineering
  const academicYear = project.academic_year || 'Not Specified';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Academic Year: ${academicYear}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Horizontal divider
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // 3. SECTION HEADING: Project Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text("Project Details", pageWidth / 2, y, { align: 'center' });
  const titleWidth = doc.getTextWidth("Project Details");
  doc.line((pageWidth / 2) - (titleWidth / 2), y + 1.5, (pageWidth / 2) + (titleWidth / 2), y + 1.5);
  y += 10;

  // 4. FIELDS HELPER
  doc.setFontSize(10.5);
  const labelFont = 'helvetica';
  const valueFont = 'helvetica';

  const checkPageBreak = (neededHeight = 12) => {
    if (y + neededHeight > 275) {
      doc.addPage();
      y = 20;
    }
  };

  const addField = (label, value, isBoldLabel = true, spacing = 8) => {
    if (!value) return;
    checkPageBreak(10);
    doc.setFont(labelFont, isBoldLabel ? 'bold' : 'normal');
    const labelW = doc.getTextWidth(label + " ");
    doc.text(label, margin, y);
    doc.setFont(valueFont, 'normal');

    const lines = doc.splitTextToSize(String(value), contentWidth - labelW);
    doc.text(lines, margin + labelW, y);
    y += (lines.length * 5) + spacing - 5;
  };

  // Section B Fields:
  // Title of the Project
  addField("Title of the Project:", project.title);

  // Type of Project (normalize historical 'Complex Engineering' to 'Complex Engineering Problems')
  const projectType = project.type === 'Complex Engineering'
    ? 'Complex Engineering Problems'
    : (project.type || 'PBL Project');
  addField("Type of Project:", projectType);

  // Project Domain (if supported)
  if (project.domain) {
    addField("Project Domain:", project.domain);
  }

  // Faculty Mentor Name (DO NOT confuse with PBL Coordinator; Coordinator is NOT printed anywhere in report)
  addField("Faculty Mentor Name:", project.faculty_mentor_name || 'Not Specified');

  // Hackathon Specific Fields (only shown when applicable)
  const isHackathon = project.type?.startsWith('Hackathon') || !!project.hackathon_title;
  if (isHackathon) {
    if (project.hackathon_title) {
      addField("Hackathon Event:", project.hackathon_title);
    }
    if (project.hackathon_position) {
      const awardText = project.hackathon_position === 'Other' && project.hackathon_award_type
        ? `Other (${project.hackathon_award_type})`
        : project.hackathon_position;
      addField("Position Secured:", awardText);
    }
    if (project.achievement_title) {
      addField("Achievement Highlight:", project.achievement_title);
    }
    if (project.achievement_description) {
      addField("Achievement Description:", project.achievement_description);
    }
    if (project.location_mode) {
      addField("Location Mode:", project.location_mode);
    }
    if (project.location_mode === 'Online / Virtual') {
      if (project.venue_details) {
        addField("Online Platform / Details:", project.venue_details);
      }
    } else {
      const venueParts = [
        project.venue_details,
        project.city,
        project.state,
        project.pincode ? `PIN: ${project.pincode}` : null
      ].filter(Boolean);
      if (venueParts.length > 0) {
        addField("Venue / Location:", venueParts.join(', '));
      }
    }
    if (project.document_url) {
      addField("Certificate / Proof:", "Attached and archived in portal repository");
    }
  }

  // Semester if available
  if (project.semester) {
    addField("Semester:", project.semester);
  }

  // C. MAPPING WITH POS (Separate lines with official titles)
  if (project.pos && project.pos.length > 0) {
    checkPageBreak(20);
    doc.setFont(labelFont, 'bold');
    doc.text("Mapping with POs:", margin, y);
    y += 6;
    doc.setFont(valueFont, 'normal');

    for (const poId of project.pos) {
      checkPageBreak(8);
      const formatted = formatPoLine(poId);
      const parts = formatted.split(': ');
      const prefix = `${parts[0]}: `;
      const title = parts.slice(1).join(': ');

      doc.setFont(labelFont, 'bold');
      doc.text(prefix, margin + 3, y);
      const prefixW = doc.getTextWidth(prefix);

      doc.setFont(valueFont, 'normal');
      const lines = doc.splitTextToSize(title, contentWidth - 3 - prefixW);
      doc.text(lines, margin + 3 + prefixW, y);
      y += (lines.length * 5) + 1.5;
    }
    y += 3;
  }

  // D. SDG GOALS MAPPED (Official SDG Logo + Full Official Title on separate lines)
  const sdgs = (project.sdg_goals || []).map(Number).filter(n => n >= 1 && n <= 17);
  if (sdgs.length > 0) {
    checkPageBreak(25);
    doc.setFont(labelFont, 'bold');
    doc.text("SDG Goals Mapped:", margin, y);
    y += 7;

    // Pre-rasterize official bundled SDG logos asynchronously to ensure zero blank/broken icons
    const sdgItems = await Promise.all(
      sdgs.map(async (num) => {
        const goal = SDG_GOALS.find(g => g.id === num);
        if (!goal) return null;
        const svgAssetUrl = getSdgLogo(num);
        const pngData = await rasterizeToPngDataUrl(svgAssetUrl);
        return { num, goal, pngData };
      })
    );

    const logoSize = 8; // mm (square, preserving original proportions)
    for (const item of sdgItems.filter(Boolean)) {
      checkPageBreak(12);
      if (item.pngData) {
        doc.addImage(item.pngData, 'PNG', margin + 3, y - 5.5, logoSize, logoSize);
      }

      const textX = margin + 3 + logoSize + 4;
      const sdgPrefix = `SDG ${item.num} - `;
      doc.setFont(labelFont, 'bold');
      doc.text(sdgPrefix, textX, y);
      const prefixW = doc.getTextWidth(sdgPrefix);

      doc.setFont(valueFont, 'normal');
      const titleLines = doc.splitTextToSize(item.goal.title, contentWidth - (textX + prefixW - margin));
      doc.text(titleLines, textX + prefixW, y);

      y += Math.max(logoSize + 2, (titleLines.length * 5) + 3);
    }
    y += 3;
  }

  // E. PROGRAMME SPECIFIC OUTCOMES (PSOS) MAPPED
  checkPageBreak(25);
  doc.setFont(labelFont, 'bold');
  if (isDraft) {
    doc.text("Programme Specific Outcomes (PSOs) Mapped: [Form Preview]", margin, y);
  } else {
    doc.text("Programme Specific Outcomes (PSOs) Mapped:", margin, y);
  }
  y += 6;

  const rawPsos = project.psos;
  const isPsoColumnMissing = !isDraft && rawPsos === undefined;

  if (isPsoColumnMissing) {
    doc.setFont(valueFont, 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9);
    const warnLines = doc.splitTextToSize("Notice: PSO mapping is pending database column migration (supabase_add_psos_column.sql).", contentWidth - 3);
    doc.text(warnLines, margin + 3, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10.5);
    y += (warnLines.length * 5) + 3;
    const rawSelected = normalizePsos(rawPsos);
    const selectedPsoList = rawSelected.length > 0 ? rawSelected : getEffectivePsos(project);
    if (selectedPsoList.length === 0) {
      doc.setFont(valueFont, 'italic');
      doc.setFontSize(9.5);
      doc.text("No Programme Specific Outcomes selected.", margin + 3, y);
      doc.setFontSize(10.5);
      y += 6;
    } else {
      for (const psoEntry of selectedPsoList) {
        const details = resolvePsoDetails(psoEntry);
        if (!details) continue;

        checkPageBreak(20);
        // PSO Identifier and Full Title
        doc.setFont(labelFont, 'bold');
        doc.setFontSize(10);
        const heading = `${details.id}: ${details.title}`;
        const headLines = doc.splitTextToSize(heading, contentWidth - 3);
        doc.text(headLines, margin + 3, y);
        y += (headLines.length * 4.8) + 1;

        // Full Official Description
        if (details.desc) {
          doc.setFont(valueFont, 'normal');
          doc.setFontSize(9);
          const descLines = doc.splitTextToSize(details.desc, contentWidth - 6);
          doc.text(descLines, margin + 6, y);
          y += (descLines.length * 4.2) + 3;
        } else {
          y += 2;
        }
      }
      doc.setFontSize(10.5);
      y += 2;
    }
  }


  // F. PROJECT INTRODUCTION
  checkPageBreak(25);
  doc.setFont(labelFont, 'bold');
  doc.text("Project Introduction:", margin, y);
  y += 5.5;
  doc.setFont(valueFont, 'normal');
  const descLines = doc.splitTextToSize(project.description || '—', contentWidth - 3);
  doc.text(descLines, margin + 3, y);
  y += (descLines.length * 5) + 6;

  // G. PROJECT TEAM MEMBERS
  checkPageBreak(25);
  doc.setFont(labelFont, 'bold');
  doc.text("Project Team Members:", margin, y);
  y += 5.5;
  doc.setFont(valueFont, 'normal');

  const members = project.team_members || [];
  if (members.length > 0) {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const memberDetails = [member.rollNumber, member.rbtNumber].filter(Boolean).join(' / ');
      const memberText = memberDetails ? `${member.name} (${memberDetails})` : (member.name || 'Student');
      checkPageBreak(6);
      doc.text(`${i + 1}) ${memberText}`, margin + 3, y);
      y += 5.5;
    }
  } else {
    // Graceful fallback for single-student or legacy records without team_members array
    const primaryName = project.students?.full_name || _studentProfile?.full_name;
    const primaryRoll = project.students?.roll_number || _studentProfile?.roll_number;
    if (primaryName) {
      const text = primaryRoll ? `${primaryName} (${primaryRoll})` : primaryName;
      doc.text(`1) ${text}`, margin + 3, y);
      y += 5.5;
    } else {
      doc.text("1) Not specified", margin + 3, y);
      y += 5.5;
    }
  }
  y += 5;

  // G. PROJECT ATTACHMENTS (Screenshots & Certificates)
  checkPageBreak(40);
  doc.setFont(labelFont, 'bold');
  const rawScreenshots = project.screenshot_urls || (project.document_url ? [project.document_url] : []);
  const resolvedUrls = await getSignedViewUrls(rawScreenshots);
  const screenshots = resolvedUrls.filter(Boolean);

  if (screenshots.length > 0) {
    const sLabel = `Project Screenshot${screenshots.length !== 1 ? 's' : ''}:`;
    doc.text(sLabel, margin, y);
    y += 6;

    const sPerRow = 2;
    const sWidth = (contentWidth - 10) / sPerRow;
    const sHeight = sWidth * 0.56; // 16:9 aspect ratio

    for (let i = 0; i < screenshots.length; i++) {
      if (y + sHeight > 280) {
        doc.addPage();
        y = 20;
      }

      const col = i % sPerRow;
      const rowX = margin + (col * (sWidth + 10));

      await addImageAsync(screenshots[i], rowX, y, sWidth, sHeight);

      if (col === sPerRow - 1 || i === screenshots.length - 1) {
        y += sHeight + 8;
      }
    }
  }

  // H. DEDICATED SIGNATURE SECTION
  const sigBlockHeight = 38;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  // Keep both signature blocks together at the end; add new page if needed
  if (y + sigBlockHeight > pageHeight - bottomMargin) {
    doc.addPage();
    y = 30;
  } else {
    y += 12;
  }

  const sigColWidth = 65;
  const leftSigX = margin;
  const rightSigX = pageWidth - margin - sigColWidth;
  const sigLineY = y + 18;

  // Signature divider lines
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.35);
  doc.line(leftSigX, sigLineY, leftSigX + sigColWidth, sigLineY);
  doc.line(rightSigX, sigLineY, rightSigX + sigColWidth, sigLineY);

  // Role labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("PBL Coordinator Signature", leftSigX, sigLineY + 5);
  doc.text("Team Leader Signature", rightSigX, sigLineY + 5);

  // Printable line labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Signature: __________________________", leftSigX, sigLineY + 10);
  doc.text("Signature: __________________________", rightSigX, sigLineY + 10);

  // SAVE FILE
  const safeTitle = (project.title || 'Project_Report').substring(0, 25).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `RSCOE_Report_${safeTitle}.pdf`;
  doc.save(fileName);
};

export const generatePDFReport = downloadReport;
