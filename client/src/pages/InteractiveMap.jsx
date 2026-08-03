import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateLiveLocation } from '../features/auth/authSlice';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../api/axiosInstance';
import DisasterImpactCircle from '../components/DisasterImpactCircle';
import { getDisasterConfig, isValidCoordinate, DISASTER_CONFIG } from '../utils/disasterColors';

const InteractiveMap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

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
        console.error("Failed to load reports on map:", err);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  // Filter out reports with invalid coordinates and apply UI category/search filters
  const validReports = useMemo(() => {
    return reports.filter((r) => {
      if (!isValidCoordinate(r.location)) return false;
      
      if (selectedCategoryFilter !== 'ALL' && r.category !== selectedCategoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catMatch = r.category?.toLowerCase().includes(q);
        const descMatch = r.description?.toLowerCase().includes(q);
        const typeMatch = r.type?.toLowerCase().includes(q);
        if (!catMatch && !descMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [reports, selectedCategoryFilter, searchQuery]);

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
            showToast("GPS Location centered & updated!", "success");
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

  const toggleSheet = () => {
    setIsSheetOpen(!isSheetOpen);
  };

  const handleMarkerClick = (report, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedReport(report);
    if (!isSheetOpen) {
      setIsSheetOpen(true);
    }
  };

  const handleMapClick = () => {
    if (isSheetOpen) setIsSheetOpen(false);
    setSelectedReport(null);
  };

  const categoriesList = useMemo(() => {
    const list = Object.keys(DISASTER_CONFIG);
    return ['ALL', ...list];
  }, []);

  return (
    <div 
      className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-on-background select-none pt-14"
      onClick={handleMapClick}
    >
      {/* Google Map Container */}
      <div className="absolute inset-0 z-0 bg-inverse-surface">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={14}
            onClick={handleMapClick}
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
              const config = getDisasterConfig(report.category);
              const isSelected = selectedReport?._id === report._id;

              return (
                <React.Fragment key={report._id || report.postId}>
                  <Marker
                    position={{ lat, lng }}
                    title={`${report.category}: ${report.description}`}
                    label={{
                      text: report.category || 'INCIDENT',
                      color: '#000000',
                      fontWeight: 'bold',
                      fontSize: '11px',
                    }}
                    onClick={(e) => handleMarkerClick(report, e)}
                  />

                  {/* Render InfoWindow if selected */}
                  {isSelected && (
                    <InfoWindow
                      position={{ lat, lng }}
                      onCloseClick={() => setSelectedReport(null)}
                    >
                      <div className="p-2 max-w-xs text-on-surface">
                        <div className="font-bold text-sm text-alert-red flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">{config.icon}</span>
                          {report.category}
                        </div>
                        <p className="text-xs font-medium text-slate-600 mt-1 line-clamp-2">{report.description}</p>
                        <button
                          onClick={() => navigate(`/reports/${report.postId || report._id}`)}
                          className="mt-2 bg-primary text-white text-[10px] font-bold uppercase px-2 py-1 rounded w-full"
                        >
                          View Report
                        </button>
                      </div>
                    </InfoWindow>
                  )}

                  {/* Render Distinct Disaster Impact Zones for Major Reports */}
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
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[40px]">progress_activity</span>
          </div>
        )}
      </div>

      {/* Layer Overlay Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <button onClick={handleRecenter} className="w-12 h-12 rounded-xl bg-inverse-surface/90 backdrop-blur shadow-lg flex items-center justify-center text-on-surface-variant transition-all active:scale-90 hover:bg-surface-container-high">
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <button onClick={() => navigate('/reports/create')} className="w-12 h-12 rounded-xl bg-alert-red text-white shadow-lg flex items-center justify-center transition-all active:scale-90 hover:bg-alert-red/90" title="Report Emergency">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Floating Search & Category Filter Bar */}
      <div className="absolute top-20 left-4 right-20 z-10">
        <div className="flex flex-col gap-2 max-w-lg">
          <div className="relative group">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-inverse-surface/90 border-none rounded-2xl h-12 pl-12 pr-4 text-white text-base shadow-lg focus:ring-2 focus:ring-primary-fixed-dim transition-all backdrop-blur-md placeholder:text-outline-variant outline-none" 
              placeholder="Search active disaster zones or categories..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute left-4 top-3 text-outline">search</span>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {categoriesList.map((cat) => {
              const active = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategoryFilter(cat);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0 transition-all ${
                    active ? 'bg-primary text-white border-transparent' : 'bg-inverse-surface/90 text-white/80 border border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Disaster Legend Bar */}
      <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-20 backdrop-blur-md bg-inverse-surface/95 px-4 py-2 rounded-full shadow-xl flex items-center gap-4 border border-outline-variant/20 max-w-[90vw] overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-90">Flood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-90">Fire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-90">Earthquake</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-90">Chemical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-90">Landslide</span>
        </div>
      </div>

      {/* Bottom Dynamic Summary Sheet */}
      <div 
        className="absolute bottom-[72px] left-0 right-0 z-30 h-[280px] bg-inverse-surface rounded-t-[2rem] shadow-[0px_-8px_24px_rgba(0,0,0,0.15)] transition-transform duration-400 ease-in-out"
        style={{ transform: isSheetOpen ? 'translateY(0)' : 'translateY(80%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <button 
            className="w-full flex flex-col items-center pt-3 pb-2 cursor-pointer group" 
            onClick={toggleSheet}
          >
            <div className="w-12 h-1 bg-outline-variant rounded-full mb-3 group-hover:bg-outline transition-colors"></div>
            <div className="px-4 w-full flex justify-between items-center text-inverse-on-surface">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Active Tactical Incidents
                <span className="bg-alert-red/20 text-alert-red border border-alert-red/30 text-[12px] px-2.5 py-0.5 rounded-full font-bold">
                  {validReports.length} Plotted
                </span>
              </h2>
              <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSheetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_less
              </span>
            </div>
          </button>
          
          {/* Scrollable Cards */}
          <div className="px-4 flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-none mt-2" style={{ scrollbarWidth: 'none' }}>
            {validReports.length === 0 ? (
              <div className="w-full text-center py-6 text-inverse-on-surface opacity-60 font-medium">
                No matching active incidents found on tactical map.
              </div>
            ) : (
              validReports.map((report) => {
                const config = getDisasterConfig(report.category);
                const isMajor = report.type === 'major';
                const [lng, lat] = report.location.coordinates;

                return (
                  <div 
                    key={report._id || report.postId}
                    onClick={() => {
                      setMapCenter({ lat, lng });
                      setSelectedReport(report);
                    }}
                    className={`min-w-[280px] max-w-[320px] snap-center bg-surface-dim p-4 rounded-2xl border-l-4 flex flex-col gap-2 shadow-sm text-on-surface cursor-pointer hover:bg-surface-container transition-colors ${
                      selectedReport?._id === report._id ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ borderColor: config.hex }}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badgeBg}`}>
                        {report.category}
                      </span>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                        {isMajor ? 'MAJOR' : 'MINOR'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base line-clamp-1">{report.category} Alert</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{report.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-[11px] font-medium opacity-60">
                        {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${report.postId || report._id}`);
                        }}
                        className="bg-primary hover:bg-primary-container text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
