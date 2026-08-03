import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateLiveLocation } from '../features/auth/authSlice';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../api/axiosInstance';
import DisasterImpactCircle from '../components/DisasterImpactCircle';
import { getDisasterConfig, isValidCoordinate } from '../utils/disasterColors';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [zoomLevel, setZoomLevel] = useState(14);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Filter & Sort States
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'major' | 'minor'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'score'

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [mapCenter, setMapCenter] = useState(() => {
    if (user?.gps?.coordinates) {
      return {
        lat: user.gps.coordinates[1],
        lng: user.gps.coordinates[0],
      };
    }
    return { lat: 22.3569, lng: 91.7832 }; // Chittagong
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const response = await axiosInstance.get('/reports');
        if (response.data?.data) {
          setReports(response.data.data);
        }
      } catch (err) {
        console.error("Failed to load reports feed:", err);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  // Extract available categories
  const availableCategories = useMemo(() => {
    const defaultCats = ['Fire', 'Medical', 'Flood', 'Traffic', 'Infrastructure', 'General Hazard'];
    const reportCats = reports.map(r => r.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...reportCats]));
  }, [reports]);

  // Valid reports for map visualization
  const validReports = useMemo(() => {
    return reports.filter((r) => isValidCoordinate(r.location));
  }, [reports]);

  // Filtered and Sorted reports for the Feed
  const filteredReports = useMemo(() => {
    let result = reports.filter((r) => isValidCoordinate(r.location));

    // Filter by type/severity
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((r) => (r.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // Sort reports
    result = [...result].sort((a, b) => {
      if (sortBy === 'recent') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'score') {
        const scoreA = (a.vote?.upvote || 0) - (a.vote?.downvote || 0);
        const scoreB = (b.vote?.upvote || 0) - (b.vote?.downvote || 0);
        return scoreB - scoreA;
      }
      return 0;
    });

    return result;
  }, [reports, typeFilter, categoryFilter, sortBy]);

  const handleRecenter = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "warning");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({ lat, lng });
        
        if (isAuthenticated) {
          const gps = {
            type: "Point",
            coordinates: [lng, lat]
          };
          try {
            await dispatch(updateLiveLocation(gps)).unwrap();
            showToast("GPS Location successfully updated!", "success");
          } catch (err) {
            console.error("Failed to update live location:", err);
          }
        }
      },
      (error) => {
        console.error("Location access denied or failed", error);
        showToast("Could not retrieve GPS location.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          handleRecenter();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setSortBy('recent');
  };

  return (
    <main className="pt-14 pb-24 min-h-screen">
      {/* Interactive Map Section (Sticky Top) */}
      <section className="sticky top-14 h-[320px] w-full z-30 shadow-md">
        <div className="w-full h-full relative overflow-hidden bg-surface-container">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={zoomLevel}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                styles: [
                  { featureType: "all", elementType: "geometry.fill", stylers: [{ weight: "2.00" }] },
                  { featureType: "all", elementType: "geometry.stroke", stylers: [{ color: "#9c9c9c" }] },
                  { featureType: "all", elementType: "labels.text", stylers: [{ visibility: "on" }] },
                  { featureType: "landscape", elementType: "all", stylers: [{ color: "#f2f2f2" }] },
                  { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
                  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
                  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
                  { featureType: "road", elementType: "all", stylers: [{ saturation: -100 }, { lightness: 45 }] },
                  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#eeeeee" }] },
                  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7b7b7b" }] },
                  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
                  { featureType: "road.highway", elementType: "all", stylers: [{ visibility: "simplified" }] },
                  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#c8d7d4" }] }
                ]
              }}
            >
              {/* User Location */}
              <Marker
                position={mapCenter}
                title="Your Location"
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
              />

              {/* Valid Incident Markers & Impact Circles */}
              {validReports.map((report) => {
                const [lng, lat] = report.location.coordinates;
                return (
                  <React.Fragment key={report._id || report.postId}>
                    <Marker
                      position={{ lat, lng }}
                      title={report.category || 'Incident'}
                      label={{
                        text: report.category || 'INCIDENT',
                        color: '#000000',
                        fontWeight: 'bold',
                        fontSize: '10px'
                      }}
                      onClick={() => navigate(`/reports/${report.postId || report._id}`)}
                    />
                    {report.type === 'major' && Array.isArray(report.impactAreas) && report.impactAreas.map((area, idx) => (
                      <DisasterImpactCircle
                        key={`${report._id || report.postId}-${idx}`}
                        area={area}
                        category={report.category}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
            </div>
          )}
          <div className="absolute inset-0 map-gradient-overlay pointer-events-none"></div>

          {/* Floating Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
            <button 
              onClick={handleRecenter}
              className="bg-surface/90 backdrop-blur shadow-lg p-2 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined">my_location</span>
            </button>
            <button 
              onClick={() => navigate('/map')}
              className="bg-surface/90 backdrop-blur shadow-lg p-2 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
              title="Open Full Map"
            >
              <span className="material-symbols-outlined">map</span>
            </button>
          </div>

          {/* Active Incident Pill */}
          <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
            <div className="bg-alert-red text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-sm">error</span>
              {validReports.length} LIVE INCIDENTS
            </div>
          </div>
        </div>
      </section>

      {/* Incident Feed */}
      <div className="px-4 py-6 flex flex-col gap-6 relative z-40 bg-background/50 backdrop-blur-sm -mt-2">
        
        {/* Location Sync Banner */}
        <div className="bg-primary-container text-on-primary-container p-4 rounded-xl flex items-center justify-between shadow-sm border border-primary/10 mb-2">
          <div>
            <h3 className="font-bold text-sm">Location Sync</h3>
            <p className="text-xs opacity-80">Keep your coordinates updated for emergency response</p>
          </div>
          <button 
            onClick={handleRecenter}
            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            SYNC GPS
          </button>
        </div>

        {/* Feed Header */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Live Intelligence Feed</h2>
            <p className="text-xs text-on-surface-variant">Showing {filteredReports.length} plottable incidents</p>
          </div>
          <Link to="/map" className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider bg-primary-fixed px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[16px]">map</span>
            FULL MAP
          </Link>
        </div>

        {/* Professional Tactical Filter Control Panel */}
        <section className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">tune</span>
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Feed Filters & Controls</span>
            </div>
            {(typeFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'recent') && (
              <button 
                onClick={resetFilters}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset Filters
              </button>
            )}
          </div>

          {/* Severity Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">Severity:</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                typeFilter === 'all' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('major')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                typeFilter === 'major' 
                  ? 'bg-alert-red text-white shadow-sm' 
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-alert-red"></span>
              Major Reports
            </button>
            <button
              onClick={() => setTypeFilter('minor')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                typeFilter === 'minor' 
                  ? 'bg-primary-container text-on-primary-container border border-primary/30' 
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Minor Reports
            </button>
          </div>

          {/* Category & Sort Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Category Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sort Feed By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="recent">Most Recent (Latest First)</option>
                <option value="score">Highest Upvotes / Score</option>
              </select>
            </div>
          </div>
        </section>

        {/* Dynamic Incident Cards */}
        {loadingReports ? (
          <div className="text-center py-12 text-on-surface-variant font-medium">
            <span className="material-symbols-outlined animate-spin text-[32px] mb-2">progress_activity</span>
            <p>Scanning intelligence network...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-surface-container rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined text-outline text-[48px] mb-2">filter_alt_off</span>
            <h3 className="font-bold text-on-surface">No Incidents Match Selected Filters</h3>
            <p className="text-xs text-on-surface-variant mt-1">Try resetting your filter options to view available field reports.</p>
            <button 
              onClick={resetFilters} 
              className="mt-3 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredReports.map((report) => {
            const config = getDisasterConfig(report.category);
            const isMajor = report.type === 'major';

            return (
              <article
                key={report._id || report.postId}
                className={`bg-white border-l-4 rounded-xl shadow-sm overflow-hidden flex flex-col transition-transform duration-200 ${
                  isMajor ? 'border-alert-red' : 'border-primary'
                }`}
              >
                {/* Header Info */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface shrink-0 border border-outline-variant">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: config.hex }}>
                        {config.icon}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-on-surface text-sm">{report.issuerId?.name || 'Reporter'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${config.badgeBg}`}>
                          {report.category || 'Incident'}
                        </span>
                      </div>
                      <span className="text-on-surface-variant text-xs font-medium">
                        {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      isMajor ? 'bg-alert-red text-white' : 'bg-primary-container text-on-primary-container'
                    }`}>
                      {isMajor ? 'MAJOR DISASTER' : 'STANDARD'}
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-on-surface text-base">{report.category} Incident</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm line-clamp-3 mb-3">{report.description}</p>
                </div>

                {/* Footer Action */}
                <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
                  <div className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    <span>{report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/reports/${report.postId || report._id}`)}
                    className="bg-primary hover:bg-primary-container text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform cursor-pointer"
                  >
                    VIEW REPORT
                  </button>
                </div>
              </article>
            );
          })
        )}

      </div>
    </main>
  );
};

export default Home;
