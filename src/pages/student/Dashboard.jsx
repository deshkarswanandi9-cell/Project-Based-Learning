import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyProject } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { PO_LIST, SDG_GOALS } from '../../utils/constants';
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name}!</h2>
          <div className="flex bg-gray-50 flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
              Role: {profile?.roll_number}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
              Dept: {profile?.department}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
              {profile?.year}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200">
            Academic Year 2024-25
          </span>
        </div>
      </div>

      {/* SECTION 2 - Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Project Status</p>
          {!project ? (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold border border-gray-200">Not Registered</span>
          ) : project.status === 'Pending' ? (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold flex items-center w-fit border border-amber-200"><Clock className="w-4 h-4 mr-1"/> Pending Approval</span>
          ) : project.status === 'Approved' ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center w-fit border border-green-200"><CheckCircle className="w-4 h-4 mr-1"/> Approved</span>
          ) : (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold flex items-center w-fit border border-red-200"><XCircle className="w-4 h-4 mr-1"/> Rejected</span>
          )}
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Project Domain</p>
          <p className="text-lg font-bold text-gray-900">{project ? project.domain : 'Not Registered'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">PBL Coordinator</p>
          <p className="text-lg font-bold text-gray-900">{project?.mentor_name || 'Not Assigned'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">Project Type</p>
          <p className="text-lg font-bold text-gray-900">{project?.type || '-'}</p>
        </div>
      </div>

      {/* SECTION 3 - Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
        {!project ? (
          <button onClick={() => navigate('/student/project/register')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
            Register Your Project
          </button>
        ) : (
          <button onClick={() => navigate('/student/project/my')} className="px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition">
            View My Project
          </button>
        )}
        
        {project?.status === 'Approved' && (
          <button onClick={() => downloadReport(project, profile)} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">
            Download Report
          </button>
        )}
      </div>

      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 4 - Programme Outcomes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Programme Outcomes Covered</h3>
            <p className="text-sm font-medium text-gray-500 mb-3 block">{project.pos?.length || 0} / 11 POs covered</p>
            <div className="flex flex-wrap gap-2">
              {PO_LIST.map(po => {
                const selected = project.pos?.includes(po.id);
                return (
                  <span key={po.id} title={po.title} className={`px-3 py-1 text-sm font-semibold rounded-full border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'}`}>
                    {po.id}
                  </span>
                );
              })}
            </div>
          </div>

          {/* SECTION 5 - SDG Goals */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sustainable Development Goals</h3>
            <p className="text-sm font-medium text-gray-500 mb-3 block">{project.sdg_goals?.length || 0} / 17 goals addressed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {project.sdg_goals?.map(num => {
                const goal = SDG_GOALS.find(g => g.id === parseInt(num));
                if (!goal) return null;
                return (
                  <div key={goal.id} className="flex items-center p-2 rounded-lg text-white font-bold text-xs" style={{ backgroundColor: goal.color }}>
                    <span className="mr-2 text-lg">{goal.id}</span>
                    <span className="leading-tight">{goal.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
