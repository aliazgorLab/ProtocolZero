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
  const [userReports, setUserReports] = useState([]);
  const [loadingUserReports, setLoadingUserReports] = useState(true);

  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        setLoadingUserReports(true);
        const res = await axiosInstance.get('/reports');
        if (res.data?.data) {
          // Filter reports belonging to current logged in user
          const myReports = res.data.data.filter(
            (r) => r.issuerId?._id === currentUser?._id || r.issuerId === currentUser?._id
          );
          setUserReports(myReports);
        }
      } catch (err) {
        console.error("Failed to load user reports:", err);
      } finally {
        setLoadingUserReports(false);
      }
    };

    if (currentUser) {
      fetchUserReports();
    }
  }, [currentUser]);

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
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' && currentUser?.gps?.coordinates) {
          setGpsActive(true);
        } else {
          setGpsActive(false);
        }
        
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

  const displayUser = {
    name: currentUser?.name || 'Protocol User',
    email: currentUser?.email || 'N/A',
    role: currentUser?.accountType || 'Citizen',
    status: currentUser?.verificationStatus === 'verified' ? 'Verified Account' : 'Standard Account',
    joined: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A',
    clearance: currentUser?.score !== undefined ? Math.floor(currentUser.score / 10) : 1,
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
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-surface to-background"></div>
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
            </div>

            {/* Name & Title */}
            <div className="pb-2">
              <h1 className="text-3xl font-black text-on-surface flex items-center gap-2">
                {displayUser.name}
                {displayUser.status === 'Verified Account' && (
                  <span className="material-symbols-outlined text-primary text-2xl" title="Verified">verified</span>
                )}
              </h1>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                {displayUser.role} • Lvl {displayUser.clearance} Clearance
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
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
          </div>
        </div>
        
        {/* Bio / Stats */}
        <div className="mt-2 text-sm text-on-surface">
          <div className="flex flex-wrap gap-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">calendar_month</span> Joined {displayUser.joined}</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">mail</span> {displayUser.email}</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">description</span> {userReports.length} Reports Submitted</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Column (Account Info & Settings) */}
        <div className="w-full md:w-[350px] shrink-0 space-y-4">
          
          <div className="bg-surface-container rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <div className="p-4 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold text-on-surface">Account Info</h2>
            </div>
            <div className="p-4 space-y-4 text-sm text-on-surface">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline shrink-0">badge</span>
                <span>Role: <strong className="font-bold">{displayUser.role}</strong></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline shrink-0">verified_user</span>
                <span>Status: <strong className="font-bold text-primary">{displayUser.status}</strong></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline shrink-0">my_location</span>
                <span>GPS Status: <strong className="font-bold">{gpsActive ? 'Synchronized' : 'Inactive'}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <div className="p-4 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold text-on-surface">Security & 2FA</h2>
            </div>
            <div className="divide-y divide-outline-variant/20 flex flex-col">
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

        {/* Right Column (Activity Log / Reports) */}
        <div className="flex-1 space-y-4">
          
          <CreateReportBox />
          
          <div className="bg-surface-container rounded-xl shadow-sm p-4 border border-outline-variant/30 mb-4">
            <h2 className="text-lg font-bold text-on-surface">My Incident Activity</h2>
          </div>

          {loadingUserReports ? (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[32px] mb-2">progress_activity</span>
              <p className="text-xs">Loading activity...</p>
            </div>
          ) : userReports.length === 0 ? (
            <div className="bg-surface-container rounded-xl p-8 text-center border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">history</span>
              <h3 className="font-bold text-on-surface">No Activity Recorded</h3>
              <p className="text-xs text-on-surface-variant mt-1">Reports submitted by you will appear here.</p>
            </div>
          ) : (
            userReports.map((report) => (
              <div 
                key={report._id || report.postId}
                className="bg-surface-container rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden"
              >
                <div className="p-4 flex items-start gap-3 border-b border-outline-variant/20">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">report</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Reported <span className="font-bold text-on-surface">{report.category}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-on-surface-variant">{report.description}</p>
                </div>
                <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
                  <button 
                    onClick={() => navigate(`/reports/${report.postId || report._id}`)}
                    className="bg-primary text-white text-xs font-bold uppercase px-3 py-1 rounded"
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
