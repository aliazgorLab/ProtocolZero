import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CreateReport = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const currentUserRole = currentUser?.accountType || 'User';
  
  const [reportType, setReportType] = useState('minor');
  const [selectedCategory, setSelectedCategory] = useState('general-hazard');
  const [description, setDescription] = useState('');
  const [locationLabel, setLocationLabel] = useState('45th St & Madison Avenue, New York, NY');
  const [images, setImages] = useState([]);
  const [impactAreas, setImpactAreas] = useState([
    { coordinate: '40.7632, -73.9721', radius: '250' },
  ]);
  const navigate = useNavigate();

  const categories = useMemo(() => ([
    { id: 'general-hazard', label: 'General Hazard', icon: 'warning' },
    { id: 'fire', label: 'Fire', icon: 'local_fire_department' },
    { id: 'medical', label: 'Medical Emergency', icon: 'medical_services' },
    { id: 'crime', label: 'Security / Crime', icon: 'local_police' },
    { id: 'flood', label: 'Flood / Weather', icon: 'flood' },
    { id: 'infrastructure', label: 'Infrastructure Failure', icon: 'engineering' },
  ]), []);

  const majorLocked = currentUserRole === 'User' || currentUserRole === 'Volunteer';

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      reportType,
      category: selectedCategory,
      description,
      location: locationLabel,
      images,
      impactAreas: reportType === 'major' ? impactAreas : [],
    };
    console.log('Dummy report payload', payload);
    navigate('/home');
  };

  const handleImageUpload = (event) => {
    const fileList = Array.from(event.target.files || []);
    setImages(fileList.map((file) => ({
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    })));
  };

  const addImpactArea = () => {
    setImpactAreas((previous) => ([...previous, { coordinate: '', radius: '' }]));
  };

  const updateImpactArea = (index, field, value) => {
    setImpactAreas((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
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

                  <label className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${majorLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${reportType === 'major' ? 'border-alert-red bg-alert-red/5 shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'border-outline-variant/50 bg-surface-container-lowest hover:border-outline-variant'}`}>
                    <div className="pt-1">
                      <input
                        type="radio"
                        name="reportType"
                        value="major"
                        checked={reportType === 'major'}
                        disabled={majorLocked}
                        onChange={() => setReportType('major')}
                        className="h-4 w-4 accent-alert-red disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className={`font-bold uppercase tracking-wider ${reportType === 'major' ? 'text-alert-red' : 'text-on-surface'}`}>Major Incident</div>
                      <div className="text-xs text-on-surface-variant font-medium mt-1">Wide-area emergency alert. Requires established impact zones.</div>
                    </div>
                    {majorLocked && (
                      <div className="absolute -top-3 -right-2 bg-surface-container-highest text-on-surface-variant text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm border border-outline-variant/30">
                        Restricted
                      </div>
                    )}
                  </label>

                </div>
                {majorLocked && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-bold text-alert-red bg-alert-red/10 px-4 py-2 rounded-lg">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    Major incident broadcasts require Verified Reporter or Admin clearance.
                  </p>
                )}
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
                    <button type="button" className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors">
                      <span className="material-symbols-outlined text-[16px]">my_location</span>
                      Sync GPS
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="h-32 bg-surface-container rounded-lg border border-outline-variant/30 mb-4 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest z-10">[ Tactical Map UI Hidden ]</span>
                    </div>
                    <input
                      value={locationLabel}
                      onChange={(event) => setLocationLabel(event.target.value)}
                      placeholder="Lat / Lng or selected address"
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm font-medium text-on-surface outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </div>
              </div>

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

              {/* Impact Areas (Major Only) */}
              {reportType === 'major' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="rounded-xl border border-alert-red/30 bg-alert-red/5 overflow-hidden">
                    <div className="bg-alert-red/10 p-4 flex items-center justify-between border-b border-alert-red/20">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-alert-red">crisis_alert</span>
                        <h4 className="text-sm font-bold text-alert-red uppercase tracking-wider">Impact Zones</h4>
                      </div>
                      <button
                        type="button"
                        onClick={addImpactArea}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white text-alert-red px-3 py-1.5 rounded-full shadow-sm hover:bg-alert-red hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Zone
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {impactAreas.map((impactArea, index) => (
                        <div key={`${index}-${impactArea.coordinate}`} className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
                          <input
                            value={impactArea.coordinate}
                            onChange={(event) => updateImpactArea(index, 'coordinate', event.target.value)}
                            placeholder="Longitude, latitude"
                            className="w-full rounded-lg border border-alert-red/30 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none transition-colors focus:border-alert-red focus:ring-1 focus:ring-alert-red placeholder:text-alert-red/40"
                          />
                          <input
                            value={impactArea.radius}
                            onChange={(event) => updateImpactArea(index, 'radius', event.target.value)}
                            placeholder="Radius (meters)"
                            className="w-full rounded-lg border border-alert-red/30 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface outline-none transition-colors focus:border-alert-red focus:ring-1 focus:ring-alert-red placeholder:text-alert-red/40"
                          />
                        </div>
                      ))}
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
                    <span className="truncate">{locationLabel || 'Location not set'}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`mt-6 w-full rounded-xl px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${reportType === 'major' ? 'bg-alert-red hover:bg-red-700 shadow-alert-red/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">send_and_archive</span>
                  Transmit Data
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
