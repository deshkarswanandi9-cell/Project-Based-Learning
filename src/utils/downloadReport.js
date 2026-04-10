import jsPDF from 'jspdf';
import jspmLogo from '../assets/jspm_logo.jpeg';
import rscoeLogo from '../assets/rscoe_logo.png';

/**
 * Generates a PDF report for a project in the specific layout requested.
 * Matches the JSPM's RSCOE Project Details Form format.
 */
export const downloadReport = async (project, studentProfile) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 15;

  // Function to add image and wait for it
  const addImageAsync = (src, x, y, w, h) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        doc.addImage(img, 'JPEG', x, y, w, h);
        resolve();
      };
      img.onerror = () => resolve(); // Skip if fails
    });
  };

  // 1. ADD LOGOS
  await Promise.all([
    addImageAsync(jspmLogo, 15, 10, 25, 18),
    addImageAsync(rscoeLogo, pageWidth - 40, 10, 25, 18)
  ]);

  // 2. HEADER TEXT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("JSPM's", pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text("Rajarshi Shahu College of Engineering, Tathwade Pune-33", pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(10);
  doc.text("(An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)", pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(11);
  doc.text("Department of Computer Engineering", pageWidth / 2, y, { align: 'center' });
  y += 12;

  // 3. TITLE
  doc.setFontSize(14);
  doc.text("Project Details", pageWidth / 2, y, { align: 'center' });
  
  // Underline title
  const titleWidth = doc.getTextWidth("Project Details");
  doc.line((pageWidth / 2) - (titleWidth / 2), y + 1.5, (pageWidth / 2) + (titleWidth / 2), y + 1.5);
  y += 15;

  // 4. FIELDS
  doc.setFontSize(11);
  const labelFont = 'helvetica';
  const valueFont = 'helvetica';

  const addField = (label, value, isBoldLabel = true, spacing = 10) => {
    doc.setFont(labelFont, isBoldLabel ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(`${label} ${value || ''}`, contentWidth);
    
    // If it's just the label we're bolding
    if (isBoldLabel && value) {
      doc.text(label, margin, y);
      doc.setFont(valueFont, 'normal');
      doc.text(value, margin + doc.getTextWidth(label) + 1, y, { maxWidth: contentWidth - doc.getTextWidth(label) });
    } else {
      doc.text(lines, margin, y);
    }
    
    y += (lines.length * 6) + spacing - 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Title of the Project
  addField("Title of the Project:", project.title);
  y += 2;

  // Type of Project
  const typesText = "Mobile App/ Website/ Mini Project/ Industry Sponsored Project/ IoT/ Hackathon/ Any Other -";
  doc.setFont(labelFont, 'bold');
  doc.text("Type of Project:", margin, y);
  doc.setFont(valueFont, 'normal');
  doc.text(typesText, margin + doc.getTextWidth("Type of Project: "), y);
  
  // Highlight the selected type if possible (underline or bold)
  const selectedType = project.type || '';
  // Simple heuristic to find and highlight
  if (selectedType) {
    // This is hard to precisely align without measuring every word, 
    // but we can at least show the selection below or next to it.
    y += 6;
    doc.setFont(valueFont, 'italic');
    doc.text(`(Selected: ${selectedType})`, margin + 35, y);
  }
  y += 10;

  // Mapping with POs
  const pos = (project.pos || []).join(', ');
  addField("Mapping with POs:", pos);

  // SDG Goals Mapped
  const sdgs = (project.sdg_goals || []).join(', ');
  addField("SDG Goals Mapped:", sdgs);

  // PBL Coordinator Name
  addField("PBL Coordinator Name:", project.mentor_name);

  // Project Team Members
  doc.setFont(labelFont, 'bold');
  doc.text("Project Team Members:", margin, y);
  y += 7;
  doc.setFont(valueFont, 'normal');
  const members = project.team_members || [];
  // Ensure we show 1 to 4 slots as per screenshot
  for (let i = 0; i < 4; i++) {
    const member = members[i];
    const memberText = member ? `${member.name} (${member.rollNumber})` : "";
    doc.text(`${i + 1}) ${memberText}`, margin + 2, y);
    y += 6;
  }
  y += 8;

  // Project Introduction
  doc.setFont(labelFont, 'bold');
  const introLabel = "Project Introduction (Describe the system overview, include functionality provided):";
  const introLines = doc.splitTextToSize(introLabel, contentWidth);
  doc.text(introLines, margin, y);
  y += (introLines.length * 6) + 2;
  
  doc.setFont(valueFont, 'normal');
  const descLines = doc.splitTextToSize(project.description || '', contentWidth);
  doc.text(descLines, margin + 2, y);
  y += (descLines.length * 6) + 15;

  if (y > 250) { doc.addPage(); y = 20; }

  // Project Screenshots (GRID Layout)
  doc.setFont(labelFont, 'bold');
  const screenshots = project.screenshot_urls || (project.document_url ? [project.document_url] : []);
  const sLabel = `Project Screenshot${screenshots.length !== 1 ? 's' : ''}:`;
  doc.text(sLabel, margin, y);
  y += 6;

  if (screenshots.length > 0) {
    const sPerRow = 2; // grid columns
    const sWidth = (contentWidth - 10) / sPerRow; // spacing adjustment
    const sHeight = sWidth * 0.56; // 16:9 aspect ratio roughly
    
    for (let i = 0; i < screenshots.length; i++) {
      // Check for page break BEFORE adding screenshot
      if (y + sHeight > 280) {
        doc.addPage();
        y = 20;
      }

      const col = i % sPerRow;
      const rowX = margin + (col * (sWidth + 10));
      
      await addImageAsync(screenshots[i], rowX, y, sWidth, sHeight);
      
      // If we finished a row, OR it was the last screenshot, increment Y
      if (col === sPerRow - 1 || i === screenshots.length - 1) {
        y += sHeight + 10;
      }
    }
  } else {
    // Placeholder box if no screenshot
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, y, contentWidth, 40);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("No screenshots provided", pageWidth / 2, y + 20, { align: 'center' });
    y += 50;
  }

  // SAVE
  const fileName = `ProjectReport_${(project.title || 'Report').substring(0, 20).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

// Also export as generatePDFReport to fix broken imports elsewhere
export const generatePDFReport = downloadReport;
