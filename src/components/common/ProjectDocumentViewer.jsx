import React from 'react';
import { X, Loader2 } from 'lucide-react';
import jspmLogo from '../../assets/jspm_logo.jpeg';
import rscoeLogo from '../../assets/rscoe_logo.png';
import { SDG_GOALS } from '../../utils/constants';
import { useSignedUrls } from '../../utils/storageUtils';

export default function ProjectDocumentViewer({ project, onClose }) {
  const rawScreenshots = project?.screenshot_urls || (project?.document_url ? [project.document_url] : []);
  const { urls: screenshots, loading: screenshotsLoading } = useSignedUrls(rawScreenshots);

  if (!project) return null;

  const members = project.team_members || [];
  const sdgGoals = project.sdg_goals || [];
  const pos = project.pos || [];

  const sdgLabel = sdgGoals
    .map(id => {
      const goal = SDG_GOALS.find(g => g.id === parseInt(id));
      return goal ? `SDG ${goal.id} - ${goal.title}` : `SDG ${id}`;
    })
    .join(', ');

  const posLabel = pos.join(', ');

  const fieldLabel = (text) => (
    <span style={{
      fontWeight: '600',
      color: '#4B5563', // gray-600
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
            <p className="text-xs text-gray-500">Official Report Format</p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
           {project.semester && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                {project.semester}
              </span>
            )}
            {project.academic_year && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                AY: {project.academic_year}
              </span>
            )}
        </div>
      </div>

      {/* ── Document Container ── */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10">
        <div className="relative w-full max-w-4xl bg-white shadow-2xl ring-1 ring-gray-900/5">
          
          {/* Print Boundary / Page Container */}
          <div style={{
            fontFamily: '"Times New Roman", Times, serif',
            width: '100%',
            maxWidth: '210mm', // A4 width approach
            margin: '0 auto',
            padding: '38px 58px', // Slightly reduced padding to account for thick border
            color: '#000',
            lineHeight: '1.5',
            backgroundColor: '#fff',
            border: '4px double #111' // Formal double border
          }}>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '30px' }}>
              <img src={jspmLogo} alt="JSPM Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.02em' }}>JSPM's</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '4px' }}>
                  Rajarshi Shahu College of Engineering, Tathwade Pune-33
                </div>
                <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>
                  (An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
                  Department of Computer Engineering — Project Based Learning
                </div>
              </div>
              <img src={rscoeLogo} alt="RSCOE Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
            </div>

            {/* ── TITLE ── */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                PROJECT DETAILS
              </span>
            </div>

            {/* ── FIELDS DATA ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: '"Inter", "Segoe UI", sans-serif', fontSize: '14px' }}>
              
              {/* Row 1: Title */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                {fieldLabel('Title of Project')}
                <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{project.title || '—'}</div>
              </div>

              {/* Row 2: Type & Domain */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                <div>
                  {fieldLabel('Type of Project')}
                  <div style={{ fontWeight: '500', color: '#111827' }}>{project.type || '—'}</div>
                </div>
                <div>
                  {fieldLabel('Domain')}
                  <div style={{ fontWeight: '500', color: '#111827' }}>{project.domain || '—'}</div>
                </div>
              </div>

              {/* Row 3: Outcomes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                <div>
                  {fieldLabel('Programme Outcomes (POs)')}
                  <div style={{ color: '#374151' }}>{posLabel || 'None Mapped'}</div>
                </div>
                <div>
                  {fieldLabel('SDG Goals Mapped')}
                  <div style={{ color: '#374151' }}>{sdgLabel || 'None Mapped'}</div>
                </div>
              </div>

              {/* Row 4: Coordinator */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
                {fieldLabel('PBL Coordinator')}
                <div style={{ fontWeight: '500', color: '#111827' }}>{project.mentor_name || '—'}</div>
              </div>

              {/* Row 5: Team Members */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                {fieldLabel('Project Team Members')}
                <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '50px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>Sr.</th>
                      <th style={{ padding: '8px 12px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>Name of Student</th>
                      <th style={{ padding: '8px 12px', width: '150px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>Roll Number</th>
                      <th style={{ padding: '8px 12px', width: '150px', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', border: '1px solid #E5E7EB' }}>RBT Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3].map(i => {
                      const m = members[i];
                      return (
                        <tr key={i}>
                          <td style={{ padding: '10px 12px', border: '1px solid #E5E7EB', textAlign: 'center', color: '#374151', fontSize: '13px' }}>{i + 1}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #E5E7EB', color: '#111827', fontWeight: '500', fontSize: '13px' }}>{m?.name || '—'}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #E5E7EB', color: '#4B5563', fontSize: '13px' }}>{m?.rollNumber || '—'}</td>
                          <td style={{ padding: '10px 12px', border: '1px solid #E5E7EB', color: '#4B5563', fontSize: '13px' }}>{m?.rbtNumber || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Row 6: Description */}
              <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                {fieldLabel('Project Introduction / Overview')}
                <p style={{ marginTop: '4px', textAlign: 'justify', lineHeight: '1.6', color: '#374151', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '4px', border: '1px solid #F3F4F6' }}>
                  {project.description || '—'}
                </p>
              </div>

              {/* Row 7: Screenshots */}
              <div>
                {fieldLabel('Project Screenshots')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '12px' }}>
                  {screenshotsLoading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6B7280' }}>
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      <span style={{ fontSize: '12px', fontStyle: 'italic' }}>Loading secure attachment preview...</span>
                    </div>
                  ) : screenshots.length > 0 ? (
                    screenshots.map((url, idx) => (
                      <div key={idx} style={{ padding: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FCFCFD', borderRadius: '6px' }}>
                        <img
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px', border: '1px solid #F3F4F6' }}
                        />
                        <div style={{ textAlign: 'center', fontSize: '11px', color: '#6B7280', marginTop: '8px', fontWeight: '500' }}>
                          Figure {idx + 1}: Screenshot {idx + 1}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', backgroundColor: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '4px', color: '#6B7280', fontStyle: 'italic', fontSize: '13px' }}>
                      {rawScreenshots.length > 0 ? 'Unable to load private screenshots. Please ensure you are authorized.' : 'No project screenshots available.'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
