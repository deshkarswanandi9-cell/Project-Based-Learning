import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherProjects } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';

export default function StudentsList() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (profile?.user_id) {
      getTeacherProjects(profile.user_id).then(data => {
        setProjects(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [profile]);

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;

  // A student is represented by the project they submitted.
  // One student, one project in this layout.
  
  const filteredProjects = projects.filter(p => {
    const term = search.toLowerCase();
    return p.students?.full_name.toLowerCase().includes(term) || p.students?.roll_number.toLowerCase().includes(term);
  });

  const stats = {
    total: projects.length,
    approved: projects.filter(p=>p.status==='Approved').length,
    pending: projects.filter(p=>p.status==='Pending').length
  };

  return (
    <DashboardLayout>
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 p-5 mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Assigned Students Overview</h2>
        <div className="flex gap-2.5 mb-4 flex-wrap">
          <div className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md border border-gray-200 font-medium text-xs">Total Students: {stats.total}</div>
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 font-medium text-xs">Approved: {stats.approved}</div>
          <div className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 font-medium text-xs">Pending: {stats.pending}</div>
        </div>
        
        <input 
          type="text" 
          placeholder="Search by student name or roll number..." 
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="w-full max-w-lg px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none text-xs mb-4"
        />

        <div className="overflow-x-auto border border-gray-200/90 rounded-md">
          <table className="min-w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5">Student Name</th>
                <th className="px-3 py-2.5">Roll No</th>
                <th className="px-3 py-2.5">Department</th>
                <th className="px-3 py-2.5">Year</th>
                <th className="px-3 py-2.5">Project Title</th>
                <th className="px-3 py-2.5">Domain</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition">
                  <td className="px-3 py-2.5 font-medium text-gray-900">{p.students?.full_name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.students?.roll_number}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.students?.department}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.students?.year}</td>
                  <td className="px-3 py-2.5 text-gray-800 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-3 py-2.5 text-gray-600">{p.domain}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${p.status==='Approved'?'bg-emerald-50 text-emerald-800 border border-emerald-200':p.status==='Pending'?'bg-amber-50 text-amber-800 border border-amber-200':'bg-red-50 text-red-800 border border-red-200'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-xs">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
