import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import CollegeHeader     from './components/common/CollegeHeader';
import Landing           from './pages/Landing';
import StudentLogin      from './pages/StudentLogin';
import TeacherLogin      from './pages/TeacherLogin';
import PendingApproval   from './pages/PendingApproval';
import StudentDashboard  from './pages/student/Dashboard';
import RegisterProject   from './pages/student/RegisterProject';
import MyProject         from './pages/student/MyProject';
import TeacherDashboard  from './pages/teacher/Dashboard';
import ProjectMonitoring from './pages/teacher/ProjectMonitoring';
import StudentsList      from './pages/teacher/StudentsList';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-brand-maroon font-semibold text-base">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role === 'unapproved_teacher') return <Navigate to="/pending-approval" replace />;
  if (requiredRole && role !== requiredRole) {
    if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    if (role === 'unapproved_teacher') return <Navigate to="/pending-approval" replace />;
    if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  }
  return children;
};

const PendingApprovalRoute = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-brand-maroon font-semibold text-base">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <PendingApproval />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <CollegeHeader />
          <div className="flex-1 flex flex-col min-h-0">
            <Routes>
              <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/student/login" element={<PublicRoute><StudentLogin /></PublicRoute>} />
              <Route path="/student/register" element={<PublicRoute><StudentLogin /></PublicRoute>} />
              <Route path="/teacher/login" element={<PublicRoute><TeacherLogin /></PublicRoute>} />
              <Route path="/teacher/register" element={<PublicRoute><TeacherLogin /></PublicRoute>} />
              <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="/pending-approval" element={<PendingApprovalRoute />} />
              
              <Route path="/student/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/project/register" element={<ProtectedRoute requiredRole="student"><RegisterProject /></ProtectedRoute>} />
              <Route path="/student/project/my" element={<ProtectedRoute requiredRole="student"><MyProject /></ProtectedRoute>} />
              
              <Route path="/teacher/dashboard" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/report" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/reports" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/monitoring" element={<ProtectedRoute requiredRole="teacher"><ProjectMonitoring /></ProtectedRoute>} />
              <Route path="/teacher/students" element={<ProtectedRoute requiredRole="teacher"><StudentsList /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

