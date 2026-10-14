import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getTeacherProjects, approveProject, rejectProject } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { downloadReport } from '../../utils/downloadReport';
import { PROJECT_DOMAINS, YEARS, SDG_GOALS, PO_LIST, PSO_LIST, normalizePsos } from '../../utils/constants';
import ProjectDocumentViewer from '../../components/common/ProjectDocumentViewer';
import { ProjectScreenshotsGallery, ProjectCertificateLink } from '../../components/common/ProjectAttachments';
import { Eye, Check, X, Download, XCircle, FileText, Award } from 'lucide-react';

export default function ProjectMonitoring() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({ search: '', domain: 'All', status: 'All', year: 'All' });
  const [sortConfig, setSortConfig] = useState(null);

  // Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const fetchProjects = async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    try {
      const data = await getTeacherProjects(profile.user_id);
      setProjects(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [profile]);

  // Client-side filtering & sorting
  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => {
      const sf = filters.search.toLowerCase();
      const matchSearch = p.students?.full_name?.toLowerCase().includes(sf) ||
        p.title?.toLowerCase().includes(sf) ||
        p.faculty_mentor_name?.toLowerCase().includes(sf);
      const matchDomain = filters.domain === 'All' || p.domain === filters.domain;
      const matchStatus = filters.status === 'All' || p.status === filters.status;
      const matchYear   = filters.year === 'All' || p.students?.year === filters.year;
      return matchSearch && matchDomain && matchStatus && matchYear;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let vA, vB;
        if (sortConfig.key === 'student') { vA = a.students?.full_name; vB = b.students?.full_name; }
        else if (sortConfig.key === 'title') { vA = a.title; vB = b.title; }
        else if (sortConfig.key === 'date') { vA = new Date(a.created_at); vB = new Date(b.created_at); }
        else { vA = a[sortConfig.key]; vB = b[sortConfig.key]; }

        if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [projects, filters, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleApprove = async (id) => {
    if (!profile?.is_approved) {
      toast.error('Your faculty account is pending administrator approval. Evaluation actions are disabled.');
      return;
    }
    try {
      await approveProject(id, remarks);
      toast.success('Project Approved successfully');
      setShowModal(false);
      setRemarks('');
      await fetchProjects();
    } catch (e) {
      toast.error(e.message || 'Failed to approve project');
    }
  };

  const handleReject = async (id) => {
    if (!profile?.is_approved) {
      toast.error('Your faculty account is pending administrator approval. Evaluation actions are disabled.');
      return;
    }
    if (!remarks.trim()) {
      toast.error('Remarks are required when rejecting a project.');
      return;
    }
    try {
      await rejectProject(id, remarks);
      toast.success('Project Rejected with feedback');
      setShowModal(false);
      setRemarks('');
      await fetchProjects();
    } catch (e) {
      toast.error(e.message || 'Failed to reject project');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* FILTER BAR */}
      <div className="bg-white p-3.5 sm:p-4 rounded-md shadow-2xs border border-gray-200/90 mb-5 sticky top-12 z-10 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Search</label>
          <input value={filters.search} onChange={e=>setFilters({...filters, search:e.target.value})} placeholder="Search student name or title..." className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon"/>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Domain</label>
          <select value={filters.domain} onChange={e=>setFilters({...filters, domain:e.target.value})} className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-md outline-none bg-white focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon">
            <option value="All">All Domains</option>
            {PROJECT_DOMAINS.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Status</label>
          <select value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})} className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-md outline-none bg-white focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Year</label>
          <select value={filters.year} onChange={e=>setFilters({...filters, year:e.target.value})} className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded-md outline-none bg-white focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon">
            <option value="All">All Years</option>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center pb-0.5">
          <button onClick={()=>setFilters({search:'',domain:'All',status:'All',year:'All'})} className="px-3 py-1.5 text-xs text-gray-600 font-medium hover:bg-gray-100 rounded-md transition">Clear</button>
        </div>
        <div className="w-full pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>Manage, review, and evaluate student submissions</span>
          <span className="font-medium text-gray-700">Showing {filteredProjects.length} of {projects.length} submissions</span>
        </div>
      </div>

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={()=>handleSort('student')}>Student</th>
                <th className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={()=>handleSort('title')}>Title</th>
                <th className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={()=>handleSort('domain')}>Domain</th>
                <th className="px-3 py-2.5">SDGs</th>
                <th className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={()=>handleSort('status')}>Status</th>
                <th className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition" onClick={()=>handleSort('date')}>Date</th>
                <th className="px-3 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-gray-900">{p.students?.full_name}</div>
                    <div className="text-[11px] text-gray-500">{p.students?.roll_number}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-800 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.domain}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex -space-x-1">
                      {(p.sdg_goals||[]).slice(0,3).map(sdg=>{
                        const clr = SDG_GOALS.find(g=>g.id===sdg)?.color || '#ccc';
                        return <div key={sdg} className="w-4.5 h-4.5 rounded-full border border-white shadow-2xs" style={{backgroundColor:clr}} title={'SDG '+sdg}></div>
                      })}
                      {(p.sdg_goals?.length>3) && <div className="w-4.5 h-4.5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[9px] font-bold text-gray-600">+{p.sdg_goals.length-3}</div>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${p.status==='Approved'?'bg-emerald-50 text-emerald-800 border border-emerald-200':p.status==='Pending'?'bg-amber-50 text-amber-800 border border-amber-200':'bg-red-50 text-red-800 border border-red-200'}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={()=>{setSelectedProject(p); setShowModal(true); setRemarks(p.remarks||'');}} className="p-1.5 text-brand-maroon bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition" title="View Details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={async ()=> await downloadReport(p, p.students)} className="p-1.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition" title="Download Report">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-xs">No projects found matching the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROJECT DETAIL MODAL */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-md w-full max-w-3xl shadow-xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-gray-200">
            
            {/* Header */}
            <div className="p-4 px-5 text-white flex justify-between items-start bg-brand-maroon relative">
              <div>
                <h2 className="text-base font-semibold pr-8">{selectedProject.title}</h2>
                <div className="flex gap-2 mt-1.5">
                  <span className="px-2 py-0.5 bg-white/20 rounded-md text-[11px] font-medium">
                    {selectedProject.type === 'Complex Engineering' ? 'Complex Engineering Problems' : selectedProject.type}
                  </span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-md text-[11px] font-medium uppercase tracking-wider">{selectedProject.status}</span>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} className="text-white/70 hover:text-white p-1 absolute top-3.5 right-4"><XCircle className="w-5 h-5"/></button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto bg-gray-50 flex-1 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                <div><span className="block text-[11px] uppercase font-medium text-gray-500 mb-0.5">Student</span><span className="font-semibold text-gray-900 text-sm">{selectedProject.students?.full_name}</span></div>
                <div><span className="block text-[11px] uppercase font-medium text-gray-500 mb-0.5">Roll / Year / Dept</span><span className="font-medium text-gray-800 text-xs">{selectedProject.students?.roll_number} · {selectedProject.students?.year} · {selectedProject.students?.department}</span></div>
                <div><span className="block text-[11px] uppercase font-medium text-gray-500 mb-0.5">Domain</span><span className="font-medium text-gray-800 text-xs">{selectedProject.domain}</span></div>
                <div><span className="block text-[11px] uppercase font-medium text-gray-500 mb-0.5">Faculty Mentor</span><span className="font-semibold text-gray-900 text-xs">{selectedProject.faculty_mentor_name || 'Not Specified'}</span></div>
                <div className="md:col-span-2"><span className="block text-[11px] uppercase font-medium text-gray-500 mb-0.5">Technologies</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(selectedProject.technologies||[]).map(t=><span key={t} className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded-md text-[11px] font-medium border border-gray-200">{t}</span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs overflow-hidden">
                <span className="block text-[11px] uppercase font-medium text-gray-500 mb-1.5">Description</span>
                <p className="text-gray-700 text-xs leading-relaxed break-words whitespace-pre-wrap">{selectedProject.description}</p>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                <span className="block text-[11px] uppercase font-medium text-gray-500 mb-2">SDG Goals Addressed</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedProject.sdg_goals||[]).map(s=>{
                    const goal = SDG_GOALS.find(x=>x.id===parseInt(s));
                    if(!goal) return null;
                    return <div key={goal.id} className="flex px-2 py-0.5 rounded-md text-white text-[11px] font-medium shadow-2xs" style={{backgroundColor:goal.color}}><span className="mr-1 font-bold">{goal.id}</span>{goal.title}</div>
                  })}
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                <span className="block text-[11px] uppercase font-medium text-gray-500 mb-2">Programme Outcomes (POs)</span>
                <div className="flex flex-wrap gap-1">
                  {PO_LIST.map(po => {
                    const isMapped = selectedProject.pos?.includes(po.id);
                    return (
                      <span key={po.id} title={po.title} className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${isMapped ? 'bg-brand-maroon text-white border-brand-maroon' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        {po.id}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-[11px] uppercase font-medium text-gray-500">Programme Specific Outcomes (PSOs)</span>
                  {selectedProject.psos === undefined && (
                    <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Migration Pending
                    </span>
                  )}
                </div>
                {selectedProject.psos === undefined ? (
                  <p className="text-xs text-amber-800 italic">Database column 'psos' not found. Pending execution of supabase_add_psos_column.sql</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {PSO_LIST.map(pso => {
                      const isMapped = normalizePsos(selectedProject.psos).includes(pso.id);
                      return (
                        <span key={pso.id} title={`${pso.id}: ${pso.title}`} className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${isMapped ? 'bg-brand-maroon text-white border-brand-maroon' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          {pso.id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hackathon & Achievement Details when applicable */}
              {(selectedProject.type?.startsWith('Hackathon') || selectedProject.hackathon_title) && (
                <div className="bg-amber-50/80 p-4 rounded-md border border-amber-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wide">
                    <Award className="w-3.5 h-3.5 text-brand-maroon" />
                    <span>Hackathon & Achievement Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-500">Project Type: </span>
                      <span className="font-semibold text-gray-900">{selectedProject.type}</span>
                    </div>
                    {selectedProject.hackathon_title && (
                      <div>
                        <span className="font-medium text-gray-500">Hackathon Title: </span>
                        <span className="font-semibold text-gray-900">{selectedProject.hackathon_title}</span>
                      </div>
                    )}
                    {selectedProject.hackathon_position && (
                      <div>
                        <span className="font-medium text-gray-500">Position Secured: </span>
                        <span className="font-semibold text-gray-900">{selectedProject.hackathon_position}</span>
                      </div>
                    )}
                    {selectedProject.hackathon_award_type && (
                      <div>
                        <span className="font-medium text-gray-500">Award / Recognition: </span>
                        <span className="font-semibold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">{selectedProject.hackathon_award_type}</span>
                      </div>
                    )}
                    {selectedProject.location_mode && (
                      <div>
                        <span className="font-medium text-gray-500">Location Mode: </span>
                        <span className="text-gray-800">{selectedProject.location_mode}</span>
                      </div>
                    )}
                    {selectedProject.location_mode === 'Online / Virtual' ? (
                      selectedProject.venue_details && (
                        <div className="sm:col-span-2">
                          <span className="font-medium text-gray-500">Online Platform / Details: </span>
                          <span className="text-gray-800">{selectedProject.venue_details}</span>
                        </div>
                      )
                    ) : (
                      (selectedProject.venue_details || selectedProject.city || selectedProject.state || selectedProject.pincode) && (
                        <div className="sm:col-span-2">
                          <span className="font-medium text-gray-500">Venue Details: </span>
                          <span className="text-gray-800">{[selectedProject.venue_details, selectedProject.city, selectedProject.state, selectedProject.pincode ? `PIN: ${selectedProject.pincode}` : null].filter(Boolean).join(', ')}</span>
                        </div>
                      )
                    )}
                  </div>
                  {selectedProject.achievement_title && (
                    <div className="pt-2 mt-1 border-t border-amber-300/80 bg-amber-100/70 p-3 rounded-md border border-amber-300">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>Special Mention Highlight: {selectedProject.achievement_title}</span>
                      </div>
                      {selectedProject.achievement_description && (
                        <p className="text-gray-800 text-xs leading-relaxed font-normal">{selectedProject.achievement_description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedProject.screenshot_urls && selectedProject.screenshot_urls.length > 0 && (
                <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                  <ProjectScreenshotsGallery rawUrls={selectedProject.screenshot_urls} colsClass="grid-cols-2 sm:grid-cols-4" />
                </div>
              )}

              <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="block text-[11px] uppercase font-medium text-gray-500">Official Document</span>
                  <button onClick={async ()=> await downloadReport(selectedProject, selectedProject.students)} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200 transition">Download Auto-PDF</button>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowDocumentViewer(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-maroon hover:bg-[#6e2e2e] text-white text-xs font-medium rounded-md transition shadow-2xs w-fit"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Auto-Generated Report
                  </button>
                  {selectedProject.document_url && (
                    <ProjectCertificateLink rawUrl={selectedProject.document_url} type={selectedProject.type} />
                  )}
                </div>
              </div>

              {(selectedProject.status !== 'Pending' || selectedProject.status === 'Pending') && (
                <div className="bg-white p-4 rounded-md border border-gray-200/90 shadow-2xs">
                  <span className="block text-[11px] uppercase font-medium text-gray-500 mb-1.5">{selectedProject.status === 'Pending' ? 'Actions & Remarks' : 'PBL Coordinator Remarks'}</span>
                  <textarea
                    readOnly={selectedProject.status !== 'Pending'}
                    value={remarks}
                    onChange={e=>setRemarks(e.target.value)}
                    placeholder="Enter remarks/feedback here..."
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-xs max-h-28 ${selectedProject.status !== 'Pending'?'bg-gray-50 text-gray-600 outline-none':'focus:ring-1 focus:ring-brand-maroon outline-none'}`}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedProject.status === 'Pending' && (
              <div className="p-3.5 px-5 border-t border-gray-200 bg-white flex justify-end gap-2.5 rounded-b-md">
                <button onClick={()=>handleReject(selectedProject.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium text-xs rounded-md transition flex items-center">
                  <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                </button>
                <button onClick={()=>handleApprove(selectedProject.id)} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-md shadow-2xs transition flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* PROJECT DOCUMENT VIEWER */}
      {showDocumentViewer && selectedProject && (
        <ProjectDocumentViewer
          project={selectedProject}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}

    </DashboardLayout>
  );
}
