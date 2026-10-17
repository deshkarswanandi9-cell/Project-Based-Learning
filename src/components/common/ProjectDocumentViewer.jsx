import React from 'react';
import { X, Award, MapPin } from 'lucide-react';
import jspmLogo from '../../assets/jspm_logo.jpeg';
import rscoeLogo from '../../assets/rscoe_logo.png';
import { SDG_GOALS, PO_LIST, PSO_LIST, normalizePsos, resolvePsoDetails, getEffectivePsos, formatAcademicYearAndSemester } from '../../utils/constants';
import { getSdgLogo } from '../../utils/sdgLogos';
import { useSignedUrls } from '../../utils/storageUtils';

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


export default function ProjectDocumentViewer({ project, onClose }) {
  const rawScreenshots = project?.screenshot_urls || (project?.document_url ? [project.document_url] : []);
  const { urls: screenshots } = useSignedUrls(rawScreenshots);

  if (!project) return null;

  const members = project.team_members || [];
  const sdgGoals = (project.sdg_goals || []).map(Number).filter(n => n >= 1 && n <= 17);
  const pos = project.pos || [];
  const isDraft = Boolean(project.isDraft);
  const psos = normalizePsos(project.psos);
  const isPsoColumnMissing = !isDraft && project.psos === undefined;
  const effectivePsos = (psos.length > 0 || isPsoColumnMissing) ? psos : getEffectivePsos(project);
  const isAiMapped = !isDraft && !isPsoColumnMissing && psos.length === 0 && effectivePsos.length > 0;
  const isHackathon = project.type?.startsWith('Hackathon') || !!project.hackathon_title;
  const projectType = project.type === 'Complex Engineering'
    ? 'Complex Engineering Problems'
    : (project.type || 'PBL Project');

  const fieldLabel = (text) => (
    <span style={{
      fontWeight: '600',
      color: '#4B5563',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'block',
      marginBottom: '4px'
    }}>{text}</span>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-900/80 backdrop-blur-sm overflow-y-auto">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-gray-900 truncate max-w-sm">{project.title || 'Document Preview'}</h2>
            <p className="text-xs text-gray-500">Official Institutional Report Format</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2 items-center">
          {isDraft && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              Form Preview (Unsaved)
            </span>
          )}
          {project.semester && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
              {project.semester}
            </span>
          )}
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
            AY: {project.academic_year || 'Not Specified'}
          </span>
        </div>
      </div>

      {/* ── Document Container ── */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10">
        <div className="relative w-full max-w-4xl bg-white shadow-2xl ring-1 ring-gray-900/5">
          
          {/* Print Boundary / Page Container */}
          <div style={{
            fontFamily: '"Times New Roman", Times, serif',
            width: '100%',
            maxWidth: '210mm',
            margin: '0 auto',
            padding: '38px 58px',
            color: '#000',
            lineHeight: '1.5',
            backgroundColor: '#fff',
            border: '4px double #111'
          }}>

            {isDraft && (
              <div style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#1E40AF',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div>
                  <strong style={{ fontWeight: '600' }}>Form Preview (Unsaved):</strong> This preview reflects your current in-progress registration form selections and is not yet persisted to the database.
                </div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold', backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                  Draft Preview
                </span>
              </div>
            )}

            {/* ── EXACT INSTITUTION HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '25px' }}>
              <img src={jspmLogo} alt="JSPM Logo" style={{ height: '84px', width: 'auto', maxWidth: '100px', objectFit: 'contain' }} />
              <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.02em' }}>JSPM's</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '4px' }}>
                  Rajarshi Shahu College of Engineering, Tathawade Pune-33
                </div>
                <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>
                  (An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '6px' }}>
                  Department of Computer Engineering
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '4px', color: '#111' }}>
                  Academic Year: {project.academic_year || 'Not Specified'}
                </div>
              </div>
              <img src={rscoeLogo} alt="RSCOE Logo" style={{ height: '84px', width: 'auto', maxWidth: '100px', objectFit: 'contain' }} />
            </div>

            {/* ── TITLE ── */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                PROJECT DETAILS
              </span>
            </div>

            {/* ── FIELDS DATA ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: '"Inter", "Segoe UI", sans-serif', fontSize: '13.5px' }}>
              
              {/* Row 1: Title */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                {fieldLabel('Title of Project')}
                <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{project.title || '—'}</div>
              </div>

              {/* Row 2: Type, Domain & Faculty Mentor */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                <div>
                  {fieldLabel('Type of Project')}
                  <div style={{ fontWeight: '500', color: '#111827' }}>{projectType}</div>
                </div>
                {project.domain && (
                  <div>
                    {fieldLabel('Domain')}
                    <div style={{ fontWeight: '500', color: '#111827' }}>{project.domain}</div>
                  </div>
                )}
                <div>
                  {fieldLabel('Mentor Name')}
                  <div style={{ fontWeight: '600', color: '#111827' }}>{project.mentor_name || project.faculty_mentor_name || project.teachers?.full_name || 'Not Specified'}</div>
                </div>
                {project.semester && (
                  <div>
                    {fieldLabel('Semester')}
                    <div style={{ color: '#374151' }}>{formatAcademicYearAndSemester(project.academic_year, project.semester)}</div>
                  </div>
                )}
              </div>

              {/* Hackathon & Achievement Details Section */}
              {isHackathon && (
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#78350F', fontWeight: 'bold', fontSize: '13px' }}>
                    <Award style={{ width: '16px', height: '16px', color: '#8A3A3A' }} />
                    <span>Hackathon & Achievement Details</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      {fieldLabel('Project Type')}
                      <div style={{ fontWeight: '600', color: '#1E293B' }}>{projectType}</div>
                    </div>
                    {project.hackathon_title && (
                      <div>
                        {fieldLabel('Hackathon Title')}
                        <div style={{ fontWeight: '600', color: '#1E293B' }}>{project.hackathon_title}</div>
                      </div>
                    )}
                    {project.hackathon_position && (
                      <div>
                        {fieldLabel('Position Secured')}
                        <div style={{ fontWeight: '600', color: '#1E293B' }}>
                          {project.hackathon_position}
                        </div>
                      </div>
                    )}
                    {project.hackathon_award_type && (
                      <div>
                        {fieldLabel('Award / Recognition Type')}
                        <div style={{ fontWeight: '600', color: '#92400E' }}>
                          {project.hackathon_award_type}
                        </div>
                      </div>
                    )}
                    {project.location_mode && (
                      <div>
                        {fieldLabel('Location Mode')}
                        <div style={{ color: '#334155' }}>{project.location_mode}</div>
                      </div>
                    )}
                  </div>

                  {project.location_mode === 'Online / Virtual' ? (
                    project.venue_details && (
                      <div style={{ borderTop: '1px dashed #FCD34D', paddingTop: '8px', fontSize: '12px', color: '#475569' }}>
                        <span style={{ fontWeight: '600', color: '#92400E' }}>Online Platform / Details: </span>
                        <span>{project.venue_details}</span>
                      </div>
                    )
                  ) : (
                    (project.venue_details || project.city || project.state || project.pincode) && (
                      <div style={{ borderTop: '1px dashed #FCD34D', paddingTop: '8px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin style={{ width: '14px', height: '14px', color: '#92400E' }} />
                        <span style={{ fontWeight: '600', color: '#92400E' }}>Venue: </span>
                        <span>
                          {[project.venue_details, project.city, project.state, project.pincode ? `PIN: ${project.pincode}` : null].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )
                  )}

                  {project.achievement_title && (
                    <div style={{ borderTop: '1px solid #FCD34D', backgroundColor: '#FEF3C7', padding: '10px 12px', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 'bold', color: '#881337', fontSize: '12.5px', marginBottom: '2px' }}>
                        ★ Special Mention: {project.achievement_title}
                      </div>
                      {project.achievement_description && (
                        <p style={{ marginTop: '2px', color: '#334155', fontSize: '12px', lineHeight: '1.45' }}>
                          {project.achievement_description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section C: Mapping with POs (Each on a separate line) */}
              {pos.length > 0 && (
                <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827', marginBottom: '8px' }}>
                    Mapping with POs:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                    {pos.map(poId => {
                      const formatted = formatPoLine(poId);
                      const parts = formatted.split(': ');
                      const prefix = parts[0];
                      const title = parts.slice(1).join(': ');
                      return (
                        <div key={poId} style={{ fontSize: '13px', lineHeight: '1.4' }}>
                          <span style={{ fontWeight: 'bold', color: '#111827' }}>{prefix}: </span>
                          <span style={{ color: '#374151' }}>{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section D: SDG Goals Mapped (Each on a separate line with official logo) */}
              {sdgGoals.length > 0 && (
                <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827', marginBottom: '10px' }}>
                    SDG Goals Mapped:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
                    {sdgGoals.map(id => {
                      const goal = SDG_GOALS.find(g => g.id === id);
                      const logo = getSdgLogo(id);
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {logo && (
                            <img
                              src={logo}
                              alt={`SDG ${id}`}
                              style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }}
                            />
                          )}
                          <span style={{ fontSize: '13px', color: '#111827', lineHeight: '1.4' }}>
                            <span style={{ fontWeight: 'bold' }}>SDG {id} - </span>
                            <span style={{ color: '#374151' }}>{goal?.title || `SDG ${id}`}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section E: Programme Specific Outcomes (PSOs) Mapped */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Programme Specific Outcomes (PSOs) Mapped:</span>
                  {isDraft && (
                    <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '11px', fontWeight: '500', color: '#1E40AF', backgroundColor: '#DBEAFE', padding: '1px 6px', borderRadius: '4px' }}>
                      Form Preview (Unsaved)
                    </span>
                  )}
                  {isAiMapped && (
                    <span style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '11px', fontWeight: '500', color: '#6B21A8', backgroundColor: '#F3E8FF', padding: '1px 6px', borderRadius: '4px' }}>
                      AI Mapped
                    </span>
                  )}
                </div>
                {isPsoColumnMissing ? (
                  <div style={{ color: '#B45309', fontSize: '12px', fontStyle: 'italic', backgroundColor: '#FEF3C7', padding: '8px 12px', borderRadius: '4px', border: '1px solid #FCD34D' }}>
                    Notice: PSO mapping is pending database column migration (supabase_add_psos_column.sql).
                  </div>
                ) : effectivePsos.length === 0 ? (
                  <div style={{ color: '#6B7280', fontSize: '12.5px', fontStyle: 'italic', paddingLeft: '4px' }}>
                    No Programme Specific Outcomes selected.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '4px' }}>
                    {effectivePsos.map(psoEntry => {
                      const details = resolvePsoDetails(psoEntry);
                      if (!details) return null;
                      return (
                        <div key={details.id} style={{ fontSize: '13px', lineHeight: '1.4' }}>
                          <div style={{ fontWeight: 'bold', color: '#111827' }}>
                            {details.id}: {details.title}
                          </div>
                          {details.desc && (
                            <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '3px', lineHeight: '1.5', paddingLeft: '8px', margin: '3px 0 0 0' }}>
                              {details.desc}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section F: Project Introduction */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827', marginBottom: '6px' }}>
                  Project Introduction:
                </div>
                <div style={{ color: '#374151', whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '12.5px', paddingLeft: '4px' }}>
                  {project.description || '—'}
                </div>
              </div>

              {/* Section G: Project Team Members */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827', marginBottom: '8px' }}>
                  Project Team Members:
                </div>
                <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '50px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>Sr.</th>
                      <th style={{ padding: '8px 12px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>Name of Student</th>
                      <th style={{ padding: '8px 12px', width: '150px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>Roll Number</th>
                      <th style={{ padding: '8px 12px', width: '150px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>RBT Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '8px 12px', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>{i + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: '500', color: '#1F2937', border: '1px solid #E5E7EB' }}>{m.name || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#4B5563', border: '1px solid #E5E7EB' }}>{m.rollNumber || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#4B5563', border: '1px solid #E5E7EB' }}>{m.rbtNumber || '—'}</td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td style={{ padding: '8px 12px', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>1</td>
                        <td style={{ padding: '8px 12px', fontWeight: '500', color: '#1F2937', border: '1px solid #E5E7EB' }}>{project.students?.full_name || 'Primary Student'}</td>
                        <td style={{ padding: '8px 12px', color: '#4B5563', border: '1px solid #E5E7EB' }}>{project.students?.roll_number || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#4B5563', border: '1px solid #E5E7EB' }}>—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section G: Project Attachments */}
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827', marginBottom: '8px' }}>
                  Project Screenshots:
                </div>
                {screenshots.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '10px' }}>
                    {screenshots.map((url, i) => (
                      <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#F9FAFB' }}>
                        <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px 10px', fontSize: '11px', color: '#6B7280', textAlign: 'center' }}>Figure {i + 1}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '6px', color: '#9CA3AF', fontSize: '12px', marginTop: '6px' }}>
                    No screenshots attached
                  </div>
                )}
              </div>

              {/* Section H: Signature (Keep only PBL Coordinator Signature) */}
              <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                  {/* PBL Coordinator Signature */}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ height: '48px' }}></div>
                    <div style={{ borderBottom: '1px solid #111827', marginBottom: '8px', width: '220px' }}></div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>
                      PBL Coordinator Signature
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px' }}>
                      Signature: __________________________
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
