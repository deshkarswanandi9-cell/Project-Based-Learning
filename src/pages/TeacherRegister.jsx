import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, ArrowLeft } from 'lucide-react';

export default function TeacherRegister() {
  const { register, handleSubmit, formState: { errors } } = useForm();
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <Link to="/teacher/login" className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-500 mb-4 self-start absolute top-8 left-8">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="h-14 flex items-center px-4">
            <BookOpen className="w-6 h-6 text-purple-600 mr-2" />
            <span className="font-bold text-lg text-gray-900">Project Based Learning</span>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            PBL Coordinator Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create an account to evaluate projects
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input
                    {...register("fullName", { required: "Required" })}
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    {...register("email", { required: "Required" })}
                    type="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    {...register("password", { required: "Required", minLength: 6 })}
                    type="password"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <div className="mt-1">
                  <select
                    {...register("department", { required: "Required" })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ISE">Information Science</option>
                    <option value="ECE">Electronics & Comm.</option>
                    <option value="ME">Mechanical</option>
                    <option value="CIVIL">Civil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year of Joining</label>
                <div className="mt-1">
                  <input
                    {...register("yearOfJoining", { required: "Required" })}
                    type="number"
                    min="1980"
                    max={new Date().getFullYear()}
                    defaultValue={new Date().getFullYear()}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
