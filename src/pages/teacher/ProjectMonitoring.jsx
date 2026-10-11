import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherProjects, approveProject, rejectProject } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { downloadReport } from '../../utils/downloadReport';
import { PROJECT_DOMAINS, YEARS, SDG_GOALS, PO_LIST } from '../../utils/constants';
import ProjectDocumentViewer from '../../components/common/ProjectDocumentViewer';
import toast from 'react-hot-toast';
import { Eye, Check, X, Download, XCircle, FileText } from 'lucide-react';

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
      setProjects(data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [profile]);

  // Client-side filtering & sorting
  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => {
      const sf = filters.search.toLowerCase();
      const matchSearch = p.students?.full_name.toLowerCase().includes(sf) || p.title.toLowerCase().includes(sf);
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
    try {
      await approveProject(id, remarks);
      toast.success('Project Approved');
      setShowModal(false); setRemarks('');
      await fetchProjects();
    } catch(e) { toast.error(e.message); }
  };

  const handleReject = async (id) => {
    if(!remarks.trim()) { toast.error("Remarks required for rejection"); return; }
    try {
      await rejectProject(id, remarks);
      toast.success('Project Rejected');
      setShowModal(false); setRemarks('');
      await fetchProjects();
    } catch(e) { toast.error(e.message); }
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 sticky top-16 z-10 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Search</label>
          <input value={filters.search} onChange={e=>setFilters({...filters, search:e.target.value})} placeholder="Name or Title..." className="w-full text-sm px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Domain</label>
          <select value={filters.domain} onChange={e=>setFilters({...filters, domain:e.target.value})} className="w-full text-sm px-3 py-2 border rounded-lg outline-none bg-white">
            <option value="All">All Domains</option>
            {PROJECT_DOMAINS.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label>
          <select value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})} className="w-full text-sm px-3 py-2 border rounded-lg outline-none bg-white">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Year</label>
          <select value={filters.year} onChange={e=>setFilters({...filters, year:e.target.value})} className="w-full text-sm px-3 py-2 border rounded-lg outline-none bg-white">
            <option value="All">All Years</option>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center pb-1">
          <button onClick={()=>setFilters({search:'',domain:'All',status:'All',year:'All'})} className="px-4 py-2 text-sm text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">Clear Filters</button>
        </div>
        <div className="w-full pt-2 mt-2 border-t border-gray-100 flex justify-end">
          <span className="text-sm font-semibold text-gray-600">Showing {filteredProjects.length} of {projects.length} projects</span>
        </div>
      </div>

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={()=>handleSort('student')}>Student</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={()=>handleSort('title')}>Title</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={()=>handleSort('domain')}>Domain</th>
                <th className="px-4 py-3">SDGs</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={()=>handleSort('status')}>Status</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={()=>handleSort('date')}>Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{p.students?.full_name}</div>
                    <div className="text-xs text-gray-500">{p.students?.roll_number}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-gray-600">{p.domain}</td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-1">
                      {(p.sdg_goals||[]).slice(0,3).map(sdg=>{
                        const clr = SDG_GOALS.find(g=>g.id===sdg)?.color || '#ccc';
                        return <div key={sdg} className="w-5 h-5 rounded-full border border-white" style={{backgroundColor:clr}} title={'SDG '+sdg}></div>
                      })}
                      {(p.sdg_goals?.length>3) && <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[10px] font-bold text-gray-600">+{p.sdg_goals.length-3}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${p.status==='Approved'?'bg-green-100 text-green-800':p.status==='Pending'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-800'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={()=>{setSelectedProject(p); setShowModal(true); setRemarks(p.remarks||'');}} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={async ()=> await downloadReport(p, p.students)} className="p-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No projects found matching the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROJECT DETAIL MODAL */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className={`p-6 text-white flex justify-between items-start ${selectedProject.status==='Approved'?'bg-green-700':selectedProject.status==='Rejected'?'bg-red-700':'bg-slate-800'}`}>
              <div>
                <h2 className="text-2xl font-bold pr-8">{selectedProject.title}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-sm font-bold">{selectedProject.type}</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded text-sm font-bold uppercase tracking-wider">{selectedProject.status}</span>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} className="text-white/70 hover:text-white p-1 absolute top-4 right-4"><XCircle className="w-7 h-7"/></button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border shadow-sm">
                <div><span className="block text-xs uppercase font-bold text-gray-500 mb-1">Student</span><span className="font-bold text-gray-900 text-lg">{selectedProject.students?.full_name}</span></div>
                <div><span className="block text-xs uppercase font-bold text-gray-500 mb-1">Roll / Year / Dept</span><span className="font-bold text-gray-900">{selectedProject.students?.roll_number} | {selectedProject.students?.year} | {selectedProject.students?.department}</span></div>
                <div><span className="block text-xs uppercase font-bold text-gray-500 mb-1">Domain</span><span className="font-bold text-gray-900">{selectedProject.domain}</span></div>
                <div><span className="block text-xs uppercase font-bold text-gray-500 mb-1">Technologies</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedProject.technologies||[]).map(t=><span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">{t}</span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border shadow-sm overflow-hidden">
                <span className="block text-xs uppercase font-bold text-gray-500 mb-2">Description</span>
                <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-wrap">{selectedProject.description}</p>
              </div>

              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <span className="block text-xs uppercase font-bold text-gray-500 mb-3">SDG Goals Addressed</span>
                <div className="flex flex-wrap gap-2">
                  {(selectedProject.sdg_goals||[]).map(s=>{
                    const goal = SDG_GOALS.find(x=>x.id===parseInt(s));
                    if(!goal) return null;
                    return <div key={goal.id} className="flex px-2 py-1 rounded text-white text-xs font-bold shadow-sm" style={{backgroundColor:goal.color}}><span className="mr-1.5">{goal.id}</span>{goal.title}</div>
                  })}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <span className="block text-xs uppercase font-bold text-gray-500 mb-2">Programme Outcomes (POs)</span>
                <div className="flex flex-wrap gap-1.5">
                  {PO_LIST.map(po => {
                    const isMapped = selectedProject.pos?.includes(po.id);
                    return (
                      <span key={po.id} title={po.title} className={`px-2 py-0.5 text-[10px] font-bold rounded border ${isMapped ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        {po.id}
                      </span>
                    );
                  })}
                </div>
              </div>

              {selectedProject.screenshot_urls && selectedProject.screenshot_urls.length > 0 && (
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <span className="block text-xs uppercase font-bold text-gray-500 mb-3">Project Screenshots</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedProject.screenshot_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-gray-100 aspect-video group relative">
                        <img src={url} alt="Screenshot" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-white font-bold">View</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="block text-xs uppercase font-bold text-gray-500">Official Document</span>
                  <button onClick={async ()=> await downloadReport(selectedProject, selectedProject.students)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded border transition">Download Auto-PDF</button>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowDocumentViewer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition shadow-sm w-fit"
                  >
                    <FileText className="w-4 h-4" />
                    View Uploaded Document
                  </button>
                  {selectedProject.document_url && (
                    <a href={selectedProject.document_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 text-xs hover:underline">
                      Open original file →
                    </a>
                  )}
                </div>
              </div>

              {(selectedProject.status !== 'Pending' || selectedProject.status === 'Pending') && (
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <span className="block text-xs uppercase font-bold text-gray-500 mb-2">{selectedProject.status === 'Pending' ? 'Actions & Remarks' : 'PBL Coordinator Remarks'}</span>
                  <textarea
                    readOnly={selectedProject.status !== 'Pending'}
                    value={remarks}
                    onChange={e=>setRemarks(e.target.value)}
                    placeholder="Enter remarks/feedback here..."
                    className={`w-full px-3 py-2 border rounded-lg text-sm max-h-32 ${selectedProject.status !== 'Pending'?'bg-gray-50 text-gray-600 outline-none':'focus:ring-2 outline-none'}`}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedProject.status === 'Pending' && (
              <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-2xl">
                <button onClick={()=>handleReject(selectedProject.id)} className="px-6 py-2.5 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-lg transition flex items-center">
                  <X className="w-4 h-4 mr-2" /> Reject
                </button>
                <button onClick={()=>handleApprove(selectedProject.id)} className="px-6 py-2.5 bg-green-600 text-white hover:bg-green-700 font-bold rounded-lg shadow transition flex items-center">
                  <Check className="w-4 h-4 mr-2" /> Approve
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
