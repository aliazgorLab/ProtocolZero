import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateReport = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 'medical', label: 'Medical', icon: 'medical_services', activeClass: 'bg-error-container text-on-error-container border-error/20' },
    { id: 'fire', label: 'Fire', icon: 'local_fire_department', activeClass: 'bg-tertiary-container text-white' },
    { id: 'traffic', label: 'Traffic', icon: 'traffic', activeClass: 'bg-primary-container text-white' },
    { id: 'crime', label: 'Crime', icon: 'gavel', activeClass: 'bg-inverse-surface text-white' },
    { id: 'other', label: 'Other', icon: 'more_horiz', activeClass: 'bg-secondary-container text-on-secondary-container' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }
    if (!isConfirmed) {
      alert('Please confirm accuracy');
      return;
    }
    
    // TODO: connect to real API
    console.log('Submitting report', { category: selectedCategory, description });
    alert('Report submitted successfully!');
    navigate('/home');
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto mb-12">
      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-on-background">Create Incident Report</h2>
        <p className="text-sm text-on-surface-variant">Provide accurate details to assist response teams and alert the community.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
        {/* Left Column: Map and Location (6/12 Desktop, 12/12 Mobile) */}
        <section className="col-span-12 lg:col-span-7 space-y-4">
          <div className="relative bg-surface-container rounded-xl overflow-hidden h-[400px] shadow-sm border border-outline-variant/30">
            {/* Map Mockup */}
            <div 
              className="absolute inset-0 grayscale opacity-40 bg-cover bg-center" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCS4PlV6pkJawYDEQV7fGmEyH6GP7dp-U9A2JJ3tVCxtB4U1tBkvGyvnXLRNbzV6jlpPAVO75LA6DMXMR0pDs1rRM9ec6rPYt9sMsUUR6SWiszFcqaiMm1WP9ah0JEyGYXnMrIU4TWPf4BYMXmTkCZhKLpy8-f55ekwxR5NElaRefY7HANPyGwTJcjvlQrMTf5ZD__ob42jZ7wTtTWbCt4yd0vgS5z8y2Wb64fJzTTF2A8XpUt-y33Q')" }}
            ></div>
            
            {/* Center Pin */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform -translate-y-6">
                  <span className="material-symbols-outlined fill-icon">location_on</span>
                </div>
                <div className="w-2 h-2 bg-primary rounded-full shadow-md"></div>
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button type="button" className="w-10 h-10 bg-surface rounded-lg shadow-md flex items-center justify-center hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface">my_location</span>
              </button>
              <button type="button" className="w-10 h-10 bg-surface rounded-lg shadow-md flex items-center justify-center hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface">layers</span>
              </button>
            </div>
            
            {/* Impact Radius Tool (Reporter Variant) */}
            <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-sm p-4 rounded-xl shadow-lg max-w-[200px] w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm fill-icon">radio_button_checked</span>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Impact Radius</span>
              </div>
              <input 
                className="w-full h-1 bg-outline-variant rounded-full appearance-none cursor-pointer accent-primary" 
                max="1000" min="50" step="50" type="range" defaultValue="250"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-medium text-on-surface-variant">50m</span>
                <span className="text-[10px] font-bold text-primary">250m</span>
                <span className="text-[10px] font-medium text-on-surface-variant">1km</span>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
            <div className="flex items-start gap-4">
              <div className="bg-primary-container p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">location_on</span>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Selected Location</span>
                <h3 className="text-xl font-bold text-on-surface">45th St & Madison Avenue</h3>
                <p className="text-sm text-on-surface-variant">New York, NY 10017, USA</p>
              </div>
              <button type="button" className="text-primary font-bold text-sm px-4 py-2 hover:bg-primary-fixed/50 rounded-full transition-colors">Edit</button>
            </div>
          </div>
        </section>

        {/* Right Column: Form Details (6/12 Desktop, 12/12 Mobile) */}
        <section className="col-span-12 lg:col-span-5 space-y-4">
          
          {/* Category Selector */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
            <h3 className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Select Category</h3>
            <div className="grid grid-cols-5 gap-2">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const baseClass = "flex flex-col items-center gap-2 p-2 rounded-xl transition-all active:scale-95";
                const colorClass = isActive 
                  ? cat.activeClass 
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest";
                
                return (
                  <button 
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`${baseClass} ${colorClass}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>{cat.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Incident Description */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
            <h3 className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">What's happening?</h3>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-32 p-4 bg-surface border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none placeholder:text-outline-variant" 
              placeholder="Describe the emergency or situation clearly..."
            ></textarea>
          </div>
          
          {/* Media Upload */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
            <h3 className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Evidence / Media</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square relative rounded-lg overflow-hidden border border-dashed border-outline-variant flex flex-col items-center justify-center hover:bg-surface-container transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">add_a_photo</span>
                <span className="text-[10px] font-medium text-outline mt-1">Photo/Video</span>
              </div>
              
              <div className="aspect-square relative rounded-lg overflow-hidden group">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Accident preview" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhvY0M-c3e6h5DfmKxncMs9eGpQCPC_cVNPIpR2DXXuQRaEUME2js4PULZVpdqap2RnowTfNfKRG7xwZ4Z_TvDcn-a2B4LTK-lHN_kJ3kwJX2z4swLJOBH1oMkGWXlFXoGEefBmZRiA1E_UJn5F_MKnNjg-JSBY7uhGWoBSvb8tfYQm_nfth9D7SwOTQVYGEsSKaoqLNRgqgXOu6BFSc4Lu_0EUZL0NuEwrdFZyTAN1knxIb_WR1XN"
                />
                <button type="button" className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              
              <div className="aspect-square relative rounded-lg overflow-hidden group">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Fire preview" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqEnWLb7rpL3EhLJpsBJDsGqMOtVUdAkzn-kXTnSQzlO12NJ_zIUAhvx3AiLJ4yob2qlvdYJmfEv4z09lVDbi0rlwj0ZwqSgkRppBkvm7HS9fNN80vKN7wC3Dk_godiyV8OkMULXCJ7DJpe5dtmesliW3KZ8DOVu4QLrZY-Z4ekKEsg-sf34By2yiyAO96IqHiZjO9M5mXGWWwXkP4ossNQ3_8u5o6lVauzMAYOxFSKfHkAAiQgcaX"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-white">play_circle</span>
                </div>
                <button type="button" className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Confirmation and Submission */}
          <div className="space-y-4 pt-4">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center h-6">
                <input 
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-on-surface font-semibold group-hover:text-primary transition-colors">Confirm Accuracy</span>
                <span className="text-[11px] text-on-surface-variant">I certify that this information is accurate to the best of my knowledge. Misuse of this platform is subject to penalties.</span>
              </div>
            </label>
            
            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined fill-icon">send</span>
              Submit Incident Report
            </button>
          </div>
          
        </section>
      </form>
    </div>
  );
};

export default CreateReport;
