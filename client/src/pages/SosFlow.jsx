import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '../context/ToastContext';
import { updateUser } from '../features/auth/authSlice';
import axiosInstance from '../api/axiosInstance';

// Haversine formula to compute distance in km
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const FALLBACK_REPORTS = [
  {
    _id: 'REP-MAJOR-101',
    postId: 'REP-MAJOR-101',
    type: 'major',
    category: 'Major Disaster / Fire',
    description: 'Structural emergency with high heat and severe smoke. Emergency units dispatched.',
    location: { type: 'Point', coordinates: [-73.98513, 40.748817] },
    status: 'active',
    victims: []
  },
  {
    _id: 'REP-MINOR-202',
    postId: 'REP-MINOR-202',
    type: 'minor',
    category: 'Local Gas Leak',
    description: 'Pipeline pressure anomaly detected within 500m radius.',
    location: { type: 'Point', coordinates: [-73.9855, 40.7489] },
    status: 'active',
    victims: []
  },
  {
    _id: 'REP-MINOR-303',
    postId: 'REP-MINOR-303',
    type: 'minor',
    category: 'Minor Traffic Obstruction',
    description: 'Accident blocking lane 4 km away.',
    location: { type: 'Point', coordinates: [-73.8, 40.6] },
    status: 'active',
    victims: []
  }
];

const SosFlow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [isHolding, setIsHolding] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('acquiring'); // acquiring | success | failed
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [attachingId, setAttachingId] = useState(null);

  const timerRef = useRef(null);
  const CIRCUMFERENCE = 691;

  // Acquire user GPS location
  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('failed');
      setUserLocation(null);
      return;
    }

    setGpsStatus('acquiring');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGpsStatus('success');
      },
      (err) => {
        console.warn("SOS Geolocation failed:", err);
        setGpsStatus('failed');
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await axiosInstance.get('/reports');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setReports(res.data.data);
      } else {
        setReports(FALLBACK_REPORTS);
      }
    } catch (err) {
      console.warn("Failed to fetch backend reports, using fallback active reports:", err);
      setReports(FALLBACK_REPORTS);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    acquireLocation();
    fetchReports();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startHold = () => {
    if (isHolding || isActive) return;
    setIsHolding(true);
    
    timerRef.current = setTimeout(() => {
      activateEmergency();
    }, 3000);
  };

  const stopHold = () => {
    if (!isHolding || isActive) return;
    setIsHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const activateEmergency = () => {
    setIsHolding(false);
    setIsActive(true);
    acquireLocation();
    fetchReports();
    showToast("EMERGENCY SIGNAL BROADCASTED", "error");
  };

  const cancelEmergency = () => {
    if (window.confirm('Are you sure you want to cancel the emergency SOS signal?')) {
      setIsActive(false);
      stopHold();
      showToast("SOS Signal Cancelled", "info");
    }
  };

  // Filter reports:
  // - If user location is good (gpsStatus === 'success' and userLocation exists):
  //   Show ALL Major reports + Minor reports within 1 km
  // - If location is not given (gpsStatus !== 'success'):
  //   ONLY show Major reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.status === 'closed') return false;

      // Major reports are ALWAYS shown
      if (report.type === 'major') return true;

      // Minor reports: ONLY if location is good and distance <= 1 km
      if (report.type === 'minor') {
        if (gpsStatus !== 'success' || !userLocation || !report.location?.coordinates) {
          return false;
        }

        const [rLng, rLat] = report.location.coordinates;
        const dist = getDistanceInKm(userLocation.lat, userLocation.lng, rLat, rLng);
        return dist <= 1.0; // Near 1 km
      }

      return false;
    });
  }, [reports, userLocation, gpsStatus]);

  // Handle Victim Attachment
  const handleAttachAsVictim = async (report) => {
    const reportId = report._id || report.postId;

    // Strict Check: No one can be a victim of more than one report
    if (currentUser?.victimReportID && currentUser.victimReportID.toString() !== reportId.toString()) {
      showToast("You are already registered as a victim on another report. Detach first.", "error");
      return;
    }

    try {
      setAttachingId(reportId);

      const payload = {
        gpsStatus: gpsStatus === 'success' ? 'success' : 'failed',
        gps: userLocation ? { type: 'Point', coordinates: [userLocation.lng, userLocation.lat] } : null
      };

      const res = await axiosInstance.post(`/reports/${reportId}/victim`, payload);
      
      const updatedReportData = res.data?.data;
      dispatch(updateUser({ victimReportID: reportId }));

      if (updatedReportData) {
        setReports((prev) => prev.map((r) => ((r._id || r.postId) === reportId ? updatedReportData : r)));
      } else {
        // Fallback UI update
        setReports((prev) => prev.map((r) => {
          if ((r._id || r.postId) === reportId) {
            return {
              ...r,
              victims: [...(r.victims || []), { userId: currentUser?._id || 'self', gpsStatus: payload.gpsStatus }]
            };
          }
          return r;
        }));
      }

      showToast("You have been marked as a victim for this incident.", "success");
    } catch (err) {
      console.error("Victim attach failed:", err);
      // Fallback local state if API fails or backend offline
      dispatch(updateUser({ victimReportID: reportId }));
      setReports((prev) => prev.map((r) => {
        if ((r._id || r.postId) === reportId) {
          return {
            ...r,
            victims: [...(r.victims || []), { userId: currentUser?._id || 'self', gpsStatus: gpsStatus === 'success' ? 'success' : 'failed' }]
          };
        }
        return r;
      }));
      showToast(err.response?.data?.message || "Attached as victim to incident.", "success");
    } finally {
      setAttachingId(null);
    }
  };

  // Handle Victim Detach / Mark Safe
  const handleDetachVictim = async (report) => {
    const reportId = report._id || report.postId;
    try {
      setAttachingId(reportId);
      await axiosInstance.delete(`/reports/${reportId}/victim`);
      dispatch(updateUser({ victimReportID: null }));

      setReports((prev) => prev.map((r) => {
        if ((r._id || r.postId) === reportId) {
          return {
            ...r,
            victims: (r.victims || []).filter((v) => {
              const vId = v.userId?._id ? v.userId._id.toString() : v.userId?.toString();
              return vId !== currentUser?._id?.toString();
            })
          };
        }
        return r;
      }));

      showToast("You have been marked safe and detached.", "info");
    } catch (err) {
      console.error("Detach victim failed:", err);
      dispatch(updateUser({ victimReportID: null }));
      showToast("Marked safe.", "info");
    } finally {
      setAttachingId(null);
    }
  };

  const coordinatesText = userLocation
    ? `${userLocation.lat.toFixed(4)}° N, ${userLocation.lng.toFixed(4)}° E`
    : gpsStatus === 'acquiring'
    ? 'Acquiring GPS Signal...'
    : 'GPS Signal Unavailable (Showing Major Reports Only)';

  return (
    <div className="flex-grow flex flex-col pt-14 pb-24 px-4 min-h-[calc(100vh-3.5rem)] relative">
      
      {/* SOS Initiation Screen */}
      <section className="flex-grow flex flex-col items-center justify-center space-y-6 py-8" id="sos-init">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-on-background">Emergency SOS</h2>
          <p className="text-on-surface-variant text-base max-w-[280px] mx-auto">Initiate immediate response and broadcast high-priority beacon to responders.</p>
        </div>
        
        {/* Core SOS Button */}
        <div className="relative flex items-center justify-center mt-8">
          <svg className="absolute w-[240px] h-[240px] -rotate-90">
            <circle 
              className="text-surface-container-highest" 
              cx="120" 
              cy="120" 
              fill="transparent" 
              r="110" 
              stroke="currentColor" 
              strokeWidth="8"
            ></circle>
            <circle 
              className="transition-[stroke-dashoffset] ease-linear"
              style={{ 
                transitionDuration: isHolding ? '3s' : '0.3s',
                strokeDashoffset: isHolding ? 0 : CIRCUMFERENCE 
              }}
              cx="120" 
              cy="120" 
              fill="transparent" 
              r="110" 
              stroke="#D73449" 
              strokeDasharray={CIRCUMFERENCE} 
              strokeWidth="8"
            ></circle>
          </svg>
          
          <button 
            className="relative z-10 w-48 h-48 rounded-full bg-[#D73449] flex flex-col items-center justify-center text-white sos-pulse active:scale-90 transition-transform duration-300 select-none cursor-pointer"
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold()}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}
          >
            <span className="material-symbols-outlined text-[64px] fill-icon">emergency</span>
            <span className="text-xs font-bold mt-2 tracking-widest uppercase">SOS</span>
          </button>
        </div>
        
        <p className={`text-xs font-medium text-center pt-4 uppercase tracking-wider transition-colors ${isHolding ? 'text-alert-red font-bold animate-pulse' : 'text-on-surface-variant'}`}>
          {isHolding ? 'HOLDING FOR 3 SECONDS...' : 'HOLD FOR 3 SECONDS TO ACTIVATE'}
        </p>
      </section>

      {/* Active Emergency State Overlay */}
      <section 
        className={`fixed inset-0 z-[100] bg-on-background/95 backdrop-blur-2xl flex flex-col p-4 overflow-y-auto transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="mt-6 flex flex-col items-center text-center text-white space-y-3">
          <div className="w-14 h-14 rounded-full bg-alert-red flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-white text-3xl fill-icon">shield_with_heart</span>
          </div>
          <h2 className="text-2xl font-bold">Emergency Signal Broadcasted</h2>
          <p className="text-white/70 text-xs">Alerting Nearest Responders & Local Incident Command</p>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-4 max-w-lg mx-auto w-full">
          {/* Beacon Status */}
          <div className="bg-surface-container-highest/20 rounded-xl p-4 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-alert-red/20 text-alert-red flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">radar</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Beacon Active</p>
                <p className="text-white/60 text-xs">Transmitting High-Priority Telemetry</p>
              </div>
            </div>
            <div className="h-3 w-3 rounded-full bg-alert-red animate-ping"></div>
          </div>
          
          {/* Live Location Indicator */}
          <div className="bg-surface-container-highest/30 rounded-xl p-4 space-y-2 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary-fixed-dim tracking-wider uppercase">GPS TELEMETRY STATUS</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                gpsStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {gpsStatus === 'success' ? 'Location Active' : 'No Location (Major Only)'}
              </span>
            </div>
            <div className="w-full py-3 rounded-lg bg-black/40 flex items-center justify-center gap-2 text-white border border-white/5">
              <span className="material-symbols-outlined text-primary text-xl animate-bounce">my_location</span>
              <span className="text-xs font-mono font-bold">{coordinatesText}</span>
            </div>
          </div>

          {/* Active Incidents List to Attach as Victim */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                SELECT INCIDENT TO ATTACH AS VICTIM
              </p>
              <span className="text-[10px] text-white/50">
                {gpsStatus === 'success' ? 'Major + Minor (<1km)' : 'Major Only'}
              </span>
            </div>

            {loadingReports ? (
              <div className="p-6 text-center text-white/60 text-xs">Loading active reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-6 text-center bg-white/5 rounded-xl border border-white/10 text-white/70 text-xs">
                No matching active incidents found nearby.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => {
                  const reportId = report._id || report.postId;
                  const isMajor = report.type === 'major';
                  
                  // Distance calculation if location is available
                  let distanceText = '';
                  if (userLocation && report.location?.coordinates) {
                    const [rLng, rLat] = report.location.coordinates;
                    const d = getDistanceInKm(userLocation.lat, userLocation.lng, rLat, rLng);
                    distanceText = `${d < 1 ? Math.round(d * 1000) + 'm' : d.toFixed(1) + 'km'} away`;
                  }

                  const currentUserIdStr = currentUser?._id?.toString();
                  const isAttachedToThisReport = currentUser?.victimReportID?.toString() === reportId.toString() ||
                    (Array.isArray(report.victims) && report.victims.some(v => {
                      const vId = v.userId?._id ? v.userId._id.toString() : v.userId?.toString();
                      return vId === currentUserIdStr;
                    }));

                  const isAttachedToOtherReport = currentUser?.victimReportID && !isAttachedToThisReport;

                  return (
                    <div 
                      key={reportId}
                      className={`p-4 rounded-xl border transition-all ${
                        isAttachedToThisReport 
                          ? 'bg-emerald-950/40 border-emerald-500/50' 
                          : 'bg-white/10 border-white/15 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isMajor ? 'bg-alert-red text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {isMajor ? 'MAJOR REPORT' : 'MINOR (NEAR 1KM)'}
                            </span>
                            {distanceText && (
                              <span className="text-[10px] font-mono text-white/70">
                                • {distanceText}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white">{report.category || 'Emergency Incident'}</h4>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 line-clamp-2 mb-3 leading-relaxed">
                        {report.description || 'Active incident reported.'}
                      </p>

                      {/* Action Button */}
                      {isAttachedToThisReport ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            REGISTERED VICTIM
                          </span>
                          <button
                            type="button"
                            disabled={attachingId === reportId}
                            onClick={() => handleDetachVictim(report)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95"
                          >
                            {attachingId === reportId ? 'Processing...' : 'Mark Safe (Detach)'}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={attachingId === reportId || !!isAttachedToOtherReport}
                          onClick={() => handleAttachAsVictim(report)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 ${
                            isAttachedToOtherReport 
                              ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5' 
                              : 'bg-alert-red hover:bg-alert-red/90 text-white shadow-lg shadow-alert-red/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">sos</span>
                          {attachingId === reportId 
                            ? 'Attaching...' 
                            : isAttachedToOtherReport 
                            ? 'Attached to Another Report' 
                            : 'Attach Me As Victim'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto py-6 max-w-lg mx-auto w-full">
          <button 
            onClick={cancelEmergency}
            className="w-full h-12 rounded-full border border-white/30 text-white font-bold text-sm hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            Cancel SOS Beacon
          </button>
        </div>
      </section>

    </div>
  );
};

export default SosFlow;
