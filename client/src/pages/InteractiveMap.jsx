import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateLiveLocation } from '../features/auth/authSlice';
import { useToast } from '../context/ToastContext';

const InteractiveMap = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);

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

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

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
            showToast("GPS Location successfully updated and saved to your profile!", "success");
          } catch (err) {
            console.error("Failed to update live location:", err);
            showToast("Location fetched, but failed to save to server.", "error");
          }
        } else {
          showToast("GPS Location centered on map!", "info");
        }
      },
      (error) => {
        console.error("Location access denied or failed", error);
        if (error.code === error.PERMISSION_DENIED) {
          showToast("Location access was denied. Please allow location access in your browser settings.", "warning");
        } else {
          showToast("Could not retrieve location. Please check your GPS signal.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          handleRecenter();
        } else if (result.state === 'prompt') {
          setShowLocationPrompt(true);
        }
      });
    } else {
      setShowLocationPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAllowLocation = () => {
    setShowLocationPrompt(false);
    handleRecenter();
  };

  const toggleSheet = () => {
    setIsSheetOpen(!isSheetOpen);
  };

  const handleMarkerClick = (markerId, e) => {
    e.stopPropagation();
    setSelectedMarker(markerId);
    if (!isSheetOpen) {
      setIsSheetOpen(true);
    }
  };

  const handleMapClick = () => {
    if (isSheetOpen) setIsSheetOpen(false);
    setSelectedMarker(null);
  };

  return (
    <div 
      className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-on-background select-none pt-14"
      onClick={handleMapClick}
    >
      {/* Background Map Image */}
      <div className="absolute inset-0 z-0 bg-inverse-surface">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={15}
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
                { featureType: "road.arterial", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
                { featureType: "water", elementType: "all", stylers: [{ color: "#46bcec" }, { visibility: "on" }] },
                { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#c8d7d4" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#070707" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] }
              ]
            }}
          >
            <Marker position={mapCenter} title="Your Location" />
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[40px]">progress_activity</span>
          </div>
        )}
      </div>

      {/* Layer Overlay Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <button className="w-12 h-12 rounded-xl bg-inverse-surface shadow-lg flex items-center justify-center text-primary-fixed-dim hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-90">
          <span className="material-symbols-outlined">layers</span>
        </button>
        <button onClick={handleRecenter} className="w-12 h-12 rounded-xl bg-inverse-surface shadow-lg flex items-center justify-center text-on-surface-variant transition-all active:scale-90">
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <button className="w-12 h-12 rounded-xl bg-inverse-surface shadow-lg flex items-center justify-center text-on-surface-variant transition-all active:scale-90">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="w-12 h-12 rounded-xl bg-inverse-surface shadow-lg flex items-center justify-center text-on-surface-variant transition-all active:scale-90">
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>

      {/* Floating Search & Filter Bar */}
      <div className="absolute top-20 left-4 right-20 z-10">
        <div className="flex flex-col gap-2 max-w-lg">
          <div className="relative group">
            <input 
              className="w-full bg-inverse-surface/90 border-none rounded-2xl h-12 pl-12 pr-4 text-white text-base shadow-lg focus:ring-2 focus:ring-primary-fixed-dim transition-all backdrop-blur-md placeholder:text-outline-variant" 
              placeholder="Search incidents, shelters, or teams..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute left-4 top-3 text-outline">search</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <button className="px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0">
              Category <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            <button className="px-4 py-1.5 bg-inverse-surface text-inverse-on-surface rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0 border border-outline-variant/30">
              Urgency <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            <button className="px-4 py-1.5 bg-inverse-surface text-inverse-on-surface rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm flex-shrink-0 border border-outline-variant/30">
              Time: 24h <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clustered Incident Markers */}
      
      {/* Fire Incident */}
      <div 
        className="absolute top-1/3 left-1/4 group cursor-pointer"
        onClick={(e) => handleMarkerClick('fire-1', e)}
      >
        <div className="relative flex flex-col items-center">
          <div className={`bg-error p-2 rounded-full shadow-[0px_4px_4px_rgba(0,0,0,0.25)] text-on-error sos-pulse active:scale-95 transition-transform ${selectedMarker === 'fire-1' ? 'ring-4 ring-primary-fixed-dim' : ''}`}>
            <span className="material-symbols-outlined fill-icon">local_fire_department</span>
          </div>
          <div className="hidden group-hover:block absolute top-10 bg-inverse-surface text-inverse-on-surface text-[12px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-xl z-20">
            Structural Fire - Level 4
          </div>
        </div>
      </div>

      {/* Medical Facility */}
      <div 
        className="absolute top-1/2 right-1/3 group cursor-pointer"
        onClick={(e) => handleMarkerClick('med-1', e)}
      >
        <div className="relative flex flex-col items-center">
          <div className={`bg-primary-container p-2 rounded-full shadow-[0px_4px_4px_rgba(0,0,0,0.25)] text-on-primary-container active:scale-95 transition-transform ${selectedMarker === 'med-1' ? 'ring-4 ring-primary-fixed-dim' : ''}`}>
            <span className="material-symbols-outlined fill-icon">medical_services</span>
          </div>
          <div className="hidden group-hover:block absolute top-10 bg-inverse-surface text-inverse-on-surface text-[12px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-xl z-20">
            City Hospital (84% Capacity)
          </div>
        </div>
      </div>

      {/* Volunteer Cluster */}
      <div 
        className="absolute bottom-1/3 left-1/2 group cursor-pointer"
        onClick={(e) => handleMarkerClick('vol-1', e)}
      >
        <div className="relative flex flex-col items-center">
          <div className={`bg-secondary p-2 rounded-full shadow-[0px_4px_4px_rgba(0,0,0,0.25)] text-on-secondary active:scale-95 transition-transform border-2 border-surface-bright ${selectedMarker === 'vol-1' ? 'ring-4 ring-primary-fixed-dim' : ''}`}>
            <span className="material-symbols-outlined fill-icon">groups</span>
          </div>
          <div className="absolute -top-3 -right-3 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
            12
          </div>
        </div>
      </div>

      {/* Heatmap Overlay Simulation */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen">
        <div className="w-full h-full bg-gradient-to-br from-error/40 via-transparent to-primary/30"></div>
      </div>

      {/* Legend (Bottom Floating) */}
      <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-20 backdrop-blur-md bg-inverse-surface/95 px-4 py-2 rounded-full shadow-xl flex items-center gap-4 border border-outline-variant/20 max-w-[90vw] overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-error text-[18px] fill-icon">local_fire_department</span>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-80">Fire</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-primary-fixed-dim text-[18px] fill-icon">local_hospital</span>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-80">Hospitals</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-secondary text-[18px] fill-icon">local_police</span>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-80">Police</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-tertiary-container text-[18px] fill-icon">apartment</span>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-80">Shelters</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-outline text-[18px] fill-icon">volunteer_activism</span>
          <span className="text-xs font-bold uppercase tracking-wider text-inverse-on-surface opacity-80">Volunteers</span>
        </div>
      </div>

      {/* Bottom Summary Sheet */}
      <div 
        className="absolute bottom-[72px] left-0 right-0 z-30 h-[280px] bg-inverse-surface rounded-t-[2rem] shadow-[0px_-8px_24px_rgba(0,0,0,0.15)] transition-transform duration-400 ease-in-out"
        style={{ transform: isSheetOpen ? 'translateY(0)' : 'translateY(80%)' }}
        onClick={(e) => e.stopPropagation()} // prevent clicks inside sheet from closing it
      >
        <div className="flex flex-col h-full">
          {/* Drag Handle / Header */}
          <button 
            className="w-full flex flex-col items-center pt-3 pb-4 cursor-pointer group" 
            onClick={toggleSheet}
          >
            <div className="w-12 h-1 bg-outline-variant rounded-full mb-3 group-hover:bg-outline transition-colors"></div>
            <div className="px-4 w-full flex justify-between items-center text-inverse-on-surface">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Quick Summary
                <span className="bg-error/10 text-error text-[12px] px-2 py-0.5 rounded-full font-bold">4 Active</span>
              </h2>
              <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isSheetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_less
              </span>
            </div>
          </button>
          
          {/* Scrollable Content */}
          <div className="px-4 flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            
            {/* Summary Card 1 */}
            <div className="min-w-[280px] snap-center bg-surface-dim p-4 rounded-2xl border-l-4 border-error flex flex-col gap-2 shadow-sm text-on-surface">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-error bg-error/10 px-2 py-1 rounded">URGENT</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary-fixed-dim"></div>
                  <span className="text-[12px] font-medium text-on-surface-variant">Reliability: 98%</span>
                </div>
              </div>
              <h3 className="font-bold text-base">Gas Leak: Market Street</h3>
              <p className="text-sm text-on-surface-variant line-clamp-2">Response team dispatched. Evacuation in progress for blocks 400-500.</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[12px] font-medium opacity-60">2m ago</span>
                <button className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Details</button>
              </div>
            </div>

            {/* Summary Card 2 */}
            <div className="min-w-[280px] snap-center bg-surface-dim p-4 rounded-2xl border-l-4 border-primary flex flex-col gap-2 shadow-sm text-on-surface">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/20 px-2 py-1 rounded">FACILITY</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="text-[12px] font-medium text-on-surface-variant">Reliability: 100%</span>
                </div>
              </div>
              <h3 className="font-bold text-base">Shelter Capacity Update</h3>
              <p className="text-sm text-on-surface-variant line-clamp-2">Grace Cathedral shelter is now at 92% capacity. Redirecting new arrivals.</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[12px] font-medium opacity-60">15m ago</span>
                <button className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Details</button>
              </div>
            </div>

            {/* Summary Card 3 */}
            <div className="min-w-[280px] snap-center bg-surface-dim p-4 rounded-2xl border-l-4 border-secondary flex flex-col gap-2 shadow-sm text-on-surface">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary-container/20 px-2 py-1 rounded">CITIZEN</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></div>
                  <span className="text-[12px] font-medium text-on-surface-variant">Reliability: 74%</span>
                </div>
              </div>
              <h3 className="font-bold text-base">Water Dist. Point</h3>
              <p className="text-sm text-on-surface-variant line-clamp-2">Volunteer group organized water distribution at Dolores Park south.</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[12px] font-medium opacity-60">34m ago</span>
                <button className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Details</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
