import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const [dashOffset, setDashOffset] = useState(283); // 2 * PI * 45

  useEffect(() => {
    // Animate the reliability dial on mount
    const timer = setTimeout(() => {
      setDashOffset(5.66); // 98% value
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Mock Data
  const user = {
    name: 'Guardian-1',
    role: 'Response Team',
    status: 'Verified Reporter',
    joined: 'Oct 2023',
    reliability: 98,
    reports: 124,
    upvotes: '2.1k'
  };

  return (
    <div className="pt-20 px-4 max-w-4xl mx-auto space-y-6 pb-24">
      
      {/* Profile Header Section */}
      <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          {/* Reliability Score Dial */}
          <svg className="w-32 h-32 -rotate-90 origin-center" viewBox="0 0 100 100">
            <circle 
              className="text-surface-container-high" 
              cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8" 
            />
            <circle 
              className="text-primary-container transition-[stroke-dashoffset] duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)]" 
              cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-primary">{user.reliability}%</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">Reliability</span>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase tracking-wider self-center md:self-auto">
              {user.status}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">{user.role} • Active since {user.joined}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
            <div className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm fill-icon">verified</span>
              <span className="text-xs font-medium">{user.reports} Reports</span>
            </div>
            <div className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm fill-icon">thumb_up</span>
              <span className="text-xs font-medium">{user.upvotes} Upvotes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Reliability Growth Chart */}
        <div className="md:col-span-8 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Reliability Growth</h3>
            <span className="text-xs font-medium text-primary">+4.2% this month</span>
          </div>
          <div className="h-48 w-full flex items-end gap-2 px-1">
            <div className="flex-1 bg-primary-container/20 rounded-t-sm h-[40%] relative group">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-inverse-surface text-inverse-on-surface px-1 rounded">82%</div>
            </div>
            <div className="flex-1 bg-primary-container/30 rounded-t-sm h-[55%] relative group"></div>
            <div className="flex-1 bg-primary-container/40 rounded-t-sm h-[65%] relative group"></div>
            <div className="flex-1 bg-primary-container/60 rounded-t-sm h-[75%] relative group"></div>
            <div className="flex-1 bg-primary-container/80 rounded-t-sm h-[88%] relative group"></div>
            <div className="flex-1 bg-primary-container rounded-t-sm h-[98%] relative group"></div>
          </div>
          <div className="flex justify-between mt-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
          </div>
        </div>

        {/* Apply to Volunteer CTA */}
        <div className="md:col-span-4 bg-tertiary-container text-on-tertiary-container p-6 rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden active:scale-95 transition-transform duration-200 cursor-pointer">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-2">Elevate Status</h3>
            <p className="text-sm text-tertiary-fixed opacity-90">Join the Volunteer Response Network. Help your community in real-time.</p>
          </div>
          <div className="mt-6 z-10">
            <button className="bg-white text-tertiary-container text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-full w-full shadow-md">Apply to Volunteer</button>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl opacity-10">shield</span>
        </div>

        {/* Incident History */}
        <div className="md:col-span-7 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold mb-6">Recent Incident Reports</h3>
          <div className="space-y-4">
            {/* Report Item 1 */}
            <div className="flex gap-4 p-3 hover:bg-surface-container transition-colors rounded-lg group cursor-pointer border-l-4 border-error">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Incident preview" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuALNN09mlwRlWqwbsUTU7Is4m0GQJoMDHRjppsMo7Ng3t9mHfFfQGEhD3eMlaqreICB28ktQbeDxw1xRt3XwsKmE5rfVMPXBS9JEeXgVwhQOcjq572LsmbTiWNDC-NDlds3zgxGJe7N-MkCxsBlgN-YzQ-VDcA5516StFJoEVdnq0PK--IbFLaeNvzms7sv4Lza5R_GAlhVWqI0uxjriIx4norAx4o1vm5uOcsAUzIsE_bl28wc1GiK"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-bold truncate">Structural Alert: Main St</h4>
                  <span className="text-xs font-medium text-error">Critical</span>
                </div>
                <p className="text-sm text-on-surface-variant truncate">Reported structural instability after tremor...</p>
                <div className="flex items-center gap-4 mt-1 text-xs font-medium text-outline">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> 2h ago</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">thumb_up</span> 42</span>
                </div>
              </div>
            </div>

            {/* Report Item 2 */}
            <div className="flex gap-4 p-3 hover:bg-surface-container transition-colors rounded-lg group cursor-pointer border-l-4 border-primary">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Incident preview" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-u3-Mswpdwuo35NZNo6YmzsAWTnxLmRI0KXlMvO-JVixDTEigDk_vlOf_gdurYGcwIn1hqNzqQUDQiro2rDzWUr4TR2m1CAG8JUoZAKxF8spbP8I0ot6PHrnV2gTwoukDU3jE7DpzToji_F1epR_6C4Lbj5I5jfr0HzyATLjcFWn63FQu_LZ95VCrh2YTsTLlfTjWMOpr6CCxh8QvrD5R783eKJWK6rRiWMD3PdbyiJfYWBOZDV2H"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-bold truncate">Traffic Reroute: Zone 4</h4>
                  <span className="text-xs font-medium text-primary">Informational</span>
                </div>
                <p className="text-sm text-on-surface-variant truncate">Minor congestion due to local event...</p>
                <div className="flex items-center gap-4 mt-1 text-xs font-medium text-outline">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> 1d ago</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">thumb_up</span> 156</span>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 text-xs font-bold uppercase tracking-wider text-primary py-2 border border-primary/20 rounded-lg hover:bg-primary-fixed transition-colors">View All History</button>
        </div>

        {/* Settings Links */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/30">
              <h3 className="text-xl font-bold">Account Settings</h3>
            </div>
            <div className="divide-y divide-outline-variant/20 flex flex-col">
              <Link to="#" className="flex items-center justify-between p-4 hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">person_outline</span>
                  <span className="text-base">Identity Verification</span>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </Link>
              <Link to="#" className="flex items-center justify-between p-4 hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">notifications_active</span>
                  <span className="text-base">Alert Preferences</span>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </Link>
              <Link to="#" className="flex items-center justify-between p-4 hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">security</span>
                  <span className="text-base">Privacy & Security</span>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </Link>
              <Link to="/login" className="flex items-center justify-between p-4 hover:bg-surface-container transition-colors text-error">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-base">Sign Out</span>
                </div>
              </Link>
            </div>
          </div>
          <div className="bg-surface-container p-6 rounded-xl">
            <p className="text-xs font-medium text-on-surface-variant text-center">Version 2.4.1 (Stable)<br/>© 2024 Protocol Zero Collective</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
