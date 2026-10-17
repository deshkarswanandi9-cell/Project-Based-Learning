import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../utils/constants';
import { supabase } from '../lib/supabase';

// Reusable password input with show/hide toggle
function PasswordInput({ registration, placeholder = '••••••••', error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          {...registration}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none text-xs sm:text-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}

export default function TeacherLogin() {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();
  const { teacherLogin, teacherRegister } = useAuth();

  const { register: registerLogin, handleSubmit: handleSubmitLogin, getValues: getLoginValues, formState: { errors: errorsLogin } } = useForm();
  const { register: registerSignup, handleSubmit: handleSubmitSignup, watch: watchSignup, formState: { errors: errorsSignup } } = useForm();

  const [loading, setLoading] = useState(false);
  const passwordSignup = watchSignup('password');

  const onLoginSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await teacherLogin(data.email, data.password);
      if (result?.teacher && !result.teacher.is_approved) {
        toast('Faculty account pending administrator verification.', { icon: '⏳' });
        navigate('/pending-approval');
      } else {
        toast.success('Welcome back, Coordinator!');
        navigate('/teacher/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data) => {
    setLoading(true);
    try {
      await teacherRegister(data);
      toast.success('Registration submitted! Your faculty account requires administrator approval before activation.', { duration: 6000 });
      setActiveTab('login');
    } catch (error) {
      toast.error(error.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getLoginValues('email');
    if (!email) { toast.error('Please enter your email address first'); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      toast.success('Password reset email sent! Check your inbox.');
    } catch (e) {
      toast.error(e.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:py-10">
        <div className="max-w-md w-full bg-white rounded-md shadow-2xs border border-gray-200/90 p-6 sm:p-8 relative">
          <Link to="/" className="absolute top-5 left-5 text-gray-400 hover:text-brand-maroon flex items-center text-xs font-medium gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>

          {/* Header */}
          <div className="text-center mt-3 mb-6">
            <div className="w-12 h-12 bg-brand-maroon/10 rounded-md flex items-center justify-center mx-auto mb-3 border border-brand-maroon/20">
              <BookOpen className="w-6 h-6 text-brand-maroon" />
            </div>
            <h2 className="text-xl font-bold text-brand-maroon">PBL Coordinator Portal</h2>
            <p className="text-xs text-gray-500 mt-1">Project Based Learning — Faculty &amp; Coordinator Access</p>
          </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5">
          <button
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${activeTab === 'login' ? 'border-brand-maroon text-brand-maroon' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${activeTab === 'register' ? 'border-brand-maroon text-brand-maroon' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {/* LOGIN FORM */}
        <div className={activeTab === 'login' ? 'block' : 'hidden'}>
          <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                {...registerLogin('email', { required: 'Email is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none text-xs sm:text-sm"
                placeholder="teacher@college.edu"
              />
              {errorsLogin.email && <span className="text-red-500 text-xs mt-1 block">{errorsLogin.email.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <PasswordInput
                registration={registerLogin('password', { required: 'Password is required' })}
                error={errorsLogin.password?.message}
              />
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-brand-maroon hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-maroon hover:bg-[#6e2e2e] text-white text-xs sm:text-sm font-semibold rounded-md shadow-2xs transition disabled:opacity-70 mt-1"
            >
              {loading ? 'Logging in...' : 'Login as PBL Coordinator'}
            </button>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div className={activeTab === 'register' ? 'block' : 'hidden'}>
          <form onSubmit={handleSubmitSignup(onRegisterSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                {...registerSignup('fullName', { required: 'Required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none text-xs sm:text-sm"
                placeholder="Prof. Full Name"
              />
              {errorsSignup.fullName && <span className="text-red-500 text-xs mt-1 block">{errorsSignup.fullName.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...registerSignup('email', { required: 'Required', pattern: /^\S+@\S+$/i })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none text-xs sm:text-sm"
                placeholder="teacher@college.edu"
              />
              {errorsSignup.email && <span className="text-red-500 text-xs mt-1 block">{errorsSignup.email.message || 'Invalid format'}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                <select
                  {...registerSignup('department', { required: 'Required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none bg-white text-xs sm:text-sm"
                >
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errorsSignup.department && <span className="text-red-500 text-xs mt-1 block">{errorsSignup.department.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Year of Joining</label>
                <input
                  type="number"
                  {...registerSignup('yearOfJoining', {
                    required: 'Required',
                    min: { value: 1980, message: 'Invalid year' },
                    max: { value: new Date().getFullYear(), message: 'Cannot be future' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon outline-none text-xs sm:text-sm"
                  placeholder="e.g. 2018"
                />
                {errorsSignup.yearOfJoining && <span className="text-red-500 text-xs mt-1 block">{errorsSignup.yearOfJoining.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <PasswordInput
                registration={registerSignup('password', { 
                  required: 'Required', 
                  minLength: { value: 8, message: 'Min 8 chars' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Need upper, lower, number & special char'
                  }
                })}
                error={errorsSignup.password?.message}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
              <PasswordInput
                registration={registerSignup('confirmPassword', {
                  required: 'Confirm password',
                  validate: value => value === passwordSignup || 'Passwords do not match'
                })}
                error={errorsSignup.confirmPassword?.message}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-maroon hover:bg-[#6e2e2e] text-white text-xs sm:text-sm font-semibold rounded-md shadow-2xs transition disabled:opacity-70 mt-3"
            >
              {loading ? 'Creating Account...' : 'Create PBL Coordinator Account'}
            </button>
          </form>
        </div>
      </div>
      </div>
      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-white py-5 px-6 text-center">
        <p className="text-xs text-gray-500 font-medium">
          © 2026–2027 Project Based Learning Portal · JSPM's Rajarshi Shahu College of Engineering, Pune
        </p>
      </footer>
    </div>
  );
}
