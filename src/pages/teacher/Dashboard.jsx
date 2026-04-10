import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherProjects, getTeacherStats } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Link } from 'react-router-dom';
import { Users, FolderOpen, Clock, CheckCircle, Download } from 'lucide-react';
import { SDG_GOALS } from '../../utils/constants';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_id) {
      Promise.all([
        getTeacherProjects(profile.user_id),
        getTeacherStats(profile.user_id)
      ]).then(([projs, st]) => {
        setProjects(projs);
        setStats(st);
        setLoading(false);
      });
    }
  }, [profile]);

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;

  // Compile SDG coverage
  const sdgCounts = {};
  projects.forEach(p => {
    (p.sdg_goals || []).forEach(sdg => {
      sdgCounts[sdg] = (sdgCounts[sdg] || 0) + 1;
    });
  });

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('PBL Statistics', {
      views: [{ showGridLines: false }]
    });

    // 1. Title Row
    sheet.mergeCells('A1:C1');
    const titleRow = sheet.getCell('A1');
    titleRow.value = 'PROJECT BASED LEARNING - STATISTICAL REPORT';
    titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800000' } }; // Maroon
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 40;

    // 2. Metadata Subtitle
    sheet.mergeCells('A2:C2');
    const subRow = sheet.getCell('A2');
    subRow.value = `Generated On: ${new Date().toLocaleDateString()} | Coordinator: ${profile?.full_name}`;
    subRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
    subRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    sheet.addRow([]);

    // Helper to add aesthetic headers
    const addHeader = (title) => {
      const row = sheet.addRow([title, '', '']);
      sheet.mergeCells(`A${row.number}:C${row.number}`);
      row.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } }; // Deep Blue
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      row.height = 25;
      return row;
    };

    const addDataRow = (colA, colB, colC) => {
      const row = sheet.addRow([colA, colB, colC]);
      row.font = { name: 'Arial', size: 10 };
      row.getCell(1).font = { bold: true, color: { argb: 'FF333333' }, size: 10 };
      row.getCell(2).alignment = { horizontal: 'left' };
      row.getCell(3).alignment = { horizontal: 'left' };
      return row;
    };

    // SECTION 1: Overview
    addHeader('STATISTICAL OVERVIEW');
    const statsHeader = sheet.addRow(['Metric', 'Value', '']);
    statsHeader.font = { bold: true, size: 11 };
    statsHeader.eachCell(c => c.border = { bottom: { style: 'medium', color: { argb: 'FFAAAAAA' } } });
    
    addDataRow('Total Enrolled Students', stats.students || 0, '');
    addDataRow('Total Submitted Projects', stats.total || 0, '');
    addDataRow('Projects Pending Approval', stats.pending || 0, '');
    addDataRow('Fully Approved Projects', stats.approved || 0, '');
    sheet.addRow([]);

    // SECTION 2: Domains & Types
    addHeader('PROJECT DOMAIN & TYPE BREAKDOWN');
    const domainHeader = sheet.addRow(['Category', 'Project Count', 'Percentage (%)']);
    domainHeader.font = { bold: true, size: 11 };
    domainHeader.eachCell(c => c.border = { bottom: { style: 'medium', color: { argb: 'FFAAAAAA' } } });

    // Domains
    addDataRow('--- BY DOMAIN ---', '', '');
    if (stats.domains && Object.keys(stats.domains).length > 0) {
      Object.entries(stats.domains).forEach(([domain, count]) => {
        const perc = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) + '%' : '0%';
        addDataRow(domain, count, perc);
      });
    }
    sheet.addRow([]);

    // Types
    addDataRow('--- BY PROJECT TYPE ---', '', '');
    if (stats.types && Object.keys(stats.types).length > 0) {
      Object.entries(stats.types).forEach(([type, count]) => {
        const perc = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) + '%' : '0%';
        addDataRow(type, count, perc);
      });
    }
    sheet.addRow([]);

    // SECTION 3: SDGs
    addHeader('UN SUSTAINABLE DEVELOPMENT GOALS COVERAGE');
    const sdgHeader = sheet.addRow(['Goal Description', 'Projects Addressing Goal', '']);
    sdgHeader.font = { bold: true, size: 11 };
    sdgHeader.eachCell(c => c.border = { bottom: { style: 'medium', color: { argb: 'FFAAAAAA' } } });

    if (Object.keys(sdgCounts).length > 0) {
      Object.entries(sdgCounts).forEach(([numStr, count]) => {
        const goal = SDG_GOALS.find(g => g.id === parseInt(numStr));
        addDataRow(`Goal ${numStr}: ${goal?.title || 'Unknown'}`, count, '');
      });
    } else {
      addDataRow('No SDG data recorded', '-', '');
    }

    // Set Column Widths
    sheet.getColumn(1).width = 45;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 20;

    // Give alternate row shading
    sheet.eachRow((row, rowNum) => {
      if (rowNum > 3) { // Skip headers
        row.eachCell((cell) => {
          if (!cell.border) {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
              right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
            };
          }
        });
      }
    });

    // Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'PBL_Premium_Statistics_Report.xlsx');
  };

  return (
    <DashboardLayout>
      {/* SECTION 1 - Welcome */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, Coordinator {profile?.full_name}!</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and evaluate projects efficiently.</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 items-center">
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow transition">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
            {profile?.department}
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
            Joined {profile?.year_of_joining}
          </span>
        </div>
      </div>

      {/* SECTION 2 - Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-brand-maroon">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-500 uppercase">Total Students</p><Users className="w-5 h-5 text-gray-400"/></div>
          <p className="text-3xl font-black text-gray-900 mt-2">{stats.students || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-brand-maroon">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-500 uppercase">Total Projects</p><FolderOpen className="w-5 h-5 text-gray-400"/></div>
          <p className="text-3xl font-black text-gray-900 mt-2">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-500 uppercase">Pending Approval</p><Clock className="w-5 h-5 text-gray-400"/></div>
          <p className="text-3xl font-black text-gray-900 mt-2">{stats.pending || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-600">
          <div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-500 uppercase">Approved</p><CheckCircle className="w-5 h-5 text-gray-400"/></div>
          <p className="text-3xl font-black text-gray-900 mt-2">{stats.approved || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* SECTION 3 - Domain Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Projects by Domain</h3>
          <div className="space-y-4">
            {stats.domains && Object.entries(stats.domains).length > 0 ? (
              Object.entries(stats.domains).map(([domain, count]) => {
                const width = `${((count / stats.total) * 100).toFixed(1)}%`;
                return (
                  <div key={domain}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">{domain}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-brand-maroon h-2 rounded-full" style={{ width }}></div>
                    </div>
                  </div>
                )
              })
            ) : <p className="text-sm text-gray-500">No projects yet.</p>}
          </div>
        </div>

        {/* SECTION 3B - Type Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Projects by Type</h3>
          <div className="space-y-4">
            {stats.types && Object.entries(stats.types).length > 0 ? (
              Object.entries(stats.types).map(([type, count]) => {
                const width = `${((count / stats.total) * 100).toFixed(1)}%`;
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">{type}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-brand-maroon h-2 rounded-full" style={{ width }}></div>
                    </div>
                  </div>
                )
              })
            ) : <p className="text-sm text-gray-500">No project type data.</p>}
          </div>
        </div>

      {/* SECTION 4 - Recent Projects Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-bold text-gray-900">Recent Applications</h3>
          <Link to="/teacher/monitoring" className="text-sm font-bold text-brand-maroon hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 uppercase font-semibold">
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-3 py-3 font-medium text-gray-900">{p.students?.full_name}</td>
                  <td className="px-3 py-3 text-gray-600 truncate max-w-xs">{p.title}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${p.status==='Approved'?'bg-green-100 text-green-800':p.status==='Pending'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-800'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && <tr><td colSpan="3" className="px-3 py-4 text-center text-gray-500">No recent applications</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* SECTION 5 - SDG Coverage */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">SDG Goals Coverage Overview</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(sdgCounts).map(([numStr, count]) => {
            const goal = SDG_GOALS.find(g => g.id === parseInt(numStr));
            if(!goal) return null;
            return (
              <div key={goal.id} className="flex px-3 py-1.5 rounded items-center text-white text-xs font-bold" style={{backgroundColor: goal.color}}>
                <span className="text-lg mr-2 leading-none">{goal.id}</span>
                <span className="hidden sm:inline mr-2">{goal.title}</span>
                <span className="bg-white/30 px-1.5 py-0.5 rounded ml-1">{count}</span>
              </div>
            )
          })}
          {Object.keys(sdgCounts).length === 0 && <p className="text-sm text-gray-500">No SDG goals addressed yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
