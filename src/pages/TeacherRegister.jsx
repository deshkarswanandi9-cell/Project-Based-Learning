import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, ArrowLeft, BookOpen } from 'lucide-react';

export default function TeacherRegister() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { error: dbError } = await supabase.from('teachers').insert([
          {
            user_id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
            department: data.department,
            year_of_joining: parseInt(data.yearOfJoining),
            is_approved: false // Default to false until admin approval context
          }
        ]);

        if (dbError) throw dbError;
      }

      navigate('/teacher');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <Link to="/teacher/login" className="flex items-center text-xs font-medium text-brand-maroon hover:underline mb-4 self-start absolute top-6 left-6">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Login
          </Link>
          <div className="w-12 h-12 bg-brand-maroon/10 rounded-md flex items-center justify-center mb-3 border border-brand-maroon/20">
            <BookOpen className="w-6 h-6 text-brand-maroon" />
          </div>
          <h2 className="text-center text-xl font-bold text-brand-maroon">
            PBL Coordinator Registration
          </h2>
          <p className="mt-1 text-center text-xs text-gray-500">
            Create an institutional account to evaluate projects
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 px-4 shadow-2xs sm:rounded-md sm:px-8 border border-gray-200/90">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {errorMsg && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-md text-xs border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <div>
                  <input
                    {...register("fullName", { required: "Required" })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-2xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div>
                  <input
                    {...register("email", { required: "Required" })}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-2xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div>
                  <input
                    {...register("password", { required: "Required", minLength: 6 })}
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-2xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                <div>
                  <select
                    {...register("department", { required: "Required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-2xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon text-xs sm:text-sm"
                  >
                    <option value="">Select Department...</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecomm.">Electronics & Telecomm.</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Year of Joining</label>
                <div>
                  <input
                    {...register("yearOfJoining", { required: "Required" })}
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    defaultValue={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-2xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-maroon focus:border-brand-maroon text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-2xs text-xs sm:text-sm font-semibold text-white bg-brand-maroon hover:bg-[#6e2e2e] focus:outline-none transition disabled:opacity-50 mt-2"
                >
                  {loading ? 'Registering...' : 'Register as PBL Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
