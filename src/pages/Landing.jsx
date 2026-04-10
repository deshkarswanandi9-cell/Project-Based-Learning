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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── NAVBAR ── */}
      <header className="bg-brand-maroon">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-white" />
            <span className="font-bold text-white text-lg tracking-tight">Project Based Learning</span>
          </div>
          <span className="text-sm font-medium text-red-100">JSPM's RSCOE · Department of Computer Engineering</span>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="max-w-6xl w-full mx-auto">

          {/* Hero text */}
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-maroon tracking-tight leading-tight mb-4">
              Student Project Tracking
              <br />
              <span className="text-gray-500 font-normal">&amp; Management System</span>
            </h1>
            <p className="text-gray-600 text-base max-w-xl mx-auto leading-relaxed">
              A centralized platform to submit, verify, monitor, and export official PBL project reports — all in one place.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Student Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="bg-brand-maroon px-4 py-3 flex justify-center items-center">
                <h2 className="text-lg font-bold text-white tracking-wide">Student Portal</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="inline-block px-4 py-1.5 bg-brand-mustard text-gray-900 font-bold rounded-md shadow-sm text-xs uppercase tracking-wider">
                    Features
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Register and manage your PBL projects throughout your semesters.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {studentFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                      <CheckCircle className="w-4 h-4 text-brand-maroon flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <Link
                    to="/student/login"
                    className="flex-1 text-center py-2.5 text-sm font-semibold text-brand-maroon bg-white border border-brand-maroon hover:bg-brand-maroon/5 rounded-xl transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/student/register"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-brand-maroon hover:bg-[#6e2e2e] rounded-xl transition shadow-sm"
                  >
                    Register <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Coordinator Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="bg-brand-maroon px-4 py-3 flex justify-center items-center">
                <h2 className="text-lg font-bold text-white tracking-wide">PBL Coordinator Portal</h2>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="inline-block px-4 py-1.5 bg-brand-mustard text-gray-900 font-bold rounded-md shadow-sm text-xs uppercase tracking-wider">
                    Features
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Oversee student submissions, approve projects, and generate reports.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {teacherFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                      <CheckCircle className="w-4 h-4 text-brand-maroon flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <Link
                    to="/teacher/login"
                    className="flex-1 text-center py-2.5 text-sm font-semibold text-brand-maroon bg-white border border-brand-maroon hover:bg-brand-maroon/5 rounded-xl transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/teacher/login"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-brand-maroon hover:bg-[#6e2e2e] rounded-xl transition shadow-sm"
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
          © 2025–26 Project Based Learning Portal · JSPM's Rajarshi Shahu College of Engineering, Pune
        </p>
      </footer>
    </div>
  );
}
