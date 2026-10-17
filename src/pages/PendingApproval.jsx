import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, RefreshCw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PendingApproval() {
  const { profile, user, fetchProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleCheckStatus = async () => {
    if (!user?.id) return;
    setChecking(true);
    try {
      if (fetchProfile) {
        await fetchProfile(user.id);
      }
      toast.success('Account status rechecked');
    } catch {
      toast.error('Unable to verify status at this moment');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col justify-center items-center p-4 sm:py-12">
      <div className="max-w-lg w-full bg-white rounded-md shadow-2xs border border-gray-200/90 p-6 sm:p-8">
        <div className="flex items-center justify-center w-14 h-14 bg-amber-50 rounded-full mx-auto mb-4 border border-amber-200">
          <Clock className="w-7 h-7 text-amber-600 animate-pulse" />
        </div>

        <div className="text-center mb-6">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
            Pending Approval
          </span>
          <h2 className="text-xl font-bold text-gray-900">Faculty Account Pending Verification</h2>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            Welcome, <strong className="text-gray-800">{profile?.full_name || 'Faculty Member'}</strong>. Your PBL Coordinator account has been successfully registered and is waiting for administrator approval.
          </p>
        </div>

        <div className="bg-gray-50 rounded-md border border-gray-200/80 p-4 mb-6 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Registered Email</span>
            <span className="font-medium text-gray-800">{profile?.email || user?.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Department</span>
            <span className="font-medium text-gray-800">{profile?.department || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Year of Joining</span>
            <span className="font-medium text-gray-800">{profile?.year_of_joining || '—'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Access Status</span>
            <span className="font-semibold text-amber-700">Awaiting Admin Verification</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-md p-3 mb-6 flex items-start gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p className="leading-relaxed">
            For security, new faculty coordinators must be verified by the Department PBL Coordinator or System Administrator before project access is enabled.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-maroon hover:bg-[#6e2e2e] text-white text-xs sm:text-sm font-semibold rounded-md shadow-2xs transition disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Check Approval Status'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-md transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
