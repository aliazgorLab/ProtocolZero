import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { logout, updateUser, updateLiveLocation } from '../features/auth/authSlice';
import axiosInstance from '../api/axiosInstance';
import CreateReportBox from '../components/CreateReportBox';
import { useToast } from '../context/ToastContext';
import { RESOURCE_TAXONOMY } from '../constants/resources';

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [toggling2FA, setToggling2FA] = useState(false);
  const [togglingVolunteer, setTogglingVolunteer] = useState(false);
  const [savingAddresses, setSavingAddresses] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  // Address & Map State
  const [homeAddress, setHomeAddress] = useState(currentUser?.homeAddress || '');
  const [homeCoords, setHomeCoords] = useState(() => {
    if (currentUser?.homeAddressGps?.coordinates) {
      return { lat: currentUser.homeAddressGps.coordinates[1], lng: currentUser.homeAddressGps.coordinates[0] };
    }
    return { lat: 22.3569, lng: 91.7832 }; // Default Chittagong
  });

  const [currentAddress, setCurrentAddress] = useState(currentUser?.currentAddress || '');
  const [currentCoords, setCurrentCoords] = useState(() => {
    if (currentUser?.currentAddressGps?.coordinates || currentUser?.gps?.coordinates) {
      const coords = currentUser?.currentAddressGps?.coordinates || currentUser?.gps?.coordinates;
      return { lat: coords[1], lng: coords[0] };
    }
    return { lat: 22.3569, lng: 91.7832 };
  });

  const [activeAddressTab, setActiveAddressTab] = useState('home'); // 'home' or 'current'

  // Volunteer / ResponseTeam Inventory State
  const [inventory, setInventory] = useState(() => {
    if (Array.isArray(currentUser?.inventory) && currentUser.inventory.length > 0) {
      return currentUser.inventory;
    }
    return [{ itemId: RESOURCE_TAXONOMY[0].id, quantity: 1, unit: RESOURCE_TAXONOMY[0].defaultUnit }];
  });

  const [userReports, setUserReports] = useState([]);
  const [loadingUserReports, setLoadingUserReports] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        setLoadingUserReports(true);
        const res = await axiosInstance.get('/reports');
        if (res.data?.data) {
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
      setHomeAddress(currentUser.homeAddress || '');
      setCurrentAddress(currentUser.currentAddress || '');
      if (currentUser.homeAddressGps?.coordinates) {
        setHomeCoords({ lat: currentUser.homeAddressGps.coordinates[1], lng: currentUser.homeAddressGps.coordinates[0] });
      }
      if (currentUser.currentAddressGps?.coordinates || currentUser.gps?.coordinates) {
        const coords = currentUser.currentAddressGps?.coordinates || currentUser.gps?.coordinates;
        setCurrentCoords({ lat: coords[1], lng: coords[0] });
      }
      if (Array.isArray(currentUser.inventory) && currentUser.inventory.length > 0) {
        setInventory(currentUser.inventory);
      }
    }
  }, [currentUser]);

  // Handle 2FA Toggle
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

  // Handle Role Mode Toggle (User <-> Volunteer)
  const handleToggleVolunteerMode = async () => {
    if (togglingVolunteer) return;
    setTogglingVolunteer(true);
    try {
      const res = await axiosInstance.patch('/users/toggle-volunteer');
      if (res.data?.success && res.data?.data) {
        dispatch(updateUser({ accountType: res.data.data.accountType }));
        showToast(res.data.message || "Volunteer status updated!", "success");
      }
    } catch (err) {
      console.error("Volunteer toggle failed:", err);
      showToast(err.response?.data?.message || "Failed to toggle volunteer mode.", "error");
    } finally {
      setTogglingVolunteer(false);
    }
  };

  // Handle Map Pin Click
  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (activeAddressTab === 'home') {
      setHomeCoords({ lat, lng });
      setHomeAddress(`GeoPin: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      showToast("Home address coordinates pinned on map.", "info");
    } else {
      setCurrentCoords({ lat, lng });
      setCurrentAddress(`GeoPin: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      showToast("Current address coordinates pinned on map.", "info");
    }
  };

  // Save Addresses
  const handleSaveAddresses = async (e) => {
    e.preventDefault();
    setSavingAddresses(true);
    try {
      const payload = {
        homeAddress,
        homeAddressGps: { type: 'Point', coordinates: [homeCoords.lng, homeCoords.lat] },
        currentAddress,
        currentAddressGps: { type: 'Point', coordinates: [currentCoords.lng, currentCoords.lat] },
        gps: { type: 'Point', coordinates: [currentCoords.lng, currentCoords.lat] }
      };

      const res = await axiosInstance.patch('/users/profile', payload);
      if (res.data?.success && res.data?.data) {
        dispatch(updateUser(res.data.data));
        showToast("Home and Current addresses saved successfully!", "success");
      }
    } catch (err) {
      console.error("Save addresses failed:", err);
      showToast(err.response?.data?.message || "Failed to save profile addresses.", "error");
    } finally {
      setSavingAddresses(false);
    }
  };

  // Inventory Management
  const addInventoryItem = () => {
    const defaultTax = RESOURCE_TAXONOMY[0];
    setInventory([...inventory, { itemId: defaultTax.id, quantity: 1, unit: defaultTax.defaultUnit }]);
  };

  const updateInventoryItem = (index, field, value) => {
    setInventory(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      if (field === 'itemId') {
        const tax = RESOURCE_TAXONOMY.find(t => t.id === value) || RESOURCE_TAXONOMY[0];
        return { ...item, itemId: value, unit: tax.defaultUnit };
      }
      return { ...item, [field]: value };
    }));
  };

  const removeInventoryItem = (index) => {
    setInventory(inventory.filter((_, idx) => idx !== index));
  };

  const handleSaveInventory = async () => {
    setSavingInventory(true);
    try {
      const formattedItems = inventory.map(item => {
        const tax = RESOURCE_TAXONOMY.find(t => t.id === (item.itemId || item.id)) || RESOURCE_TAXONOMY[0];
        return {
          itemId: tax.id,
          itemName: tax.name,
          category: tax.category,
          quantity: Math.max(1, Number(item.quantity) || 1),
          unit: tax.defaultUnit
        };
      });

      const res = await axiosInstance.patch('/users/profile', { inventory: formattedItems });
      if (res.data?.success && res.data?.data) {
        dispatch(updateUser({ inventory: res.data.data.inventory }));
        showToast("Inventory stock updated!", "success");
      }
    } catch (err) {
      console.error("Inventory save failed:", err);
      showToast(err.response?.data?.message || "Failed to save inventory stock.", "error");
    } finally {
      setSavingInventory(false);
    }
  };

  // Sync Live GPS
  const handleToggleGPS = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "warning");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentCoords({ lat, lng });
        setCurrentAddress(`Current GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);

        const gps = { type: "Point", coordinates: [lng, lat] };
        try {
          await dispatch(updateLiveLocation(gps)).unwrap();
          setGpsActive(true);
          showToast("Live GPS coordinates updated and saved!", "success");
        } catch (err) {
          console.error("Failed to update live location:", err);
          showToast("Location fetched, but server save failed.", "error");
        }
      },
      (error) => {
        console.error("Location access denied or failed", error);
        setGpsActive(false);
        showToast("Could not retrieve GPS location.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const accountType = currentUser?.accountType || 'User';
  const verificationStatus = currentUser?.verificationStatus || 'unverified';
  const userScore = currentUser?.score || 0;
  const isFlagged = userScore <= -40;
  const isVolunteer = accountType === 'Volunteer';
  const isCitizenOrVolunteer = ['User', 'Volunteer'].includes(accountType);
  const isVolunteerOrResponse = ['Volunteer', 'ResponseTeam', 'Admin', 'SuperAdmin'].includes(accountType);

  return (
    <div className="bg-surface-container-lowest min-h-screen pb-24 text-on-surface">
      
      {/* Cover Photo Header */}
      <div className="h-44 md:h-60 w-full bg-surface-container-high relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-surface to-background"></div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative pb-6 border-b border-outline-variant/30">
        
        {/* Profile Picture & Identity Card */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20 mb-4 relative z-10">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="relative group w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-surface-container-lowest bg-surface-container-low overflow-hidden shadow-xl shrink-0">
              <div className="w-full h-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-primary">person</span>
              </div>
            </div>

            <div className="pb-2 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black text-on-surface">{currentUser?.name || 'Protocol Zero User'}</h1>
                
                {/* Verification Status Chip */}
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                  verificationStatus === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : verificationStatus === 'pending'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {verificationStatus.toUpperCase()}
                </span>
              </div>

              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {accountType} • {currentUser?.email || 'N/A'} • {currentUser?.phone || 'No Phone'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pb-2">
            <button 
              onClick={handleToggleGPS}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer ${
                gpsActive 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{gpsActive ? 'my_location' : 'location_disabled'}</span>
              {gpsActive ? 'GPS Active (Sync)' : 'Sync Live GPS'}
            </button>
          </div>
        </div>

        {/* Low-Trust Warning Banner */}
        {isFlagged && (
          <div className="mt-4 rounded-2xl bg-rose-950 text-rose-100 p-4 border border-rose-800 flex items-center gap-3 shadow-lg">
            <span className="material-symbols-outlined text-rose-400 text-3xl shrink-0">warning</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-rose-400">Account Reliability Flagged ({userScore})</p>
              <p className="text-xs text-rose-200 mt-0.5 font-medium leading-relaxed">
                Your reliability score has dropped below -40 due to unverified or false incident reports. Your account is flagged for moderator audit.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid Content Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        
        <div className="space-y-6">
          
          {/* Saved Addresses Card (Interactive Google Map) */}
          <article className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">home_pin</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Saved Locations & Addresses</h3>
                  <p className="text-xs text-on-surface-variant">Set your Home Address and Current Address for emergency dispatch</p>
                </div>
              </div>

              <div className="flex gap-1 bg-surface-container p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveAddressTab('home')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    activeAddressTab === 'home' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  🏠 Home
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAddressTab('current')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    activeAddressTab === 'current' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  📍 Current
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAddresses} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    🏠 Home Address Text
                  </label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="Enter permanent home address..."
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs font-medium text-on-surface outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    Coordinates: [{homeCoords.lng.toFixed(5)}, {homeCoords.lat.toFixed(5)}]
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    📍 Current Address Text
                  </label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="Enter current location address..."
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs font-medium text-on-surface outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    Coordinates: [{currentCoords.lng.toFixed(5)}, {currentCoords.lat.toFixed(5)}]
                  </span>
                </div>
              </div>

              {/* Interactive Google Map Picker */}
              <div className="h-64 bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden relative shadow-inner">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={activeAddressTab === 'home' ? homeCoords : currentCoords}
                    zoom={15}
                    onClick={handleMapClick}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                  >
                    <Marker
                      position={homeCoords}
                      title="Home Address"
                      label={{ text: "🏠 HOME", color: "#ffffff", fontWeight: "bold", fontSize: "10px" }}
                    />
                    <Marker
                      position={currentCoords}
                      title="Current Location"
                      label={{ text: "📍 CURRENT", color: "#ffffff", fontWeight: "bold", fontSize: "10px" }}
                    />
                  </GoogleMap>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
                    Loading map picker...
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none">
                  Click map to set {activeAddressTab === 'home' ? 'Home (🏠)' : 'Current (📍)'} Pin
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingAddresses}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingAddresses ? 'Saving...' : 'Save Locations'}
                </button>
              </div>
            </form>
          </article>

          {/* Volunteer & Response Team Inventory Card */}
          {isVolunteerOrResponse && (
            <article className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">inventory</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Emergency Stock & Inventory</h3>
                    <p className="text-xs text-on-surface-variant">Manage available supplies ready for field deployment</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addInventoryItem}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {inventory.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 italic">
                    No emergency supplies currently listed in your inventory.
                  </p>
                ) : (
                  inventory.map((item, idx) => {
                    const currentTax = RESOURCE_TAXONOMY.find(t => t.id === (item.itemId || item.id)) || RESOURCE_TAXONOMY[0];
                    return (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30">
                        <select
                          value={item.itemId || currentTax.id}
                          onChange={(e) => updateInventoryItem(idx, 'itemId', e.target.value)}
                          className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
                        >
                          {RESOURCE_TAXONOMY.map((tItem) => (
                            <option key={tItem.id} value={tItem.id}>
                              [{tItem.category}] {tItem.name}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity || 0}
                            onChange={(e) => updateInventoryItem(idx, 'quantity', Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary text-center"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 px-2 py-2 rounded-lg shrink-0">
                            {currentTax.defaultUnit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeInventoryItem(idx)}
                          className="p-2 text-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    );
                  })
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={savingInventory}
                    onClick={handleSaveInventory}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingInventory ? 'Saving Stock...' : 'Save Inventory Stock'}
                  </button>
                </div>
              </div>
            </article>
          )}

          {/* User Submitted Incidents */}
          <article className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-4">My Submitted Incident Activity</h3>
            {loadingUserReports ? (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[32px] mb-2 text-primary">progress_activity</span>
                <p className="text-xs font-bold">Loading activity...</p>
              </div>
            ) : userReports.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 italic">
                No incidents submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {userReports.map((report) => (
                  <div key={report._id || report.postId} className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{report.category} Incident</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{report.description}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/reports/${report.postId || report._id}`)}
                      className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold uppercase rounded-xl hover:bg-primary/90 transition shrink-0 cursor-pointer"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Right Sidebar (Role Toggle & Security) */}
        <aside className="space-y-6">
          
          {/* Volunteer Mode Toggle Card */}
          {isCitizenOrVolunteer && (
            <article className="bg-surface border border-primary/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">volunteer_activism</span>
                <h3 className="text-base font-bold text-on-surface">Volunteer Mode</h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                Opt-in to receive broadcast emergency alerts and respond to regional incidents in real time.
              </p>

              <button
                type="button"
                disabled={togglingVolunteer}
                onClick={handleToggleVolunteerMode}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  isVolunteer
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isVolunteer ? 'person_remove' : 'front_hand'}
                </span>
                {togglingVolunteer
                  ? 'Updating...'
                  : isVolunteer
                  ? 'Opt-Out of Volunteer Mode'
                  : 'Opt-In as Volunteer'}
              </button>
            </article>
          )}

          {/* Security & 2FA */}
          <article className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-on-surface mb-3">Security & 2FA</h3>
            <div className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
              <div>
                <p className="text-xs font-bold text-on-surface">Email OTP 2FA</p>
                <p className="text-[10px] text-on-surface-variant">Require OTP code at login</p>
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={toggling2FA}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                  currentUser?.twoFactorEnabled
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-highest text-on-surface'
                }`}
              >
                {toggling2FA ? '...' : currentUser?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </article>

        </aside>

      </div>
    </div>
  );
};

export default UserProfile;
