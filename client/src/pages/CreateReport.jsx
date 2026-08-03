import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GoogleMap, useJsApiLoader, Marker, useGoogleMap } from '@react-google-maps/api';
import { useToast } from '../context/ToastContext';
import axiosInstance from '../api/axiosInstance';
import { RESOURCE_TAXONOMY } from '../constants/resources';

// Native Google Maps Circle wrapper to ensure 100% reliable lifecycle & deletion cleanup
const ImpactCircle = ({ ia }) => {
  const map = useGoogleMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const [latStr, lngStr] = (ia.coordinate || '').split(',').map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = parseFloat(ia.radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius) || radius <= 0) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (!circleRef.current) {
      circleRef.current = new window.google.maps.Circle({
        map,
        center: { lat, lng },
        radius: radius,
        fillColor: '#FF0000',
        fillOpacity: 0.25,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
    } else {
      circleRef.current.setCenter({ lat, lng });
      circleRef.current.setRadius(radius);
      circleRef.current.setMap(map);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, ia.coordinate, ia.radius]);

  return null;
};

const CreateReport = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const currentUserRole = currentUser?.accountType || 'User';
  const { showToast } = useToast();
  
  const [reportType, setReportType] = useState('minor');
  const [selectedCategory, setSelectedCategory] = useState('Medical Emergency');
  const [description, setDescription] = useState('');
  
  const [locationCoords, setLocationCoords] = useState(() => {
    if (currentUser?.gps?.coordinates) {
      return { lat: currentUser.gps.coordinates[1], lng: currentUser.gps.coordinates[0] };
    }
    return { lat: 22.3569, lng: 91.7832 }; // Chittagong
  });

  const [images, setImages] = useState([]);
  const [impactAreas, setImpactAreas] = useState([]);
  const [resources, setResources] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const minorCategories = useMemo(() => ([
    { id: 'Medical Emergency', label: 'Medical Emergency', icon: 'medical_services' },
    { id: 'Road Accident', label: 'Road Accident', icon: 'car_crash' },
    { id: 'Road Blockage / Hazard', label: 'Road Blockage / Hazard', icon: 'block' },
    { id: 'Localized Fire', label: 'Localized Fire', icon: 'local_fire_department' },
    { id: 'Theft / Robbery', label: 'Theft / Robbery', icon: 'local_police' },
    { id: 'Violence / Assault', label: 'Violence / Assault', icon: 'swords' },
    { id: 'Missing Person', label: 'Missing Person', icon: 'person_search' },
    { id: 'Utility Failure', label: 'Utility Failure', icon: 'power_off' },
  ]), []);

  const majorCategories = useMemo(() => ([
    { id: 'Flood', label: 'Flood', icon: 'flood' },
    { id: 'Waterlogging', label: 'Waterlogging', icon: 'water_damage' },
    { id: 'Industrial / Widespread Fire', label: 'Industrial / Widespread Fire', icon: 'fire_truck' },
    { id: 'Earthquake', label: 'Earthquake', icon: 'public' },
    { id: 'Structural Collapse', label: 'Structural Collapse', icon: 'domain_disabled' },
    { id: 'Chemical Spill / Gas Leak', label: 'Chemical Spill / Gas Leak', icon: 'warning' },
    { id: 'Cyclone', label: 'Cyclone', icon: 'cyclone' },
    { id: 'Tornado', label: 'Tornado', icon: 'tornado' },
    { id: 'Landslide', label: 'Landslide', icon: 'landscape' },
  ]), []);

  const categories = reportType === 'major' ? majorCategories : minorCategories;

  useEffect(() => {
    // Reset category when type changes
    setSelectedCategory(categories[0].id);
  }, [reportType, categories]);

  const isReporterOrAdmin = ['Reporter', 'Admin', 'SuperAdmin'].includes(currentUserRole);

  const handleSyncGPS = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "warning");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        showToast("Location updated from GPS", "success");
      },
      (error) => {
        showToast("Could not access GPS location.", "error");
      }
    );
  };

  const handleMapClick = (e) => {
    if (reportType === 'major') {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newCoord = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      setImpactAreas(prev => {
        const emptyIndex = prev.findIndex(ia => !ia.coordinate || ia.coordinate.trim() === '');
        if (emptyIndex !== -1) {
          const newAreas = [...prev];
          newAreas[emptyIndex] = { ...newAreas[emptyIndex], coordinate: newCoord };
          return newAreas;
        } else {
          return [...prev, { id: Date.now() + Math.random(), coordinate: newCoord, radius: '500' }];
        }
      });
      showToast("Impact zone coordinate set via map.", "success");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide a description.', 'warning');
      return;
    }
    setIsSubmitting(true);
    
    let parsedImpactAreas = [];
    if (reportType === 'major') {
      parsedImpactAreas = impactAreas.map(ia => {
        const [latStr, lngStr] = ia.coordinate.split(',').map(s => s.trim());
        return {
          coordinate: { type: 'Point', coordinates: [parseFloat(lngStr), parseFloat(latStr)] },
          radius: parseFloat(ia.radius)
        };
      }).filter(ia => !isNaN(ia.radius) && ia.coordinate.coordinates.every(c => !isNaN(c)));
    }

    const parsedResourcesNeeded = reportType === 'major'
      ? resources.map(r => {
          const tax = RESOURCE_TAXONOMY.find(t => t.id === (r.itemId || r.id)) || RESOURCE_TAXONOMY[0];
          return {
            itemId: tax.id,
            itemName: tax.name,
            category: tax.category,
            quantity: Number(r.quantity) || 1,
            unit: tax.defaultUnit
          };
        }).filter(r => r.quantity > 0)
      : undefined;

    const payload = {
      type: reportType,
      category: selectedCategory,
      description,
      location: {
        type: 'Point',
        coordinates: [locationCoords.lng, locationCoords.lat]
      },
      images: images.map(img => img.name),
      impactAreas: reportType === 'major' ? parsedImpactAreas : undefined,
      resourcesNeeded: parsedResourcesNeeded,
    };

    try {
      await axiosInstance.post('/reports', payload);
      showToast('Incident Broadcasted Successfully!', 'success');
      navigate('/home');
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409 && error.response?.data?.existingReportId) {
        showToast(error.response.data.message || 'An active duplicate report exists nearby.', 'warning');
        navigate(`/reports/${error.response.data.existingReportId}`);
      } else {
        showToast(error.response?.data?.message || 'Failed to submit report', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (event) => {
    const fileList = Array.from(event.target.files || []);
    setImages(fileList.map((file) => ({
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    })));
  };

  const addImpactArea = () => {
    setImpactAreas((previous) => ([...previous, { id: Date.now() + Math.random(), coordinate: '', radius: '500' }]));
  };

  const updateImpactArea = (index, field, value) => {
    setImpactAreas((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const removeImpactArea = (idToRemove) => {
    setImpactAreas((previous) => previous.filter((item) => item.id !== idToRemove));
  };

  const addResource = () => {
    setResources((prev) => [...prev, { itemName: '', quantity: '', unit: '' }]);
  };

  const updateResource = (index, field, value) => {
    setResources((prev) => prev.map((item, idx) => (
      idx === index ? { ...item, [field]: value } : item
    )));
  };

  const removeResource = (index) => {
    setResources((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-on-background relative overflow-x-hidden">
      {/* Background styling elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>

      <div className="pt-20 pb-8 px-4 max-w-6xl mx-auto border-b border-outline-variant/30 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-alert-red text-[40px]">cell_tower</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-on-surface">System Intake</h2>
        </div>
        <p className="text-sm font-medium text-on-surface-variant tracking-wide max-w-2xl">
          Submit verified intelligence to the Protocol Zero network. Active incidents will be broadcasted to nearby responders and citizens.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Main Form Area */}
          <section className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-lg overflow-hidden">
            <div className="bg-surface-container-high p-5 flex items-center justify-between border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_document</span>
                <h3 className="text-lg font-bold text-on-surface uppercase tracking-wider">Report Parameters</h3>
              </div>
              <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full">
                Clearance: {currentUserRole}
              </div>
            </div>

            <div className="p-6 space-y-8">
              
              {/* Report Type */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Classification Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <label className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${reportType === 'minor' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'border-outline-variant/50 bg-surface-container-lowest hover:border-outline-variant'}`}>
                    <div className="pt-1">
                      <input
                        type="radio"
                        name="reportType"
                        value="minor"
                        checked={reportType === 'minor'}
                        onChange={() => setReportType('minor')}
                        className="h-4 w-4 accent-primary"
                      />
                    </div>
                    <div>
                      <div className={`font-bold uppercase tracking-wider ${reportType === 'minor' ? 'text-primary' : 'text-on-surface'}`}>Standard Broadcast</div>
                      <div className="text-xs text-on-surface-variant font-medium mt-1">Single-location intelligence update for general awareness.</div>
                    </div>
                  </label>

                  {isReporterOrAdmin && (
                    <label className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${reportType === 'major' ? 'border-alert-red bg-alert-red/5 shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'border-outline-variant/50 bg-surface-container-lowest hover:border-outline-variant'}`}>
                      <div className="pt-1">
                        <input
                          type="radio"
                          name="reportType"
                          value="major"
                          checked={reportType === 'major'}
                          onChange={() => setReportType('major')}
                          className="h-4 w-4 accent-alert-red"
                        />
                      </div>
                      <div>
                        <div className={`font-bold uppercase tracking-wider ${reportType === 'major' ? 'text-alert-red' : 'text-on-surface'}`}>Major Incident</div>
                        <div className="text-xs text-on-surface-variant font-medium mt-1">Wide-area emergency alert. Requires established impact zones.</div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Incident Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-4 text-sm font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Field Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Provide detailed intelligence on the situation. Include immediate risks, responder status, and required resources..."
                  rows="5"
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-4 text-sm font-medium text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Geospatial Coordinates</label>
                <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest overflow-hidden">
                  <div className="bg-surface-container-low p-4 flex items-center justify-between border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">radar</span>
                      <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Target Location</span>
                    </div>
                    <button type="button" onClick={handleSyncGPS} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors">
                      <span className="material-symbols-outlined text-[16px]">my_location</span>
                      Sync GPS
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="h-64 bg-surface-container rounded-lg border border-outline-variant/30 mb-4 relative overflow-hidden">
                      {isLoaded ? (
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={locationCoords}
                          zoom={16}
                          options={{
                            disableDefaultUI: true,
                            zoomControl: true,
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
                              { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#c8d7d4" }] },
                            ]
                          }}
                          onClick={handleMapClick}
                        >
                          <Marker 
                            position={locationCoords} 
                            draggable={true} 
                            onDragEnd={(e) => setLocationCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() })} 
                          />
                          {reportType === 'major' && impactAreas.map((ia) => (
                            <ImpactCircle key={ia.id} ia={ia} />
                          ))}
                        </GoogleMap>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-bold text-sm">Loading Tactical Map...</div>
                      )}
                    </div>
                    <div className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm font-bold text-primary flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>Main Target Coordinates:</span>
                        <span className="text-xs text-on-surface-variant font-medium">Lat: {locationCoords.lat.toFixed(6)}, Lng: {locationCoords.lng.toFixed(6)}</span>
                      </div>
                      {reportType === 'major' && (
                        <span className="text-xs font-bold bg-alert-red/10 text-alert-red px-2 py-1 rounded">Click map to drop Impact Zone</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Areas (Major Only) */}
              {reportType === 'major' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="rounded-xl border border-alert-red/30 bg-alert-red/5 overflow-hidden">
                    <div className="bg-alert-red/10 p-4 flex items-center justify-between border-b border-alert-red/20">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-alert-red">crisis_alert</span>
                        <h4 className="text-sm font-bold text-alert-red uppercase tracking-wider">Impact Zones</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImpactAreas([])}
                          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-alert-red/70 hover:text-alert-red hover:bg-alert-red/10 px-3 py-1.5 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                          Clear All
                        </button>
                        <button
                          type="button"
                          onClick={addImpactArea}
                          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white text-alert-red px-3 py-1.5 rounded-full shadow-sm hover:bg-alert-red hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Add Zone
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {impactAreas.length === 0 ? (
                        <p className="text-xs text-on-surface-variant font-medium italic text-center py-2">No impact zones plotted. Click the map to drop a zone.</p>
                      ) : (
                        impactAreas.map((impactArea, index) => (
                          <div key={impactArea.id} className="flex gap-2 items-center">
                            <input
                              value={impactArea.coordinate}
                              onChange={(event) => updateImpactArea(index, 'coordinate', event.target.value)}
                              placeholder="Latitude, longitude"
                              className="flex-1 rounded-lg border border-alert-red/30 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none transition-colors focus:border-alert-red focus:ring-1 focus:ring-alert-red placeholder:text-alert-red/40"
                            />
                            <input
                              value={impactArea.radius}
                              onChange={(event) => updateImpactArea(index, 'radius', event.target.value)}
                              placeholder="Radius (meters)"
                              className="w-36 rounded-lg border border-alert-red/30 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none transition-colors focus:border-alert-red focus:ring-1 focus:ring-alert-red placeholder:text-alert-red/40"
                            />
                            <button 
                              type="button" 
                              onClick={() => removeImpactArea(impactArea.id)}
                              className="p-2 text-alert-red/60 hover:text-white hover:bg-alert-red rounded-lg transition-colors shrink-0"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">Visual Intelligence (Attachments)</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">cloud_upload</span>
                  <span className="text-sm font-bold text-on-surface">Select media files to upload</span>
                  <span className="mt-1 text-xs font-medium text-on-surface-variant uppercase tracking-wider">PNG, JPG, MP4 (Max 50MB)</span>
                  <input type="file" multiple onChange={handleImageUpload} className="hidden" />
                </label>

                {images.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {images.map((image) => (
                      <div key={image.name} className="flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 shadow-sm">
                        <span className="material-symbols-outlined text-primary">image</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface text-sm truncate">{image.name}</p>
                          <p className="text-xs text-on-surface-variant font-medium">{image.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resource Allocation (Major Only) */}
              {reportType === 'major' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
                    <div className="bg-primary/10 p-4 flex items-center justify-between border-b border-primary/20">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Required Supplies Taxonomy</h4>
                      </div>
                      <button
                        type="button"
                        onClick={addResource}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-surface-container text-primary border border-primary/30 px-3 py-1.5 rounded-full shadow-sm hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Request Resource
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {resources.length === 0 ? (
                        <p className="text-xs text-on-surface-variant font-medium italic text-center py-2">No resources requested. Click "Request Resource" to add required supplies from the official catalog.</p>
                      ) : (
                        resources.map((resource, index) => {
                          const currentTax = RESOURCE_TAXONOMY.find(r => r.id === (resource.itemId || resource.id)) || RESOURCE_TAXONOMY[0];
                          return (
                            <div key={index} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-surface-container-lowest p-2 rounded-lg border border-primary/20">
                              <select
                                value={resource.itemId || currentTax.id}
                                onChange={(event) => {
                                  const selectedTax = RESOURCE_TAXONOMY.find(r => r.id === event.target.value);
                                  updateResource(index, 'itemId', event.target.value);
                                  if (selectedTax) updateResource(index, 'unit', selectedTax.defaultUnit);
                                }}
                                className="flex-1 rounded-lg border border-primary/30 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface outline-none focus:border-primary"
                              >
                                {RESOURCE_TAXONOMY.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    [{item.category}] {item.name}
                                  </option>
                                ))}
                              </select>

                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={resource.quantity || 1}
                                  onChange={(event) => updateResource(index, 'quantity', Math.max(1, parseInt(event.target.value) || 1))}
                                  placeholder="Qty"
                                  className="w-20 rounded-lg border border-primary/30 bg-surface-container-lowest px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary text-center"
                                />
                                <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-2 rounded-lg shrink-0 min-w-[70px] text-center">
                                  {currentTax.defaultUnit}
                                </span>
                              </div>

                              <button 
                                type="button" 
                                onClick={() => removeResource(index)}
                                className="p-2 text-on-surface-variant hover:text-alert-red hover:bg-alert-red/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                                title="Remove item"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Preview & Submit */}
          <aside className="space-y-6">
            
            <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-lg overflow-hidden sticky top-24">
              <div className="bg-surface-container-high p-4 border-b border-outline-variant/30 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">preview</span>
                  Broadcast Preview
                </h3>
              </div>
              
              <div className="p-5">
                {/* Simulated Feed Card */}
                <div className={`border-l-4 rounded-xl shadow-sm overflow-hidden flex flex-col bg-surface-container-lowest ${reportType === 'major' ? 'border-alert-red' : 'border-[#FFB000]'}`}>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">System Operator</p>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Just now</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${reportType === 'major' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'}`}>
                        {reportType === 'major' ? 'HIGH URGENCY' : 'MEDIUM URGENCY'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined ${reportType === 'major' ? 'text-alert-red' : 'text-[#FFB000]'}`}>
                        {categories.find((c) => c.id === selectedCategory)?.icon || 'warning'}
                      </span>
                      <h4 className="font-bold text-on-surface text-base">
                        {categories.find((c) => c.id === selectedCategory)?.label || 'Incident'}
                      </h4>
                    </div>
                    <p className="text-sm text-on-surface-variant line-clamp-3">
                      {description || 'Incident description preview will appear here as you type...'}
                    </p>
                  </div>
                  <div className="bg-surface-container px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant border-t border-outline-variant/30 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    <span className="truncate">{locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`mt-6 w-full rounded-xl px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${reportType === 'major' ? 'bg-alert-red hover:bg-red-700 shadow-alert-red/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{isSubmitting ? 'hourglass_empty' : 'send_and_archive'}</span>
                  {isSubmitting ? 'Transmitting...' : 'Transmit Data'}
                </button>

                <p className="mt-4 text-[10px] font-medium uppercase tracking-widest text-on-surface-variant text-center leading-relaxed">
                  UI PREVIEW ONLY. Transmission simulates a database transaction and redirects to the feed.
                </p>
              </div>
            </div>

          </aside>
        </form>
      </div>
    </div>
  );
};

export default CreateReport;
