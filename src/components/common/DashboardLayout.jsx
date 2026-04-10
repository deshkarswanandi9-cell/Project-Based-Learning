import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderOpen, PlusCircle, ClipboardList, Users, Bell, Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { role, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-md flex flex-col z-20 hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-brand-maroon">
          <BookOpenIcon className="w-6 h-6 text-white mr-2" />
          <span className="font-bold text-lg text-white truncate">Project Based Learning</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive ? 'bg-brand-maroon text-white' : 'text-gray-600 hover:bg-red-50'
                }`}
              >
                <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-maroon'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex flex-col">
          <span className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</span>
          <span className="text-xs text-gray-500 capitalize">{role === 'teacher' ? 'PBL Coordinator' : 'Student'} Account</span>
        </div>
      </div>

      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-10 md:left-64 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button className="md:hidden mr-2 p-1 text-gray-400 hover:text-gray-500 rounded-md">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-brand-maroon">JSPM's RSCOE</span>
            <span className="text-[10px] text-gray-400 leading-tight">Dept. of Computer Engineering</span>
          </div>
          <button className="text-gray-400 hover:text-brand-maroon relative">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          <span className="text-sm font-bold text-gray-700 hidden sm:block">{profile?.full_name}</span>
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-red-600 hover:text-red-800 ml-2"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 pt-14 min-h-screen flex flex-col relative">
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="border-t border-gray-200 bg-white py-5 px-6 text-center">
          <p className="text-xs text-gray-500 font-medium">
            © 2025–26 Project Based Learning Portal · JSPM's Rajarshi Shahu College of Engineering, Pune
          </p>
        </footer>
      </main>
    </div>
  );
}

// Inline Icon to keep it self-contained
const BookOpenIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
