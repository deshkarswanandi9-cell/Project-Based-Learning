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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Students Overview</h2>
        <div className="flex gap-4 mb-6">
          <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 font-semibold text-sm">Total Students: {stats.total}</div>
          <div className="px-4 py-2 bg-green-50 text-green-800 rounded-lg border border-green-100 font-semibold text-sm">Approved: {stats.approved}</div>
          <div className="px-4 py-2 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 font-semibold text-sm">Pending: {stats.pending}</div>
        </div>
        
        <input 
          type="text" 
          placeholder="Search by student name or roll number..." 
          value={search}
          onChange={e=>setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4"
        />

        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Project Title</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{p.students?.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.students?.roll_number}</td>
                  <td className="px-4 py-3 text-gray-600">{p.students?.department}</td>
                  <td className="px-4 py-3 text-gray-600">{p.students?.year}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-gray-600">{p.domain}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${p.status==='Approved'?'bg-green-100 text-green-800':p.status==='Pending'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-800'}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
