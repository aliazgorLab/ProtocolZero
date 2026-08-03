import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateReport = () => {
  const currentUserRole = 'User';
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
    { id: 'general-hazard', label: 'General Hazard' },
    { id: 'fire', label: 'Fire' },
    { id: 'medical', label: 'Medical' },
    { id: 'crime', label: 'Crime' },
    { id: 'flood', label: 'Flood' },
    { id: 'infrastructure', label: 'Infrastructure' },
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.04),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Incident intake</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Create Report</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Dummy-only form preview for Protocol Zero. This screen is intentionally static and does not call the API.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Report Details</h3>
                <p className="mt-1 text-sm text-slate-500">Use the controls below to shape the incident broadcast.</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Role: {currentUserRole}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Report Type</label>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition ${reportType === 'minor' ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="reportType"
                      value="minor"
                      checked={reportType === 'minor'}
                      onChange={() => setReportType('minor')}
                      className="h-4 w-4 accent-slate-950"
                    />
                    <div>
                      <div className="font-medium">Minor</div>
                      <div className={`text-sm ${reportType === 'minor' ? 'text-slate-200' : 'text-slate-500'}`}>Single-location incident update</div>
                    </div>
                  </label>

                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition ${reportType === 'major' ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-300'} ${majorLocked ? 'opacity-60' : ''}`}>
                    <input
                      type="radio"
                      name="reportType"
                      value="major"
                      checked={reportType === 'major'}
                      disabled={majorLocked}
                      onChange={() => setReportType('major')}
                      className="h-4 w-4 accent-slate-950 disabled:cursor-not-allowed"
                    />
                    <div>
                      <div className="font-medium">Major</div>
                      <div className={`text-sm ${reportType === 'major' ? 'text-slate-200' : 'text-slate-500'}`}>Broadcast with impact area detail</div>
                    </div>
                  </label>
                </div>
                {majorLocked && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Only verified Reporters can issue Major broadcasts.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what happened, what you observed, and any immediate risks..."
                  rows="6"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location</label>
                <div className="mt-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Map placeholder</p>
                      <p className="mt-1 text-sm text-slate-500">Use the location picker later. This box represents the map selection area.</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Use My Location
                    </button>
                  </div>
                  <input
                    value={locationLabel}
                    onChange={(event) => setLocationLabel(event.target.value)}
                    placeholder="Lat / Lng or selected address"
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Images</label>
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-slate-100/60">
                  <span className="text-sm font-medium text-slate-900">Upload supporting files</span>
                  <span className="mt-1 text-sm text-slate-500">PNG, JPG, MP4, or PDF</span>
                  <input type="file" multiple onChange={handleImageUpload} className="hidden" />
                </label>

                {images.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {images.map((image) => (
                      <div key={image.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                        <p className="font-medium text-slate-900">{image.name}</p>
                        <p className="mt-1 text-slate-500">{image.size}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reportType === 'major' && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-950">Impact Areas</h4>
                      <p className="mt-1 text-sm text-slate-500">Coordinate and radius list for major broadcasts.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addImpactArea}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      + Add Area
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {impactAreas.map((impactArea, index) => (
                      <div key={`${index}-${impactArea.coordinate}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1.3fr_0.7fr]">
                        <input
                          value={impactArea.coordinate}
                          onChange={(event) => updateImpactArea(index, 'coordinate', event.target.value)}
                          placeholder="Longitude, latitude"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                        <input
                          value={impactArea.radius}
                          onChange={(event) => updateImpactArea(index, 'radius', event.target.value)}
                          placeholder="Radius (meters)"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</h3>
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">{reportType.toUpperCase()}</span>
                  <span className="text-xs text-slate-500">Draft</span>
                </div>
                <p className="mt-4 text-base font-semibold text-slate-950">{categories.find((category) => category.id === selectedCategory)?.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description || 'Incident description preview appears here.'}</p>
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                  {locationLabel || 'Selected location will appear here.'}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800"
            >
              Broadcast Report
            </button>

            <p className="text-xs leading-5 text-slate-500">
              This page is intentionally static and uses dummy state only. The submit action logs the current form payload to the console and returns to the home view.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default CreateReport;
