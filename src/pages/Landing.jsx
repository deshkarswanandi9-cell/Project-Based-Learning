import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

const studentFeatures = [
  'Register & track projects',
  'View PO and SDG coverage',
  'Download official reports',
  'Connect with PBL Coordinators',
];

const teacherFeatures = [
  'Monitor all student projects',
  'Approve or reject submissions',
  'View analytics & domain stats',
  'Generate comprehensive reports',
];

export default function Landing() {
  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      {/* ── HERO ── */}
      <section className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-5xl w-full mx-auto">

          {/* Hero text */}
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-maroon tracking-tight leading-tight mb-3">
              Project Based Learning (PBL) Portal
              <br />
              <span className="text-gray-600 font-normal text-xl sm:text-2xl">Academic Project Monitoring &amp; Evaluation System</span>
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              A centralized institutional platform to submit, verify, monitor, and export official project reports and programme outcomes.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Student Card */}
            <div className="bg-white border border-gray-200/90 rounded-md overflow-hidden shadow-2xs hover:shadow-xs transition flex flex-col">
              <div className="bg-brand-maroon px-4 py-2.5 flex justify-center items-center">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">Student Portal</h2>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-brand-mustard text-gray-900 font-semibold rounded-md shadow-2xs text-[11px] uppercase tracking-wider">
                    Key Features
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                  Register, document, and manage your PBL projects and outcomes across academic semesters.
                </p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {studentFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-maroon flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2.5">
                  <Link
                    to="/student/login"
                    className="flex-1 text-center py-2 text-xs font-medium text-brand-maroon bg-white border border-brand-maroon hover:bg-brand-maroon/5 rounded-md transition"
                  >
                    Student Login
                  </Link>
                  <Link
                    to="/student/register"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-brand-maroon hover:bg-[#6e2e2e] rounded-md transition shadow-2xs"
                  >
                    Register <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Coordinator Card */}
            <div className="bg-white border border-gray-200/90 rounded-md overflow-hidden shadow-2xs hover:shadow-xs transition flex flex-col">
              <div className="bg-brand-maroon px-4 py-2.5 flex justify-center items-center">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">PBL Coordinator Portal</h2>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-brand-mustard text-gray-900 font-semibold rounded-md shadow-2xs text-[11px] uppercase tracking-wider">
                    Key Features
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                  Oversee student submissions, review project details, and evaluate programme outcomes.
                </p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {teacherFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-maroon flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2.5">
                  <Link
                    to="/teacher/login"
                    className="flex-1 text-center py-2 text-xs font-medium text-brand-maroon bg-white border border-brand-maroon hover:bg-brand-maroon/5 rounded-md transition"
                  >
                    Faculty Login
                  </Link>
                  <Link
                    to="/teacher/login"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-brand-maroon hover:bg-[#6e2e2e] rounded-md transition shadow-2xs"
                  >
                    Register <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-white py-5 px-6 text-center">
        <p className="text-xs text-gray-500 font-medium">
          © 2026–2027 Project Based Learning Portal · JSPM's Rajarshi Shahu College of Engineering, Pune
        </p>
      </footer>
    </div>
  );
}
