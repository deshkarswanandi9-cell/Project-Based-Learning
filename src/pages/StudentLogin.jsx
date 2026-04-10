import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowLeft, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS, YEARS, SEMESTERS, ACADEMIC_YEARS } from '../utils/constants';
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
          className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}

export default function StudentLogin() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { studentLogin, studentRegister } = useAuth();

  const { register: regLogin, handleSubmit: handleLogin, getValues: getLoginValues, formState: { errors: logErrors } } = useForm();
  const savedDraft = JSON.parse(sessionStorage.getItem('studentSignupDraft'));

  const { register: regSignup, handleSubmit: handleSignup, watch, formState: { errors: sigErrors } } = useForm({
    defaultValues: savedDraft || {
      fullName: '', email: '', rollNumber: '', rbtNumber: '', phone: '',
      department: '', year: '', semester: '', academic_year: ''
    }
  });

  const signupValues = watch();
  React.useEffect(() => {
    // Only save harmless data, avoid saving passwords
    const draft = { ...signupValues };
    delete draft.password;
    delete draft.confirmPassword;
    sessionStorage.setItem('studentSignupDraft', JSON.stringify(draft));
  }, [signupValues]);

  const signupPassword = watch('password');

  const onLogin = async (data) => {
    setLoading(true);
    try {
      await studentLogin(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data) => {
    setLoading(true);
    try {
      await studentRegister(data);
      toast.success('Welcome ' + data.fullName + '! Account created.');
      sessionStorage.removeItem('studentSignupDraft'); // Clear draft on success
      navigate('/student/dashboard');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── NAVBAR ── */}
      <header className="bg-brand-maroon shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <BookOpen className="w-6 h-6 text-white" />
            <span className="font-bold text-white text-lg tracking-tight">Project Based Learning</span>
          </Link>
          <span className="text-sm font-medium text-red-100 hidden sm:block">JSPM's RSCOE · Department of Computer Engineering</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:py-12">
      <div className={`w-full bg-white rounded-xl shadow-md border border-gray-200 p-8 relative transition-all duration-300 ${tab === 'login' ? 'max-w-md' : 'max-w-2xl'}`}>
        <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-brand-maroon flex items-center text-sm font-medium gap-1 transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Header */}
        <div className="text-center mt-6 mb-8">
          <div className="w-16 h-16 bg-brand-maroon/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-maroon/20">
            <GraduationCap className="w-8 h-8 text-brand-maroon" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-maroon">
            {tab === 'login' ? 'Student Login' : 'Student Registration'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'login' ? 'Access your project portal' : 'Create an account to submit your project'}
          </p>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-7">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${tab === 'login' ? 'bg-white text-brand-maroon shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${tab === 'register' ? 'bg-white text-brand-maroon shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Register
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        <form onSubmit={handleLogin(onLogin)} className={`space-y-5 ${tab === 'login' ? 'block' : 'hidden'}`}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              {...regLogin('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="student@college.edu"
            />
            {logErrors.email && <span className="text-red-500 text-xs mt-1 block">{logErrors.email.message || 'Invalid format'}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <PasswordInput
              registration={regLogin('password', { required: 'Password is required', minLength: 6 })}
              error={logErrors.password?.message || (logErrors.password ? 'Min 6 chars' : '')}
            />
          </div>

          {/* Forgot password */}
          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-maroon hover:bg-[#6e2e2e] text-white font-bold rounded-xl shadow transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login as Student'}
          </button>
        </form>

        {/* ── REGISTER FORM ── */}
        <form onSubmit={handleSignup(onSignup)} className={`space-y-5 ${tab === 'register' ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                {...regSignup('fullName', { required: 'Full name is required' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Your full name"
              />
              {sigErrors.fullName && <span className="text-red-500 text-xs mt-1 block">{sigErrors.fullName.message}</span>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                {...regSignup('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="student@college.edu"
              />
              {sigErrors.email && <span className="text-red-500 text-xs mt-1 block">{sigErrors.email.message || 'Invalid format'}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number</label>
              <input
                {...regSignup('rollNumber', { required: 'Roll number is required' })}
                placeholder="e.g. CS2343"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              {sigErrors.rollNumber && <span className="text-red-500 text-xs mt-1 block">{sigErrors.rollNumber.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">RBT Number</label>
              <input
                {...regSignup('rbtNumber', { required: 'RBT number is required' })}
                placeholder="e.g. RBT24CS184"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              {sigErrors.rbtNumber && <span className="text-red-500 text-xs mt-1 block">{sigErrors.rbtNumber.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
              <select
                {...regSignup('department', { required: 'Department is required' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {sigErrors.department && <span className="text-red-500 text-xs mt-1 block">{sigErrors.department.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
              <select
                {...regSignup('year', { required: 'Year is required' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="">Select...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {sigErrors.year && <span className="text-red-500 text-xs mt-1 block">{sigErrors.year.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
              <select
                {...regSignup('semester', { required: 'Semester is required' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="">Select...</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {sigErrors.semester && <span className="text-red-500 text-xs mt-1 block">{sigErrors.semester.message}</span>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
              <select
                {...regSignup('academic_year', { required: 'Academic year is required' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="">Select...</option>
                {ACADEMIC_YEARS.map(ay => <option key={ay} value={ay}>{ay}</option>)}
              </select>
              {sigErrors.academic_year && <span className="text-red-500 text-xs mt-1 block">{sigErrors.academic_year.message}</span>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                {...regSignup('phone', {
                  required: 'Phone is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be exactly 10 digits' }
                })}
                placeholder="10 digit number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              {sigErrors.phone && <span className="text-red-500 text-xs mt-1 block">{sigErrors.phone.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <PasswordInput
                registration={regSignup('password', { 
                  required: 'Password is required', 
                  minLength: { value: 8, message: 'Min 8 chars' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Need upper, lower, number & special char'
                  }
                })}
                error={sigErrors.password?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <PasswordInput
                registration={regSignup('confirmPassword', {
                  required: 'Confirm your password',
                  validate: value => value === signupPassword || 'Passwords do not match'
                })}
                error={sigErrors.confirmPassword?.message}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-brand-maroon hover:bg-[#6e2e2e] text-white font-bold rounded-xl shadow transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register as Student'}
          </button>
        </form>
      </div>
      </div>
      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-white py-5 px-6 text-center">
        <p className="text-xs text-gray-500 font-medium">
          © 2025–26 Project Based Learning Portal · JSPM's Rajarshi Shahu College of Engineering, Pune
        </p>
      </footer>
    </div>
  );
}
