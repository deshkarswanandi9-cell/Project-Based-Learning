import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherProjects, approveProject, rejectProject } from '../../utils/api';
import { DOMAINS } from '../../utils/constants';
import { generatePDFReport } from '../../utils/downloadReport';
import ProjectDocumentViewer from '../../components/common/ProjectDocumentViewer';
import { Search, Filter, FileText, Check, X, Download, Images } from 'lucide-react';

export default function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [viewerProject, setViewerProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const data = await getTeacherProjects(user.id);
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = projects;
    if (searchQuery) {
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterDomain) {
      result = result.filter(p => p.domain === filterDomain);
    }
    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }
    setFilteredProjects(result);
  }, [searchQuery, filterDomain, filterStatus, projects]);

  const handleStatusUpdate = async (status) => {
    if (!selectedProject) return;
    if (status === 'Rejected' && !remarks.trim()) {
      alert("Please provide remarks for rejecting this project.");
      return;
    }
    
    setActionLoading(true);
    try {
      if (status === 'Approved') {
        await approveProject(selectedProject.id, remarks);
      } else {
        await rejectProject(selectedProject.id, remarks);
      }
      // Update local state
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status, remarks } : p));
      setSelectedProject(null);
      setRemarks('');
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 block w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
          
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="block w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="">All Domains</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Lead</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No projects found for current filters.</td></tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{project.title.substring(0, 40)}{project.title.length > 40 && '...'}</div>
                      <div className="text-xs text-gray-500">{project.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.students?.full_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{project.students?.roll_number || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        project.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                      <button
                        onClick={async () => await generatePDFReport(project, project.students)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Download PDF Report"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedProject(project)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedProject(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              
              <div>
                <div className="mt-3 text-left sm:mt-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 mb-4" id="modal-title">
                    Review Project Request
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 text-xl">{selectedProject.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{selectedProject.domain} • {selectedProject.type}</p>
                    <p className="text-gray-700 text-sm mt-4">{selectedProject.description}</p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setViewerProject(selectedProject)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition"
                      >
                        <Images className="w-4 h-4" />
                        View Document &amp; Screenshots
                      </button>
                    </div>
                  </div>

                  {selectedProject.status !== 'Pending' && (
                    <div className={`p-3 rounded-lg text-sm mb-4 ${selectedProject.status === 'Approved' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <strong>Current Status: {selectedProject.status}</strong>
                      <p className="mt-1">{selectedProject.remarks}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Remarks (Required for rejection)</label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Enter evaluation remarks..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-3 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Approved')}
                  disabled={actionLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:col-start-3 sm:text-sm"
                >
                  <Check className="w-4 h-4 mr-1 my-auto" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Rejected')}
                  disabled={actionLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:mt-0 sm:col-start-2 sm:text-sm"
                >
                  <X className="w-4 h-4 mr-1 my-auto" /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Document / Screenshots Viewer */}
      {viewerProject && (
        <ProjectDocumentViewer
          project={viewerProject}
          onClose={() => setViewerProject(null)}
        />
      )}
    </div>
  );
}
