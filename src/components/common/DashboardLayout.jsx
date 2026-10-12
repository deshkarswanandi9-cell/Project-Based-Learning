import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderOpen, PlusCircle, ClipboardList, Users, Bell, Menu, X, BookOpen } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { role, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentLinks = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Project', href: '/student/project/my', icon: FolderOpen },
    { name: 'Register Project', href: '/student/project/register', icon: PlusCircle },
  ];

  const teacherLinks = [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Project Monitoring', href: '/teacher/monitoring', icon: ClipboardList },
    { name: 'Students', href: '/teacher/students', icon: Users },
  ];

  const links = role === 'student' ? studentLinks : teacherLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getPageTitle = () => {
    return links.find(l => l.href === location.pathname)?.name || 'Portal';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      <div className="flex-1 flex">
        {/* Left Sidebar (Desktop) */}
        <aside className="w-60 bg-white border-r border-gray-200/80 flex flex-col hidden md:flex shrink-0">
          <div className="h-12 flex items-center px-4 border-b border-black/10 bg-brand-maroon text-white">
            <BookOpen className="w-4 h-4 text-white mr-2 shrink-0" />
            <span className="font-semibold text-xs tracking-wide uppercase truncate">Project Based Learning</span>
          </div>
          <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
            {links.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-xs font-medium rounded-md transition ${
                    isActive ? 'bg-brand-maroon text-white shadow-2xs font-semibold' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-2.5 flex-shrink-0 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-maroon'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-200/80 bg-gray-50/60 flex flex-col">
            <span className="text-xs font-semibold text-gray-800 truncate">{profile?.full_name}</span>
            <span className="text-[11px] text-gray-500 capitalize">{role === 'teacher' ? 'PBL Coordinator' : 'Student'} Account</span>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Dashboard Sub-header / Navigation Bar */}
          <div className="h-12 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-2xs">
            <div className="flex items-center">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden mr-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-sm font-semibold text-gray-800 truncate">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden lg:flex flex-col items-end mr-1">
                <span className="text-[11px] font-semibold text-brand-maroon leading-tight">JSPM's RSCOE</span>
                <span className="text-[10px] text-gray-500 leading-tight">Dept. of Computer Engineering</span>
              </div>
              <button className="text-gray-400 hover:text-brand-maroon p-1 transition" title="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <div className="h-5 w-px bg-gray-200"></div>
              <span className="text-xs font-medium text-gray-700 hidden sm:block truncate max-w-[140px]">{profile?.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50/80 border border-red-200/70 px-2.5 py-1 rounded transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Module Content */}
          <main className="flex-1 p-3 sm:p-5 lg:p-6">
            <div className="w-full max-w-[96%] xl:max-w-[94%] 2xl:max-w-[92%] mx-auto">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200/70 bg-white py-3 px-6 text-center">
            <p className="text-[11px] text-gray-500">
              © 2026–2027 Project Based Learning Portal · JSPM's Rajarshi Shahu College of Engineering, Pune
            </p>
          </footer>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-white shadow-xl flex flex-col z-10 h-full animate-in slide-in-from-left duration-200">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-brand-maroon text-white">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                <span className="font-bold text-sm truncate">PBL Portal</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-white/10 rounded-md transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {links.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                      isActive ? 'bg-brand-maroon text-white shadow-xs' : 'text-gray-600 hover:bg-red-50 hover:text-brand-maroon'
                    }`}
                  >
                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-maroon'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col">
              <span className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name}</span>
              <span className="text-xs text-gray-500 capitalize">{role === 'teacher' ? 'PBL Coordinator' : 'Student'} Account</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Icon to keep it self-contained
const BookOpenIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

