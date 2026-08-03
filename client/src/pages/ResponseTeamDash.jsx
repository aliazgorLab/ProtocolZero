import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';
import DisasterImpactCircle from '../components/DisasterImpactCircle';
import { getDisasterConfig, isValidCoordinate } from '../utils/disasterColors';
import { RESOURCE_TAXONOMY } from '../constants/resources';

// Haversine Distance Calculation (km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return null;
  }
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

const ResponseTeamDash = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);
  
  // Modals state
  const [inspectingVictimsReport, setInspectingVictimsReport] = useState(null); // Report object for victim drawer
  const [committingAssetReport, setCommittingAssetReport] = useState(null); // Report object for commit modal
  
  // Asset Commitment Form
  const [selectedAssetItem, setSelectedAssetItem] = useState(RESOURCE_TAXONOMY[0].id);
  const [assetQuantity, setAssetQuantity] = useState(1);
  const [submittingAsset, setSubmittingAsset] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  // User coordinates
  const userLat = currentUser?.currentAddressGps?.coordinates?.[1] || currentUser?.gps?.coordinates?.[1] || 22.3569;
  const userLng = currentUser?.currentAddressGps?.coordinates?.[0] || currentUser?.gps?.coordinates?.[0] || 91.7832;

  const [mapCenter, setMapCenter] = useState({ lat: userLat, lng: userLng });

  const fetchTacticalReports = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/reports');
      if (res.data?.data) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch command telemetry:", err);
      showToast("Failed to load active tactical telemetry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTacticalReports();
  }, []);

  // Filter active non-closed reports and sort by urgency (Major + Victim count + distance)
  const activeReports = useMemo(() => {
    return reports
      .filter(r => r.status === 'active')
      .map(r => {
        const [lng, lat] = r.location?.coordinates || [0, 0];
        const dist = calculateDistance(userLat, userLng, lat, lng);
        const victimCount = Array.isArray(r.victims) ? r.victims.length : 0;
        return {
          ...r,
          distanceKm: dist,
          victimCount,
        };
      })
      .sort((a, b) => {
        // Priority 1: Major Disasters & SOS victims first
        const priorityA = (a.type === 'major' ? 100 : 0) + (a.victimCount * 10);
        const priorityB = (b.type === 'major' ? 100 : 0) + (b.victimCount * 10);
        if (priorityA !== priorityB) return priorityB - priorityA;
        
        // Priority 2: Closer distance
        if (a.distanceKm && b.distanceKm) {
          return parseFloat(a.distanceKm) - parseFloat(b.distanceKm);
        }
        return 0;
      });
  }, [reports, userLat, userLng]);

  const selectedReport = useMemo(() => {
    return activeReports.find(r => (r._id || r.postId) === selectedReportId) || activeReports[0] || null;
  }, [activeReports, selectedReportId]);

  const handleSelectReport = (report) => {
    const reportId = report._id || report.postId;
    setSelectedReportId(reportId);
    if (isValidCoordinate(report.location)) {
      const [lng, lat] = report.location.coordinates;
      setMapCenter({ lat, lng });
    }
  };

  const dispatch = useDispatch();

  const userInventory = Array.isArray(currentUser?.inventory) ? currentUser.inventory.filter(i => i.quantity > 0) : [];
  const selectedInvItem = userInventory.find(i => (i.itemId || i.id) === selectedAssetItem || i.itemName === selectedAssetItem) || userInventory[0];
  const maxAvailableQty = selectedInvItem ? selectedInvItem.quantity : 0;

  useEffect(() => {
    if (userInventory.length > 0 && (!selectedAssetItem || !userInventory.some(i => (i.itemId || i.id) === selectedAssetItem || i.itemName === selectedAssetItem))) {
      const firstItem = userInventory[0];
      setSelectedAssetItem(firstItem.itemId || firstItem.id || firstItem.itemName);
    }
  }, [currentUser]);

  // Commit Asset Submission
  const handleCommitAssetSubmit = async (e) => {
    e.preventDefault();
    if (!committingAssetReport) return;

    if (userInventory.length === 0) {
      showToast("You have no items in your inventory stock. Please update your stock in your User Profile first.", "warning");
      return;
    }

    if (!selectedInvItem) {
      showToast("Please select a valid inventory item.", "warning");
      return;
    }

    if (assetQuantity <= 0) {
      showToast("Quantity must be at least 1.", "warning");
      return;
    }

    if (assetQuantity > maxAvailableQty) {
      showToast(`Insufficient stock! You only have ${maxAvailableQty} ${selectedInvItem.itemName || 'item'}(s) in your inventory stock.`, "warning");
      return;
    }

    const reportId = committingAssetReport._id || committingAssetReport.postId;
    try {
      setSubmittingAsset(true);
      const taxMatch = RESOURCE_TAXONOMY.find(t => t.id === (selectedInvItem.itemId || selectedInvItem.id) || t.name === selectedInvItem.itemName) || {};
      const canonicalItemId = taxMatch.id || selectedInvItem.itemId || selectedInvItem.id || selectedInvItem.itemName;

      const payload = {
        items: [
          {
            itemId: canonicalItemId,
            quantity: Number(assetQuantity),
          }
        ]
      };

      const res = await axiosInstance.patch(`/reports/${reportId}/resources`, payload);
      if (res.data?.data) {
        showToast(`Committed ${assetQuantity} x ${taxMatch.name || selectedInvItem.itemName} from your inventory stock!`, "success");

        // Deduct inventory locally in Redux
        const updatedInv = userInventory.map(item => {
          const isMatch = (item.itemId || item.id) === (selectedInvItem.itemId || selectedInvItem.id) || item.itemName === selectedInvItem.itemName;
          if (isMatch) {
            return { ...item, quantity: item.quantity - Number(assetQuantity) };
          }
          return item;
        }).filter(item => item.quantity > 0);

        dispatch(updateUser({ inventory: updatedInv }));

        setCommittingAssetReport(null);
        fetchTacticalReports();
      }
    } catch (err) {
      console.error("Asset deployment failed:", err);
      showToast(err.response?.data?.message || "Failed to commit asset deployment.", "error");
    } finally {
      setSubmittingAsset(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden">
      
      {/* Top Operations Command Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            title="Return to Home Feed"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white font-black">
              <span className="material-symbols-outlined text-lg">local_police</span>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">PROTOCOL ZERO COMMAND DECK</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Officer: {currentUser?.name || 'Response Officer'} ({currentUser?.accountType || 'ResponseTeam'})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800 text-rose-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>{activeReports.length} ACTIVE INCIDENTS PLOTTED</span>
          </div>
          <button
            onClick={fetchTacticalReports}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh Telemetry
          </button>
        </div>
      </header>

      {/* Main Dual-Pane Command Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[440px_1fr] overflow-hidden">
        
        {/* LEFT PANE: Live Tactical Emergency Queue */}
        <section className="border-r border-slate-800 bg-slate-900/50 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">crisis_alert</span>
                Live Emergency Queue ({activeReports.length})
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Sorted by hazard urgency and distance</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-16 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-[36px] mb-2 text-rose-500">progress_activity</span>
                <p className="text-xs font-bold uppercase tracking-wider">Syncing tactical emergency telemetry...</p>
              </div>
            ) : activeReports.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/80 rounded-2xl border border-slate-800 p-6">
                <span className="material-symbols-outlined text-5xl mb-2 text-emerald-500">verified</span>
                <p className="font-bold text-slate-200 text-sm">All Sectors Operational</p>
                <p className="text-xs text-slate-400 mt-1">No active emergency dispatches currently assigned.</p>
              </div>
            ) : (
              activeReports.map((report) => {
                const reportId = report._id || report.postId;
                const isSelected = selectedReport?._id === report._id || selectedReport?.postId === report.postId;
                const config = getDisasterConfig(report.category);
                const isMajor = report.type === 'major';
                const victims = report.victims || [];
                const committedAssets = report.resourcesCommitted || [];

                return (
                  <div
                    key={reportId}
                    onClick={() => handleSelectReport(report)}
                    className={`rounded-2xl border p-4 transition cursor-pointer flex flex-col gap-3 ${
                      isSelected
                        ? 'border-rose-500 bg-slate-900 shadow-lg ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isMajor ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {isMajor ? 'MAJOR DISASTER' : 'STANDARD'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          {report.category}
                        </span>
                      </div>

                      <span className="font-mono text-xs font-bold text-slate-400">
                        {report.distanceKm ? `${report.distanceKm} km away` : 'Nearby'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg" style={{ color: config.hex }}>
                          {config.icon}
                        </span>
                        {report.category} Incident ({report.postId || report._id})
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{report.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingVictimsReport(report);
                        }}
                        className={`flex items-center gap-1 font-bold transition ${
                          victims.length > 0 ? 'text-rose-400 hover:text-rose-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">sos</span>
                        <span>{victims.length} Victim{victims.length === 1 ? '' : 's'}</span>
                      </button>

                      <div className="flex items-center gap-1 font-bold text-emerald-400">
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        <span>{committedAssets.length} Assets Deployed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommittingAssetReport(report);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm text-center"
                      >
                        Deploy Assets
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${reportId}`);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer text-center"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT PANE: Interactive Google Command Map */}
        <section className="relative h-full w-full bg-slate-950 overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={14}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
                  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
                  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
                  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
                ]
              }}
            >
              {/* Officer Command Unit Position */}
              <Marker
                position={{ lat: userLat, lng: userLng }}
                title="Your Command Unit"
                label={{ text: "🛡️ COMMAND UNIT", color: "#ffffff", fontWeight: "bold", fontSize: "10px" }}
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
              />

              {/* Active Incident Markers */}
              {activeReports.map((report) => {
                const reportId = report._id || report.postId;
                if (!isValidCoordinate(report.location)) return null;
                const [lng, lat] = report.location.coordinates;
                const isSelected = selectedReport?._id === report._id || selectedReport?.postId === report.postId;
                const config = getDisasterConfig(report.category);

                return (
                  <React.Fragment key={reportId}>
                    <Marker
                      position={{ lat, lng }}
                      title={`${report.category} Incident`}
                      label={{
                        text: `${report.category.toUpperCase()} (${report.victimCount} SOS)`,
                        color: isSelected ? '#ff3366' : '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                      }}
                      onClick={() => handleSelectReport(report)}
                    />

                    {/* Render Disaster Impact Circles */}
                    {report.type === 'major' && Array.isArray(report.impactAreas) && report.impactAreas.map((area, idx) => (
                      <DisasterImpactCircle
                        key={`${reportId}-${idx}`}
                        area={area}
                        category={report.category}
                      />
                    ))}

                    {/* Render Attached Victims Markers */}
                    {Array.isArray(report.victims) && report.victims.map((victim, vIdx) => {
                      const victimUser = victim.userId || {};
                      const coords = victimUser.gps?.coordinates || report.location.coordinates;
                      const [vLng, vLat] = coords;

                      return (
                        <Marker
                          key={`victim-${reportId}-${vIdx}`}
                          position={{ lat: vLat, lng: vLng }}
                          title={`Victim: ${victimUser.name || 'Citizen'}`}
                          label={{ text: `🆘 ${victimUser.name || 'VICTIM'}`, color: '#ff4d4d', fontWeight: 'bold', fontSize: '10px' }}
                          icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined animate-spin text-[40px] text-rose-500">progress_activity</span>
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: Victim Profile Drawer */}
      {inspectingVictimsReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <span className="material-symbols-outlined text-2xl">sos</span>
                <h3 className="text-base font-bold text-white">Registered Victims Roster</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingVictimsReport(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 mb-4">
              Victims attached to incident <strong className="text-white">{inspectingVictimsReport.postId || inspectingVictimsReport._id}</strong> ({inspectingVictimsReport.category}):
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(!inspectingVictimsReport.victims || inspectingVictimsReport.victims.length === 0) ? (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                  <p className="text-xs font-bold">No victims currently registered on this report.</p>
                </div>
              ) : (
                inspectingVictimsReport.victims.map((victim, idx) => {
                  const victimUser = victim.userId || {};
                  const isLiveGPS = victim.gpsStatus === 'success';

                  return (
                    <div key={victim._id || idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-xl">person_pin</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{victimUser.name || 'Citizen Victim'}</h4>
                            <p className="text-xs text-slate-400">{victimUser.accountType || 'Citizen'}</p>
                          </div>
                        </div>
                      </div>

                      {/* GPS Signal Status Warning Badge */}
                      <div className="pt-1">
                        {isLiveGPS ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <span className="material-symbols-outlined text-xs">satellite_alt</span>
                            LIVE GPS SIGNAL CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
                            <span className="material-symbols-outlined text-xs">warning</span>
                            REGISTERED ADDRESS FALLBACK (GPS INACTIVE)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-slate-800">
                        <div>
                          <span className="font-bold text-slate-400">Phone:</span> {victimUser.phone || 'N/A'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-400">Email:</span> {victimUser.email || 'N/A'}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-400">Home Address:</span> {victimUser.homeAddress || 'N/A'}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-400">Current Address:</span> {victimUser.currentAddress || 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-auto">
              <button
                type="button"
                onClick={() => setInspectingVictimsReport(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: One-Click Asset Commitment Modal */}
      {committingAssetReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
                <h3 className="text-base font-bold text-white">Deploy Official Response Asset</h3>
              </div>
              <button
                type="button"
                onClick={() => setCommittingAssetReport(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Deploying heavy equipment / vehicles to incident <strong className="text-white">{committingAssetReport.postId || committingAssetReport._id}</strong> ({committingAssetReport.category}).
            </p>

            {userInventory.length === 0 ? (
              <div className="py-6 px-4 bg-amber-950/60 border border-amber-800 rounded-2xl text-center space-y-3">
                <span className="material-symbols-outlined text-amber-400 text-4xl">inventory_2</span>
                <p className="text-xs font-bold text-white">No Items Available in Stock Inventory</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You currently have no stock available in your user inventory. Please add items in your <strong>User Profile</strong> before deploying assets.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCommittingAssetReport(null);
                    navigate('/profile');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                >
                  Go To Profile Inventory
                </button>
              </div>
            ) : (
              <form onSubmit={handleCommitAssetSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Select Available Inventory Stock Item
                  </label>
                  <select
                    value={selectedAssetItem}
                    onChange={(e) => {
                      setSelectedAssetItem(e.target.value);
                      const sel = userInventory.find(i => (i.itemId || i.id) === e.target.value || i.itemName === e.target.value);
                      if (sel && assetQuantity > sel.quantity) {
                        setAssetQuantity(sel.quantity);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {userInventory.map((item) => {
                      const tax = RESOURCE_TAXONOMY.find(t => t.id === (item.itemId || item.id) || t.name === item.itemName) || {};
                      const cat = tax.category || item.category || 'Supplies';
                      const name = tax.name || item.itemName || 'Resource Item';
                      const val = item.itemId || item.id || item.itemName;
                      return (
                        <option key={val} value={val}>
                          [{cat}] {name} — (Stock: {item.quantity} {item.unit || tax.defaultUnit || 'units'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Deployment Quantity
                    </label>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Stock: {maxAvailableQty} {selectedInvItem?.unit || 'units'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={maxAvailableQty}
                    value={assetQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setAssetQuantity(Math.min(maxAvailableQty, Math.max(1, val)));
                    }}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Maximum quantity is capped by your available inventory stock ({maxAvailableQty}).
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCommittingAssetReport(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAsset || maxAvailableQty === 0}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {submittingAsset ? 'Deploying...' : 'Confirm Deployment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ResponseTeamDash;
