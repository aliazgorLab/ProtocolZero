import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../features/auth/authSlice';
import axiosInstance from '../api/axiosInstance';
import CreateReportBox from '../components/CreateReportBox';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [toggling2FA, setToggling2FA] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const { user: currentUser } = useSelector((state) => state.auth);

  const handleToggle2FA = async () => {
    if (toggling2FA) return;
    setToggling2FA(true);
    try {
      const response = await axiosInstance.patch('/users/toggle-2fa');
      if (response.data.success) {
        dispatch(updateUser({ twoFactorEnabled: response.data.data.twoFactorEnabled }));
      }
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      alert(error.response?.data?.message || 'Failed to toggle 2FA settings.');
    } finally {
      setToggling2FA(false);
    }
  };

  const handleToggleGPS = () => {
    setGpsActive(!gpsActive);
    // Note: No backend integration, UI only
  };

  // Merge database user attributes with mock UI metrics
  const displayUser = {
    name: currentUser?.name || 'Guardian-1',
    role: currentUser?.accountType || 'Response Team',
    status: currentUser?.verificationStatus === 'verified' ? 'Verified Citizen' : 'Pending Verification',
    joined: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Oct 2023',
    clearance: currentUser?.score !== undefined ? Math.floor(currentUser.score / 10) : 9,
    reports: 124,
    upvotes: '2.1k',
    twoFactorEnabled: currentUser?.twoFactorEnabled || false
  };

  return (
    <div className="bg-surface-container-lowest min-h-screen pb-24">
      {/* Cover Photo Area */}
      <div className="h-48 md:h-64 w-full bg-surface-container-high relative overflow-hidden">
        {/* Placeholder Cover Image / Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-surface to-background"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        {/* Edit Cover Button (Visual only) */}
        <button className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-bold transition-colors">
          <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          <span className="hidden sm:inline">Edit Cover</span>
        </button>
      </div>

      {/* Profile Header Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative pb-6 border-b border-outline-variant/30">
        
        {/* Profile Picture & Main Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20 mb-4 relative z-10">
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            {/* Avatar */}
            <div className="relative group w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-surface-container-lowest bg-surface-container-low overflow-hidden shadow-lg shrink-0">
              <div className="w-full h-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-primary">person</span>
              </div>
              <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </button>
            </div>

            {/* Name & Title */}
            <div className="pb-2">
              <h1 className="text-3xl font-black text-on-surface flex items-center gap-2">
                {displayUser.name}
                {displayUser.status === 'Verified Citizen' && (
                  <span className="material-symbols-outlined text-primary text-2xl" title="Verified">verified</span>
                )}
              </h1>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                {displayUser.role} • Lvl {displayUser.clearance} Clearance
              </p>
            </div>
          </div>
          
          {/* Action Buttons (Right side on desktop, stacked on mobile) */}
          <div className="flex flex-col sm:flex-row gap-2 pb-2">
            <button 
              onClick={handleToggleGPS}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors active:scale-95 ${
                gpsActive 
                  ? 'bg-alert-red text-white hover:bg-red-600' 
                  : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{gpsActive ? 'location_off' : 'my_location'}</span>
              {gpsActive ? 'Stop GPS Broadcast' : 'Activate Live GPS'}
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit Profile
            </button>
          </div>
        </div>
        
        {/* Bio / Stats */}
        <div className="mt-2 text-sm text-on-surface">
          <p className="mb-4 text-on-surface-variant max-w-2xl">
            Official Responder stationed in Metro City. Dedicated to maintaining order and coordinating emergency response efforts during active incidents.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">calendar_month</span> Joined {displayUser.joined}</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">description</span> {displayUser.reports} Reports</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">thumb_up</span> {displayUser.upvotes} Upvotes</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Timeline style) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Column (About / Settings) */}
        <div className="w-full md:w-[350px] shrink-0 space-y-4">
          
          <div className="bg-surface-container rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <div className="p-4 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold text-on-surface">About</h2>
            </div>
            <div className="p-4 space-y-4 text-sm text-on-surface">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline shrink-0">work</span>
                <span>Works at <strong className="font-bold">Protocol Zero Response Unit</strong></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline shrink-0">location_on</span>
                <span>Lives in <strong className="font-bold">Metro City, Sector 4</strong></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline shrink-0">verified_user</span>
                <span>Clearance Level <strong className="font-bold text-primary">Alpha (Lvl {displayUser.clearance})</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <div className="p-4 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold text-on-surface">Account Settings</h2>
            </div>
            <div className="divide-y divide-outline-variant/20 flex flex-col">
              <Link to="#" className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">person_outline</span>
                  <span className="text-sm font-medium">Identity Verification</span>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </Link>
              <div className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">security</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Two-Factor OTP</span>
                  </div>
                </div>
                <button 
                  onClick={handleToggle2FA}
                  disabled={toggling2FA}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors min-w-[70px] text-center ${
                    displayUser.twoFactorEnabled 
                      ? 'bg-primary text-white hover:bg-primary/95' 
                      : 'bg-surface-container-highest text-on-surface hover:bg-outline-variant'
                  }`}
                >
                  {toggling2FA ? '...' : displayUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Activity Log / Posts) */}
        <div className="flex-1 space-y-4">
          
          <CreateReportBox />
          
          <div className="bg-surface-container rounded-xl shadow-sm p-4 border border-outline-variant/30 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-on-surface">Recent Activity</h2>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
              <button className="px-4 py-1.5 rounded-full bg-primary/10 text-primary">All Activity</button>
              <button className="px-4 py-1.5 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-low transition-colors">Reports</button>
              <button className="px-4 py-1.5 rounded-full bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-low transition-colors">Verifications</button>
            </div>
          </div>

          {/* Activity Log Item 1 */}
          <div className="bg-surface-container rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 flex items-start gap-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold text-on-surface">{displayUser.name}</span> filed a new report <span className="font-medium">INC-4029-A</span>
                </p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  14:30 HRS • <span className="material-symbols-outlined text-[12px]">public</span>
                </p>
              </div>
              <button className="p-1 rounded-full hover:bg-surface-container-highest text-on-surface-variant">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-base font-bold text-on-surface">Structural Integrity Compromised</h4>
                <span className="text-[10px] font-bold text-error bg-error-container px-2 py-0.5 rounded-sm uppercase tracking-widest">Critical</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-4">
                Sector 4, Main St. Initial assessments report severe structural damage post-seismic event. Area cordoned off. Backup requested for crowd control.
              </p>
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg h-32 flex items-center justify-center text-outline text-xs uppercase tracking-widest font-bold">
                [ Attachments Classified ]
              </div>
            </div>
            <div className="px-4 py-3 bg-surface-container-low flex justify-between items-center text-on-surface-variant text-sm font-medium border-t border-outline-variant/20">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span> 42
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span> 3
                </button>
              </div>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">share</span> Share
              </button>
            </div>
          </div>

          {/* Activity Log Item 2 */}
          <div className="bg-surface-container rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
             <div className="p-4 flex items-start gap-3 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold text-on-surface">{displayUser.name}</span> verified a route <span className="font-medium">LOG-2910-B</span>
                </p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  09:15 HRS • <span className="material-symbols-outlined text-[12px]">public</span>
                </p>
              </div>
              <button className="p-1 rounded-full hover:bg-surface-container-highest text-on-surface-variant">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-base font-bold text-on-surface">Evacuation Route Established</h4>
                <span className="text-[10px] font-bold text-primary bg-primary-container px-2 py-0.5 rounded-sm uppercase tracking-widest">Informational</span>
              </div>
              <p className="text-sm text-on-surface-variant">
                Zone 4 to Safe Haven Delta route cleared. Traffic diversion protocols active. Confirmed passable for heavy response vehicles.
              </p>
            </div>
            <div className="px-4 py-3 bg-surface-container-low flex justify-between items-center text-on-surface-variant text-sm font-medium border-t border-outline-variant/20">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">thumb_up</span> 156
                </button>
                <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span> 12
                </button>
              </div>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">share</span> Share
              </button>
            </div>
          </div>
          
          <div className="pt-4 flex justify-center">
             <button className="px-6 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-bold text-on-surface shadow-sm border border-outline-variant/30">
               Load More Activity
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
