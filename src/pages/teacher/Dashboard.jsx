import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherProjects, getTeacherStats } from '../../utils/api';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Link } from 'react-router-dom';
import {
  Users, FolderOpen, Clock, CheckCircle, Download,
  FileText, FileSpreadsheet, AlertCircle, ArrowUpRight, BarChart3,
  Award, Globe, Layers, Check
} from 'lucide-react';
import { SDG_GOALS, PROJECT_DOMAINS, PROJECT_TYPES } from '../../utils/constants';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { downloadStatisticalReportPDF } from '../../utils/downloadStatisticalReport';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [excelGenerating, setExcelGenerating] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      Promise.all([
        getTeacherProjects(profile.user_id),
        getTeacherStats(profile.user_id)
      ]).then(([projs, st]) => {
        setProjects(projs || []);
        setStats(st || {});
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching teacher data:', err);
        setLoading(false);
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-maroon border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Compile SDG coverage dynamically
  const sdgCounts = {};
  projects.forEach(p => {
    (p.sdg_goals || []).forEach(sdg => {
      sdgCounts[sdg] = (sdgCounts[sdg] || 0) + 1;
    });
  });

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const dateSlug = new Date().toISOString().split('T')[0];
  const coordinatorName = profile?.full_name || 'PBL Coordinator';
  const deptName = profile?.department || 'Department of Computer Engineering';
  const totalProjects = stats.total || projects.length || 0;

  // ──────────────────────────────────────────────────────────────────
  // DOWNLOAD PDF REPORT
  // ──────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      setPdfGenerating(true);
      toast.loading('Generating Statistical Report PDF...', { id: 'pdf-toast' });
      await downloadStatisticalReportPDF({
        stats,
        projects,
        profile,
        sdgCounts,
      });
      toast.success('Statistical Report PDF downloaded successfully', { id: 'pdf-toast' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-toast' });
    } finally {
      setPdfGenerating(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────
  // EXPORT TO EXCEL (UPGRADED WITH COLLEGE BRANDING)
  // ──────────────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    try {
      setExcelGenerating(true);
      toast.loading('Exporting Excel report...', { id: 'excel-toast' });
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('PBL Statistical Report', {
        views: [{ showGridLines: true }]
      });

      // 1. College Header Rows
      sheet.mergeCells('A1:C1');
      const r1 = sheet.getCell('A1');
      r1.value = "JSPM'S RAJARSHI SHAHU COLLEGE OF ENGINEERING";
      r1.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A3A3A' } }; // Maroon
      r1.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 32;

      sheet.mergeCells('A2:C2');
      const r2 = sheet.getCell('A2');
      r2.value = "(An Autonomous Institute Affiliated to Savitribai Phule Pune University)";
      r2.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFFFFFFF' } };
      r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A3A3A' } };
      r2.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 18;

      sheet.mergeCells('A3:C3');
      const r3 = sheet.getCell('A3');
      r3.value = deptName.toUpperCase();
      r3.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A3A3A' } };
      r3.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(3).height = 22;

      sheet.mergeCells('A4:C4');
      const r4 = sheet.getCell('A4');
      r4.value = 'PROJECT BASED LEARNING – STATISTICAL REPORT';
      r4.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF8A3A3A' } };
      r4.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(4).height = 28;

      sheet.mergeCells('A5:C5');
      const r5 = sheet.getCell('A5');
      r5.value = `Academic Year: 2026–2027  |  Generated On: ${currentDateFormatted}  |  PBL Coordinator: ${coordinatorName}`;
      r5.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF555555' } };
      r5.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(5).height = 20;

      sheet.addRow([]);

      // Section Header Helper
      const addSectionHeader = (title) => {
        const row = sheet.addRow([title, '', '']);
        sheet.mergeCells(`A${row.number}:C${row.number}`);
        row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A3A3A' } };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        row.height = 24;
        return row;
      };

      const addDataRow = (colA, colB, colC) => {
        const row = sheet.addRow([colA, colB, colC]);
        row.font = { name: 'Arial', size: 9.5 };
        row.getCell(1).font = { bold: true, color: { argb: 'FF333333' }, size: 9.5 };
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'left' };
        return row;
      };

      // SECTION A: Statistical Overview
      addSectionHeader('A. STATISTICAL OVERVIEW');
      const statsHeader = sheet.addRow(['Metric', 'Count / Value', 'Status / Distribution']);
      statsHeader.font = { bold: true, size: 10 };
      statsHeader.eachCell(c => c.border = { bottom: { style: 'medium', color: { argb: 'FF8A3A3A' } } });

      const pending = stats.pending || projects.filter(p => p.status === 'Pending').length || 0;
      const approved = stats.approved || projects.filter(p => p.status === 'Approved').length || 0;
      const rejected = stats.rejected || projects.filter(p => p.status === 'Rejected').length || 0;
      const students = stats.students || new Set(projects.map(p => p.student_id)).size || 0;

      addDataRow('Total Enrolled Students', students, 'Active Registered Cohort');
      addDataRow('Total Submitted Projects', totalProjects, totalProjects > 0 ? '100.0%' : '0.0%');
      addDataRow('Projects Pending Approval', pending, totalProjects > 0 ? `${((pending / totalProjects) * 100).toFixed(1)}% Pending Review` : '0.0%');
      addDataRow('Fully Approved Projects', approved, totalProjects > 0 ? `${((approved / totalProjects) * 100).toFixed(1)}% Certified & Approved` : '0.0%');
      if (rejected > 0) {
        addDataRow('Projects Requiring Revision / Rejected', rejected, totalProjects > 0 ? `${((rejected / totalProjects) * 100).toFixed(1)}% Returned with remarks` : '0.0%');
      }
      sheet.addRow([]);

      // SECTION B: Domains & Types
      addSectionHeader('B. PROJECT DOMAIN & TYPE BREAKDOWN');
      const domainHeader = sheet.addRow(['Category', 'Project Count', 'Percentage (%)']);
      domainHeader.font = { bold: true, size: 10 };
      domainHeader.eachCell(c => c.border = { bottom: { style: 'medium', color: { argb: 'FF8A3A3A' } } });

      addDataRow('--- BY DOMAIN ---', '', '');
      if (stats.domains && Object.keys(stats.domains).length > 0) {
        Object.entries(stats.domains).forEach(([domain, count]) => {
          const perc = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) + '%' : '0.0%';
          addDataRow(domain, count, perc);
        });
      } else {
        addDataRow('No domain data available', 0, '0.0%');
      }
      sheet.addRow([]);

      addDataRow('--- BY PROJECT TYPE ---', '', '');
      if (stats.types && Object.keys(stats.types).length > 0) {
        Object.entries(stats.types).forEach(([type, count]) => {
          const perc = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) + '%' : '0.0%';
          addDataRow(type, count, perc);
        });
      } else {
        addDataRow('No project type data available', 0, '0.0%');
      }
      sheet.addRow([]);

      // SECTION C: SDGs
      addSectionHeader('C. UN SUSTAINABLE DEVELOPMENT GOALS (SDG) COVERAGE');
      const sdgHeader = sheet.addRow(['Goal Description', 'Projects Addressing Goal', 'Percentage (%)']);
      sdgHeader.font = { bold: true, size: 10 };
      sdgHeader.eachCell(c => c.border = { bottom: { style: 'medium', color: { argb: 'FF8A3A3A' } } });

      if (Object.keys(sdgCounts).length > 0) {
        Object.entries(sdgCounts).sort((a,b) => parseInt(a[0]) - parseInt(b[0])).forEach(([numStr, count]) => {
          const goal = SDG_GOALS.find(g => g.id === parseInt(numStr));
          const perc = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) + '%' : '0.0%';
          addDataRow(`Goal ${numStr}: ${goal?.title || 'Unknown'}`, count, perc);
        });
      } else {
        addDataRow('No SDG data recorded for current projects', '-', '0.0%');
      }

      // Column widths
      sheet.getColumn(1).width = 48;
      sheet.getColumn(2).width = 24;
      sheet.getColumn(3).width = 30;

      // Borders
      sheet.eachRow((row, rowNum) => {
        if (rowNum > 5) {
          row.eachCell((cell) => {
            if (!cell.border) {
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
              };
            }
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `RSCOE_PBL_Statistical_Report_${dateSlug}.xlsx`);
      toast.success('Statistical Report Excel exported successfully', { id: 'excel-toast' });
    } catch (err) {
      console.error('Error exporting Excel:', err);
      toast.error('Failed to export Excel report', { id: 'excel-toast' });
    } finally {
      setExcelGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      {/* ──────────────────────────────────────────────────────────────────
          REPORT TOOLBAR & METADATA
      ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 p-4 sm:p-5 mb-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-brand-maroon shrink-0" />
            <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-brand-maroon">
              Project Based Learning – Statistical Report
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-maroon"></span>
              Academic Year: <strong className="text-gray-900">2026–2027</strong>
            </span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span>
              Generated On: <strong className="text-gray-900">{currentDateFormatted}</strong>
            </span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span>
              PBL Coordinator: <strong className="text-gray-900">{coordinatorName}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons: Download PDF & Export Excel */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {/* DOWNLOAD PDF BUTTON */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-maroon hover:bg-[#6e2e2e] text-white rounded-md text-xs font-semibold shadow-2xs transition disabled:opacity-60 cursor-pointer"
            title="Download Statistical Report as official PDF"
          >
            {pdfGenerating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Download PDF</span>
          </button>

          {/* EXPORT EXCEL BUTTON */}
          <button
            onClick={exportToExcel}
            disabled={excelGenerating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-2xs transition disabled:opacity-60 cursor-pointer"
            title="Export Statistical Report to Excel (.xlsx)"
          >
            {excelGenerating ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          2. SECTION A: STATISTICAL OVERVIEW
      ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden mb-6">
        <div className="bg-brand-maroon px-4 sm:px-5 py-2.5 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <span>A. Statistical Overview</span>
          </h2>
          <span className="text-[11px] text-white/80">Real-time cohort statistics</span>
        </div>

        <div className="p-4 sm:p-5">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50/70 p-4 rounded-md border border-gray-200/80 border-l-4 border-l-brand-maroon">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Enrolled Students</p>
                <Users className="w-4 h-4 text-brand-maroon" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.students || 0}</p>
              <p className="text-[11px] text-gray-500 mt-1">Active departmental students</p>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-md border border-gray-200/80 border-l-4 border-l-brand-maroon">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Submitted Projects</p>
                <FolderOpen className="w-4 h-4 text-brand-maroon" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalProjects}</p>
              <p className="text-[11px] text-gray-500 mt-1">Registered applications</p>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-md border border-gray-200/80 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Projects Pending Approval</p>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pending || 0}</p>
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                {totalProjects > 0 ? `${(((stats.pending || 0) / totalProjects) * 100).toFixed(1)}% awaiting evaluation` : 'Awaiting submissions'}
              </p>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-md border border-gray-200/80 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fully Approved Projects</p>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.approved || 0}</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {totalProjects > 0 ? `${(((stats.approved || 0) / totalProjects) * 100).toFixed(1)}% verified & certified` : 'None approved yet'}
              </p>
            </div>
          </div>

          {/* Table summary of overview */}
          <div className="overflow-x-auto border border-gray-200/80 rounded-md">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-2">Metric</th>
                  <th className="px-3.5 py-2 text-center">Count</th>
                  <th className="px-3.5 py-2">Percentage / Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/60 transition">
                  <td className="px-3.5 py-2 font-medium text-gray-900">Total Enrolled Cohort Students</td>
                  <td className="px-3.5 py-2 text-center font-bold text-gray-900">{stats.students || 0}</td>
                  <td className="px-3.5 py-2 text-gray-600">Registered department students under monitoring</td>
                </tr>
                <tr className="hover:bg-gray-50/60 transition">
                  <td className="px-3.5 py-2 font-medium text-gray-900">Total Project Submissions</td>
                  <td className="px-3.5 py-2 text-center font-bold text-gray-900">{totalProjects}</td>
                  <td className="px-3.5 py-2 text-gray-600">{totalProjects > 0 ? '100.0% of all submitted applications' : '0.0%'}</td>
                </tr>
                <tr className="hover:bg-gray-50/60 transition">
                  <td className="px-3.5 py-2 font-medium text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Coordinator Verification
                  </td>
                  <td className="px-3.5 py-2 text-center font-bold text-amber-900">{stats.pending || 0}</td>
                  <td className="px-3.5 py-2 text-amber-700 font-medium">
                    {totalProjects > 0 ? `${(((stats.pending || 0) / totalProjects) * 100).toFixed(1)}% of submissions require review` : '0.0%'}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/60 transition">
                  <td className="px-3.5 py-2 font-medium text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Approved & Certified Projects
                  </td>
                  <td className="px-3.5 py-2 text-center font-bold text-emerald-900">{stats.approved || 0}</td>
                  <td className="px-3.5 py-2 text-emerald-700 font-medium">
                    {totalProjects > 0 ? `${(((stats.approved || 0) / totalProjects) * 100).toFixed(1)}% successfully evaluated` : '0.0%'}
                  </td>
                </tr>
                {(stats.rejected || 0) > 0 && (
                  <tr className="hover:bg-gray-50/60 transition">
                    <td className="px-3.5 py-2 font-medium text-red-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Requiring Revision / Rejected
                    </td>
                    <td className="px-3.5 py-2 text-center font-bold text-red-900">{stats.rejected}</td>
                    <td className="px-3.5 py-2 text-red-700 font-medium">
                      {totalProjects > 0 ? `${(((stats.rejected || 0) / totalProjects) * 100).toFixed(1)}% returned with feedback` : '0.0%'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          3. SECTION B: PROJECT DOMAIN & TYPE BREAKDOWN
      ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden mb-6">
        <div className="bg-brand-maroon px-4 sm:px-5 py-2.5 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <span>B. Project Domain &amp; Type Breakdown</span>
          </h2>
          <span className="text-[11px] text-white/80">Category counts &amp; percentages</span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Projects by Domain Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-maroon" /> Project Domain Distribution
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  {Object.keys(stats.domains || {}).length} Domains active
                </span>
              </div>
              <div className="overflow-x-auto border border-gray-200/80 rounded-md">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2">Domain</th>
                      <th className="px-3 py-2 text-center">Count</th>
                      <th className="px-3 py-2 text-right">Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.domains && Object.entries(stats.domains).length > 0 ? (
                      Object.entries(stats.domains).map(([domain, count]) => {
                        const pct = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={domain} className="hover:bg-gray-50/60 transition">
                            <td className="px-3 py-2 text-gray-800 font-medium">
                              <div>{domain}</div>
                              <div className="w-full bg-gray-100 rounded-full h-1 mt-1 max-w-[160px]">
                                <div className="bg-brand-maroon h-1 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-gray-900">{count}</td>
                            <td className="px-3 py-2 text-right font-semibold text-brand-maroon">{pct}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-3 py-4 text-center text-gray-500 text-xs">
                          No project domain data recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {totalProjects > 0 && (
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                      <tr>
                        <td className="px-3 py-1.5 text-gray-900">Total Projects</td>
                        <td className="px-3 py-1.5 text-center text-gray-900">{totalProjects}</td>
                        <td className="px-3 py-1.5 text-right text-gray-900">100.0%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* 2. Projects by Type Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-maroon" /> Project Type Distribution
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  {Object.keys(stats.types || {}).length} Types active
                </span>
              </div>
              <div className="overflow-x-auto border border-gray-200/80 rounded-md">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2">Project Type</th>
                      <th className="px-3 py-2 text-center">Count</th>
                      <th className="px-3 py-2 text-right">Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.types && Object.entries(stats.types).length > 0 ? (
                      Object.entries(stats.types).map(([type, count]) => {
                        const pct = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={type} className="hover:bg-gray-50/60 transition">
                            <td className="px-3 py-2 text-gray-800 font-medium">
                              <div>{type}</div>
                              <div className="w-full bg-gray-100 rounded-full h-1 mt-1 max-w-[160px]">
                                <div className="bg-brand-maroon h-1 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-gray-900">{count}</td>
                            <td className="px-3 py-2 text-right font-semibold text-brand-maroon">{pct}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-3 py-4 text-center text-gray-500 text-xs">
                          No project type data recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {totalProjects > 0 && (
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                      <tr>
                        <td className="px-3 py-1.5 text-gray-900">Total Projects</td>
                        <td className="px-3 py-1.5 text-center text-gray-900">{totalProjects}</td>
                        <td className="px-3 py-1.5 text-right text-gray-900">100.0%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          4. SECTION C: UN SUSTAINABLE DEVELOPMENT GOALS (SDG) COVERAGE
      ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden mb-6">
        <div className="bg-brand-maroon px-4 sm:px-5 py-2.5 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <span>C. UN Sustainable Development Goals (SDG) Coverage</span>
          </h2>
          <span className="text-[11px] text-white/80">
            {Object.keys(sdgCounts).length} of 17 UN Goals addressed
          </span>
        </div>

        <div className="p-4 sm:p-5">
          {/* SDG Detailed Table */}
          <div className="overflow-x-auto border border-gray-200/80 rounded-md mb-5">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 w-20">Goal #</th>
                  <th className="px-3 py-2">UN Goal Description</th>
                  <th className="px-3 py-2 text-center w-28">Projects Count</th>
                  <th className="px-3 py-2 text-right w-28">Coverage (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.keys(sdgCounts).length > 0 ? (
                  Object.entries(sdgCounts)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([numStr, count]) => {
                      const goal = SDG_GOALS.find(g => g.id === parseInt(numStr));
                      const pct = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={numStr} className="hover:bg-gray-50/60 transition">
                          <td className="px-3 py-2">
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded text-white font-bold text-[11px] shadow-2xs"
                              style={{ backgroundColor: goal?.color || '#8a3a3a' }}
                            >
                              {numStr}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-800">
                            {goal?.title || `SDG Goal ${numStr}`}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-gray-900">{count}</td>
                          <td className="px-3 py-2 text-right font-semibold text-brand-maroon">{pct}%</td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-3 py-4 text-center text-gray-500 text-xs">
                      No SDG goals addressed by student submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Interactive Visual Badges Grid */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2.5">
              Visual SDG Matrix
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sdgCounts).map(([numStr, count]) => {
                const goal = SDG_GOALS.find(g => g.id === parseInt(numStr));
                if (!goal) return null;
                return (
                  <div
                    key={goal.id}
                    className="flex px-2.5 py-1.5 rounded-md items-center text-white text-xs font-medium shadow-2xs"
                    style={{ backgroundColor: goal.color }}
                  >
                    <span className="font-bold mr-1.5 leading-none text-sm">{goal.id}</span>
                    <span className="hidden sm:inline mr-2 text-[11px]">{goal.title}</span>
                    <span className="bg-white/30 px-1.5 py-0.5 rounded text-[10px] ml-auto font-bold">
                      {count} {count === 1 ? 'proj' : 'projs'}
                    </span>
                  </div>
                );
              })}
              {Object.keys(sdgCounts).length === 0 && (
                <p className="text-xs text-gray-500">No SDG goals addressed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          5. SECTION D: RECENT PROJECT SUBMISSIONS REGISTER
      ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden mb-6">
        <div className="bg-brand-maroon px-4 sm:px-5 py-2.5 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
            <span>D. Recent Project Submissions Register</span>
          </h2>
          <Link
            to="/teacher/monitoring"
            className="text-[11px] text-white hover:text-white/80 font-medium underline flex items-center gap-1"
          >
            <span>View All Submissions</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          <div className="overflow-x-auto border border-gray-200/80 rounded-md">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-3.5 py-2.5">Student</th>
                  <th className="px-3.5 py-2.5">Roll No</th>
                  <th className="px-3.5 py-2.5">Project Title</th>
                  <th className="px-3.5 py-2.5">Domain</th>
                  <th className="px-3.5 py-2.5">Type</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-center">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.slice(0, 8).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-3.5 py-2.5 font-semibold text-gray-900">{p.students?.full_name || '—'}</td>
                    <td className="px-3.5 py-2.5 text-gray-600 font-medium">{p.students?.roll_number || '—'}</td>
                    <td className="px-3.5 py-2.5 text-gray-800 max-w-[220px] truncate" title={p.title}>
                      {p.title}
                    </td>
                    <td className="px-3.5 py-2.5 text-gray-600">{p.domain || '—'}</td>
                    <td className="px-3.5 py-2.5 text-gray-600">{p.type || '—'}</td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                          p.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-gray-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-xs">
                      No project applications registered under this coordinator yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
