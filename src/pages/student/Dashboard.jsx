
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyProject } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { PO_LIST, PSO_LIST, SDG_GOALS, normalizePsos, getEffectivePsos } from '../../utils/constants';
import { downloadReport } from '../../utils/downloadReport';
import { Clock, FolderOpen, CheckCircle, XCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      getMyProject(profile.user_id).then(data => {
        setProject(data && data.length > 0 ? data[0] : null);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [profile]);

  if (loading) return <DashboardLayout><div className="p-8">Loading data...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* SECTION 1 - Welcome Banner */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Welcome, {profile?.full_name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
              Roll No: {profile?.roll_number}
            </span>
            <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
              Dept: {profile?.department}
            </span>
            <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
              {profile?.year}
            </span>
          </div>
        </div>
        <div>
          <span className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
            Academic Year 2026–2027
          </span>
        </div>
      </div>

      {/* SECTION 2 - Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-4 rounded-md shadow-2xs border border-gray-200/90">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Project Status</p>
          {!project ? (
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">Not Registered</span>
          ) : project.status === 'Pending' ? (
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-md text-xs font-medium flex items-center w-fit border border-amber-200"><Clock className="w-3.5 h-3.5 mr-1" /> Pending Approval</span>
          ) : project.status === 'Approved' ? (
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-xs font-medium flex items-center w-fit border border-emerald-200"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved</span>
          ) : (
            <span className="px-2.5 py-0.5 bg-red-50 text-red-800 rounded-md text-xs font-medium flex items-center w-fit border border-red-200"><XCircle className="w-3.5 h-3.5 mr-1" /> Rejected</span>
          )}
        </div>

        <div className="bg-white p-4 rounded-md shadow-2xs border border-gray-200/90">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Project Domain</p>
          <p className="text-sm font-semibold text-gray-900">{project ? project.domain : 'Not Registered'}</p>
        </div>

        <div className="bg-white p-4 rounded-md shadow-2xs border border-gray-200/90">
          <p className="text-xs font-medium text-gray-500 mb-1.5">PBL Coordinator</p>
          <p className="text-sm font-semibold text-gray-900">{project?.mentor_name || 'Not Assigned'}</p>
        </div>

        <div className="bg-white p-4 rounded-md shadow-2xs border border-gray-200/90">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Project Type</p>
          <p className="text-sm font-semibold text-gray-900">{project?.type || '—'}</p>
        </div>
      </div>

      {/* SECTION 3 - Quick Actions */}
      <div className="bg-white p-4 rounded-md shadow-2xs border border-gray-200/90 mb-5 flex flex-wrap gap-3 items-center">
        {!project ? (
          <button onClick={() => navigate('/student/project/register')} className="px-4 py-2 bg-brand-maroon hover:bg-[#6e2e2e] text-white text-xs sm:text-sm font-medium rounded-md shadow-2xs transition">
            Register Project
          </button>
        ) : (
          <button onClick={() => navigate('/student/project/my')} className="px-4 py-2 border border-brand-maroon text-brand-maroon hover:bg-brand-maroon/5 text-xs sm:text-sm font-medium rounded-md transition">
            View My Project
          </button>
        )}

        {project?.status === 'Approved' && (
          <button onClick={() => downloadReport(project, profile)} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium rounded-md shadow-2xs transition">
            Download Report
          </button>
        )}
      </div>

      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SECTION 4 - Programme Outcomes */}
          <div className="bg-white p-5 rounded-md shadow-2xs border border-gray-200/90">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Programme Outcomes Covered</h3>
            <p className="text-xs text-gray-500 mb-3">{project.pos?.length || 0} / 11 POs covered</p>
            <div className="flex flex-wrap gap-1.5">
              {PO_LIST.map(po => {
                const selected = project.pos?.includes(po.id);
                return (
                  <span key={po.id} title={po.title} className={`px-2.5 py-1 text-xs font-medium rounded-md border ${selected ? 'bg-brand-maroon text-white border-brand-maroon' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {po.id}
                  </span>
                );
              })}
            </div>
          </div>

          {/* SECTION 5 - SDG Goals */}
          <div className="bg-white p-5 rounded-md shadow-2xs border border-gray-200/90">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sustainable Development Goals</h3>
            <p className="text-xs text-gray-500 mb-3">{project.sdg_goals?.length || 0} / 17 goals addressed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {project.sdg_goals?.map(num => {
                const goal = SDG_GOALS.find(g => g.id === parseInt(num));
                if (!goal) return null;
                return (
                  <div key={goal.id} className="flex items-center p-2 rounded-md text-white font-medium text-xs shadow-2xs" style={{ backgroundColor: goal.color }}>
                    <span className="mr-2 text-sm font-bold">{goal.id}</span>
                    <span className="leading-tight text-[11px]">{goal.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6 - Programme Specific Outcomes (PSOs) */}
          <div className="bg-white p-5 rounded-md shadow-2xs border border-gray-200/90 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Programme Specific Outcomes (PSOs)</h3>
              {project.psos !== undefined && normalizePsos(project.psos).length === 0 && (
                <span className="text-[10px] text-purple-700 font-medium bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  AI Mapped
                </span>
              )}
            </div>
            {project.psos === undefined ? (
              <p className="text-xs text-amber-700 italic">Notice: PSO mapping is pending database column migration (supabase_add_psos_column.sql).</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">{getEffectivePsos(project).length} / {PSO_LIST.length} PSOs addressed</p>
                <div className="flex flex-wrap gap-1.5">
                  {PSO_LIST.map(pso => {
                    const mapped = getEffectivePsos(project).includes(pso.id);
                    return (
                      <span key={pso.id} title={`${pso.id}: ${pso.title}`} className={`px-2.5 py-1 text-xs font-medium rounded-md border ${mapped ? 'bg-brand-maroon text-white border-brand-maroon' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {pso.id}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
