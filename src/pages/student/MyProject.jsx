import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyProject } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { PO_LIST, SDG_GOALS } from '../../utils/constants';
import { downloadReport } from '../../utils/downloadReport';
import {
  Download, FolderOpen, Target, Globe,
  Image as ImageIcon, Eye, ArrowLeft,
  CalendarDays, Users, Layers, CheckCircle2,
  Clock, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import ProjectDocumentViewer from '../../components/common/ProjectDocumentViewer';

const statusConfig = {
  Approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Pending:  { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
  Rejected: { icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'    },
};

export default function MyProject() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [viewerProject, setViewerProject] = useState(null);
  const [expanded, setExpanded]           = useState({});

  useEffect(() => {
    if (profile?.user_id) {
      getMyProject(profile.user_id)
        .then(data => { setProjects(data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [profile]);

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (projects.length === 0) return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-14 h-14 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
          <FolderOpen className="w-6 h-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No Projects Yet</h2>
        <p className="text-gray-400 text-sm mt-1">You haven't registered any projects.</p>
        <button onClick={() => navigate('/student/project/register')}
          className="mt-6 px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition">
          Register a Project
        </button>
      </div>
    </DashboardLayout>
  );

  const grouped = projects.reduce((acc, p) => {
    const sem = p.semester || profile?.semester || 'Unassigned';
    (acc[sem] = acc[sem] || []).push(p);
    return acc;
  }, {});
  const semOrder = ['Sem I','Sem II','Sem III','Sem IV','Sem V','Sem VI','Sem VII','Sem VIII'];
  const sortedSems = Object.keys(grouped).sort((a, b) => {
    const ia = semOrder.indexOf(a), ib = semOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">

        {/* Back button + page title */}
        <div className="flex items-center gap-3 mb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
            Back
          </button>
          <span className="text-gray-200">|</span>
          <h1 className="text-xl font-bold text-gray-900">My Projects</h1>
          <span className="ml-auto text-xs text-gray-400">{projects.length} total</span>
        </div>

        {/* Semester sections */}
        {sortedSems.map(semester => (
          <div key={semester} className="mb-10">

            {/* Semester label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <CalendarDays className="w-3.5 h-3.5" />
                {semester}
              </div>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{grouped[semester].length} project{grouped[semester].length > 1 ? 's' : ''}</span>
            </div>

            {grouped[semester].map((project, idx) => {
              const sc = statusConfig[project.status] || statusConfig.Pending;
              const StatusIcon = sc.icon;
              const cardKey = `${semester}-${idx}`;
              const isOpen = expanded[cardKey] !== false; // default open

              return (
                <div key={project.id || idx}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 hover:border-gray-300 transition-all duration-200 shadow-sm">

                  {/* Card header */}
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 flex-wrap">
                        <h2 className="font-bold text-gray-900 text-base leading-snug">{project.title}</h2>
                        {/* Status */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {project.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.type && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{project.type}</span>
                        )}
                        {project.domain && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{project.domain}</span>
                        )}
                        {project.academic_year && (
                          <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">AY {project.academic_year}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setViewerProject(project)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => downloadReport(project, profile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleExpand(cardKey)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition rounded-md hover:bg-gray-100"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible body */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-5">

                      {/* Description */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{project.description || '—'}</p>
                      </div>

                      {/* Coordinator */}
                      <div className="flex gap-6 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">PBL Coordinator</p>
                          <p className="text-sm font-semibold text-gray-700">{project.mentor_name || '—'}</p>
                        </div>
                      </div>

                      {/* Technologies */}
                      {project.technologies?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Technologies
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {project.technologies.map(t => (
                              <span key={t} className="text-xs px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Team */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Team Members
                        </p>
                        <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                          {(project.team_members || []).map((m, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 text-sm">
                              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                              <span className="font-medium text-gray-800">{m.name}</span>
                              <span className="text-gray-400 text-xs ml-auto">{m.rollNumber}</span>
                              <span className="text-gray-400 text-xs">{m.rbtNumber}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PO + SDG side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" /> Programme Outcomes
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {PO_LIST.map(po => {
                              const mapped = project.pos?.includes(po.id);
                              return (
                                <span key={po.id} title={po.title}
                                  className={`text-xs px-2.5 py-1 rounded-full font-bold border transition ${
                                    mapped ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-50 text-gray-300 border-gray-100'
                                  }`}>
                                  {po.id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> SDG Goals
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(project.sdg_goals || []).map(num => {
                              const goal = SDG_GOALS.find(g => g.id === parseInt(num));
                              if (!goal) return null;
                              return (
                                <span key={goal.id} title={goal.title}
                                  className="text-xs px-2.5 py-1 rounded-full text-white font-bold"
                                  style={{ backgroundColor: goal.color }}>
                                  {goal.id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Screenshots */}
                      {project.screenshot_urls?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" /> Screenshots
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {project.screenshot_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer"
                                className="block rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50 hover:border-gray-400 transition group">
                                <img src={url} alt={`Screenshot ${i+1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                  loading="lazy" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Remarks */}
                      {project.remarks && (
                        <div className={`text-sm px-4 py-3 rounded-xl border ${
                          project.status === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        }`}>
                          <span className="font-semibold">Coordinator Remarks: </span>{project.remarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {viewerProject && (
        <ProjectDocumentViewer project={viewerProject} onClose={() => setViewerProject(null)} />
      )}
    </DashboardLayout>
  );
}
