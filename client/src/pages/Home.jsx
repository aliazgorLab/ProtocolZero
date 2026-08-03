import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateLiveLocation } from '../features/auth/authSlice';
import { useToast } from '../context/ToastContext';

const Home = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Simple interaction states
  const [activeCard, setActiveCard] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);

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

  return (
    <main className="pt-14 pb-24 min-h-screen">
      {/* Interactive Map Section (Sticky Top 30%) */}
      <section className="sticky top-14 h-[309px] w-full z-30 shadow-md">
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
            <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
            </div>
          )}
          <div className="absolute inset-0 map-gradient-overlay pointer-events-none"></div>

          {/* Floating Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
            <button 
              onClick={handleRecenter}
              className="bg-surface/90 backdrop-blur shadow-lg p-2 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined">my_location</span>
            </button>
            <button className="bg-surface/90 backdrop-blur shadow-lg p-2 rounded-lg text-on-surface hover:bg-surface-container-high transition-colors active:scale-95">
              <span className="material-symbols-outlined">layers</span>
            </button>
          </div>

          {/* Active Incident Pill */}
          <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-auto">
            <div className="bg-alert-red text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg animate-pulse">
              <span className="material-symbols-outlined text-sm">error</span>
              3 LIVE INCIDENTS
            </div>
          </div>
        </div>
      </section>

      {/* Incident Feed */}
      <div className="px-4 py-6 flex flex-col gap-6 relative z-40 bg-background/50 backdrop-blur-sm -mt-2">
        
        {/* Prominent Action Bar */}
        <div className="bg-primary-container text-on-primary-container p-4 rounded-xl flex items-center justify-between shadow-sm border border-primary/10 mb-2">
          <div>
            <h3 className="font-bold text-sm">Location Sync</h3>
            <p className="text-xs opacity-80">Keep your coordinates updated</p>
          </div>
          <button 
            onClick={handleRecenter}
            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            SYNC GPS
          </button>
        </div>

        {/* Feed Filter/Header */}
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-xl font-bold text-on-surface">Live Feed</h2>
          <button className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider bg-primary-fixed px-3 py-1 rounded-full hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            FILTERS
          </button>
        </div>

        {/* Incident Card 1: Major Alert */}
        <article
          className={`bg-white border-l-4 border-alert-red rounded-xl shadow-sm overflow-hidden flex flex-col transition-transform duration-200 ${activeCard === 1 ? 'scale-[0.98]' : 'scale-100'}`}
          onTouchStart={() => setActiveCard(1)}
          onTouchEnd={() => setActiveCard(null)}
          onMouseDown={() => setActiveCard(1)}
          onMouseUp={() => setActiveCard(null)}
          onMouseLeave={() => setActiveCard(null)}
        >
          {/* Header Info */}
          <div className="p-4 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                className="w-10 h-10 rounded-full bg-surface-container-high object-cover"
                alt="Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqoyG8tEif73rfEDjOHKVgZJoOwWTrnUyTHGysN93pr35p-3DfmHN6xRUolUu6XfXlL2XDiejFnGKbXZtevEtmIhkOYt_-iy5PiQ4B7kEld0MlCMQ09H3MCKTvdttHGwUi04D1cQrUMFWRX2pm5oMb8YtP932cvycB1Y6sCLwBi_EYIsBOvYWjZS2KZJIwnqq10XtJ9PdkdJshLWNt0azrQo6jWnmaADsvvir_72YRpw1nskVltV-e"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-on-surface">Guardian-1</span>
                  <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Response Team</span>
                </div>
                <span className="text-on-surface-variant text-xs font-medium">200m away • 4 mins ago</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider">HIGH URGENCY</div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-[spin_3s_linear_infinite] flex items-center justify-center">
                  <span className="text-[9px] font-bold">98</span>
                </div>
                <span className="text-xs font-medium text-primary">Verified</span>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-alert-red fill-icon">local_fire_department</span>
              <h3 className="font-bold text-on-surface text-base">Structure Fire: 4th Street Plaza</h3>
            </div>
            <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">Significant smoke visible from the commercial building. Emergency services dispatched. Avoid the area to clear paths for responders.</p>

            {/* Image Preview */}
            <div className="rounded-lg overflow-hidden h-40 bg-surface-container relative">
              <img
                className="w-full h-full object-cover"
                alt="Incident photo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5b5KQKcyhmR3IfeB8xc332OiQKRs9yrXFAtdgWdb4QQsL_C3YwVFiRWCHDSjF6VLiNx6mLZBhwUPPxDecBlIDHPdw4xwzxA0gm0mc_7MHC_ww3URHEiVHYUF2eZs96tJjBEcAMSlqUEXOS4ZTqPI-_6R4BUDR4YQ08ZLC0Yj0O_Nc3-VXWcXfsMkdZD3ywy1Rp8iosfIuL0vRowAaQgYindtu86CF4FhsZ73i-gxs2xVDXKOb4H17"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                +4 Images
              </div>
            </div>
          </div>

          {/* Interaction Footer */}
          <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                <span className="text-xs font-medium">12</span>
              </div>
              <div className="flex items-center bg-surface-container-high rounded-full overflow-hidden">
                <button className="px-3 py-1.5 hover:bg-primary/10 text-primary transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <div className="w-[1px] h-4 bg-outline-variant"></div>
                <button className="px-3 py-1.5 hover:bg-error/10 text-on-surface-variant transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-primary hover:bg-surface-variant rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="bg-primary hover:bg-primary-container text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform">
                OPEN MAP
              </button>
            </div>
          </div>
        </article>

        {/* Incident Card 2: Minor Alert */}
        <article
          className={`bg-white border-l-4 border-[#FFB000] rounded-xl shadow-sm overflow-hidden flex flex-col transition-transform duration-200 ${activeCard === 2 ? 'scale-[0.98]' : 'scale-100'}`}
          onTouchStart={() => setActiveCard(2)}
          onTouchEnd={() => setActiveCard(null)}
          onMouseDown={() => setActiveCard(2)}
          onMouseUp={() => setActiveCard(null)}
          onMouseLeave={() => setActiveCard(null)}
        >
          {/* Header Info */}
          <div className="p-4 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                className="w-10 h-10 rounded-full bg-surface-container-high object-cover"
                alt="Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwXIDDjZ6UrGAuUZWT65t_iIL7xsyuuvX24bz6-F1qf7w-5W08-SmbeLDrETc_NWIT6GcR4KPs54jjOiMO3l4h5-Ip1BSNJA_6J-LfDgYu6u49gBgeXgZ4R8ICgzkeU5lRUTDDse1HTFJ8qe-ZSFs4FFzikaxgGhHgCE1zCtY8ls1Vvg5ozeituY2cvVZQ1YnTzaCVobL4EexuL-l30vkNHoDW7Rjvq8oF4HvnqDfBCr6Ab4canFUR"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-on-surface">Volunteer-88</span>
                  <span className="bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32] text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Volunteer</span>
                </div>
                <span className="text-on-surface-variant text-xs font-medium">1.2km away • 15 mins ago</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider">MEDIUM URGENCY</div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full border-2 border-tertiary border-t-transparent flex items-center justify-center">
                  <span className="text-[9px] font-bold">82</span>
                </div>
                <span className="text-xs font-medium text-tertiary">Verified</span>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary fill-icon">medical_services</span>
              <h3 className="font-bold text-on-surface text-base">Downed Power Line: Oak St.</h3>
            </div>
            <p className="text-on-surface-variant text-sm line-clamp-2">Power line obstructed by fallen branch. Minimal sparking. Utility company notified but yet to arrive. Please use alternate route.</p>
          </div>

          {/* Interaction Footer */}
          <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                <span className="text-xs font-medium">5</span>
              </div>
              <div className="flex items-center bg-surface-container-high rounded-full overflow-hidden">
                <button className="px-3 py-1.5 hover:bg-primary/10 text-primary transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <div className="w-[1px] h-4 bg-outline-variant"></div>
                <button className="px-3 py-1.5 hover:bg-error/10 text-on-surface-variant transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-primary hover:bg-surface-variant rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="bg-primary hover:bg-primary-container text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform">
                OPEN MAP
              </button>
            </div>
          </div>
        </article>

        {/* Incident Card 3: Resolved */}
        <article
          className={`bg-white border-l-4 border-green-500 rounded-xl shadow-sm overflow-hidden flex flex-col opacity-80 transition-transform duration-200 ${activeCard === 3 ? 'scale-[0.98]' : 'scale-100'}`}
          onTouchStart={() => setActiveCard(3)}
          onTouchEnd={() => setActiveCard(null)}
          onMouseDown={() => setActiveCard(3)}
          onMouseUp={() => setActiveCard(null)}
          onMouseLeave={() => setActiveCard(null)}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <span className="material-symbols-outlined fill-icon">check_circle</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Resolved: Traffic Signal Malfunction</h3>
                <span className="text-on-surface-variant text-xs font-medium">Market & 5th • Resolved 2h ago</span>
              </div>
            </div>
            <span className="text-green-700 font-bold text-xs uppercase tracking-wider bg-green-50 px-2 py-1 rounded">CLEAR</span>
          </div>
        </article>

      </div>
    </main>
  );
};

export default Home;
