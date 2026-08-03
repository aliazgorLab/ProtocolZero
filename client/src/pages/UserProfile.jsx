import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser, updateLiveLocation } from '../features/auth/authSlice';
import axiosInstance from '../api/axiosInstance';
import CreateReportBox from '../components/CreateReportBox';
import { useToast } from '../context/ToastContext';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [toggling2FA, setToggling2FA] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [resources, setResources] = useState([
    { name: 'Fire Trucks', quantity: 3, unit: 'units' },
    { name: 'Water Hoses', quantity: 10, unit: 'units' }
  ]);
  const [isEditingResources, setIsEditingResources] = useState(false);

  const { user: currentUser } = useSelector((state) => state.auth);

  const handleToggle2FA = async () => {
    if (toggling2FA) return;
    setToggling2FA(true);
    try {
      const response = await axiosInstance.patch('/users/toggle-2fa');
      if (response.data.success) {
        dispatch(updateUser({ twoFactorEnabled: response.data.data.twoFactorEnabled }));
        showToast("Two-Factor Authentication setting updated!", "success");
      }
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      showToast(error.response?.data?.message || 'Failed to toggle 2FA settings.', "error");
    } finally {
      setToggling2FA(false);
    }
  };

  useEffect(() => {
    // Check permission state on mount and update local state
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' && currentUser?.gps?.coordinates) {
          setGpsActive(true);
        } else {
          setGpsActive(false);
        }
        
        // Listen for permission changes
        result.onchange = () => {
          if (result.state === 'granted' && currentUser?.gps?.coordinates) {
            setGpsActive(true);
          } else {
            setGpsActive(false);
          }
        };
      });
    } else {
      setGpsActive(Boolean(currentUser?.gps?.coordinates));
    }
  }, [currentUser]);

  const handleToggleGPS = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "warning");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const gps = {
          type: "Point",
          coordinates: [lng, lat]
        };
        try {
          await dispatch(updateLiveLocation(gps)).unwrap();
          setGpsActive(true);
          showToast("GPS Location successfully updated and saved to your profile!", "success");
        } catch (err) {
          console.error("Failed to update live location:", err);
          showToast("Location fetched, but failed to save to server.", "error");
        }
      },
      (error) => {
        console.error("Location access denied or failed", error);
        setGpsActive(false);
        if (error.code === error.PERMISSION_DENIED) {
          showToast("Location access was denied. Please allow location access in your browser settings.", "warning");
        } else {
          showToast("Could not retrieve location. Please check your GPS signal.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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

  const isResponseTeam = displayUser.role === 'Response Team' || displayUser.role === 'ResponseTeam';

  const addResource = () => setResources([...resources, { name: '', quantity: '', unit: '' }]);
  const updateResource = (idx, field, val) => {
    setResources(resources.map((res, i) => i === idx ? { ...res, [field]: val } : res));
  };
  const removeResource = (idx) => setResources(resources.filter((_, i) => i !== idx));

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
                  ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/80' 
                  : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{gpsActive ? 'my_location' : 'location_disabled'}</span>
              {gpsActive ? 'Update Live GPS' : 'Activate Live GPS'}
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

          {/* Response Team Resources Section */}
          {isResponseTeam && (
            <div className="bg-surface-container rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
              <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">inventory</span>
                  <h2 className="text-lg font-bold text-on-surface">Available Resources</h2>
                </div>
                <button 
                  onClick={() => setIsEditingResources(!isEditingResources)}
                  className="text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  {isEditingResources ? 'Save' : 'Edit'}
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                {!isEditingResources ? (
                  resources.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {resources.map((res, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                          <span className="font-bold text-sm text-on-surface">{res.name}</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                            {res.quantity} {res.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant font-medium italic text-center">No resources listed.</p>
                  )
                ) : (
                  <div className="flex flex-col gap-3">
                    {resources.map((res, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={res.name}
                          onChange={(e) => updateResource(i, 'name', e.target.value)}
                          placeholder="Item"
                          className="flex-1 min-w-0 rounded border border-primary/30 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                        />
                        <input
                          type="number"
                          value={res.quantity}
                          onChange={(e) => updateResource(i, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-14 shrink-0 rounded border border-primary/30 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary text-center"
                        />
                        <button 
                          onClick={() => removeResource(i)}
                          className="text-alert-red hover:bg-alert-red/10 p-1.5 rounded"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={addResource}
                      className="w-full flex items-center justify-center gap-1 text-xs font-bold uppercase text-primary border border-primary/30 border-dashed rounded-lg py-2 hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Resource
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
