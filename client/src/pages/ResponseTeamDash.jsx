import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ResponseTeamDash = () => {
  const navigate = useNavigate();
  // TODO: Connect to real API for alerts and system status
  const [activeAlerts] = useState(5);
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className="bg-background text-on-surface flex flex-col h-screen overflow-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm flex justify-between items-center px-4 h-14">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">menu</button>
          <h1 className="text-xl font-bold text-primary">Protocol Zero</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-error-container text-on-error-container px-3 py-1 rounded-full items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-[16px] fill-icon">emergency</span>
            <span className="text-xs font-bold uppercase tracking-wider">3 ACTIVE INCIDENTS</span>
          </div>
          <button className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">search</button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="mt-14 flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar Navigation (Drawer Desktop) */}
        <aside className="hidden md:flex flex-col h-full w-80 bg-surface-container-lowest shadow-xl py-6 px-4 z-40">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
              <img 
                className="w-full h-full object-cover" 
                alt="Profile portrait" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4xy256T9QW8keJFd6WG8Ua3yu1rqUNWGF1456ImRUNZq5kTutTew2IxhoQL5WTKNfrzlawAJvD0tT8UwgtSEd3HlVHQkykSiiA7YLDHDRjrPBB6zW02rQKcbm0cJRdzYRrByON-xOG1OMEk50axCLTPepz-vf0eJn2SQTl7_e7OH10BOtURDX54dUj7BD-0iJZzMMcyivqzzpY0o2CaPs-EziLWuTOG-qX5w5RRSCGQKtZqk-cVXC"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">Guardian-1</h3>
              <p className="text-xs font-medium text-on-surface-variant">Response Team • 98% Reliability</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2">
            <Link to="/response-dashboard" className="bg-secondary-container text-on-secondary-container font-bold rounded-full px-4 py-3 flex items-center gap-4 active:opacity-80 transition-opacity">
              <span className="material-symbols-outlined fill-icon">dashboard</span>
              <span className="text-base">Control Deck</span>
            </Link>
            <Link to="#" className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-high transition-colors rounded-full">
              <span className="material-symbols-outlined">history</span>
              <span className="text-base">Incident History</span>
            </Link>
            <Link to="#" className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-high transition-colors rounded-full">
              <span className="material-symbols-outlined">group</span>
              <span className="text-base">Volunteer Network</span>
            </Link>
            <Link to="#" className="text-on-surface-variant px-4 py-3 flex items-center gap-4 hover:bg-surface-container-high transition-colors rounded-full mt-auto">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-base">Settings</span>
            </Link>
          </nav>
          
          <div className="mt-auto pt-6">
            <div className="p-4 bg-surface-container-high rounded-xl">
              <p className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">SYSTEM STATUS</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium">Grid Secure</span>
              </div>
              <div className="w-full bg-outline-variant h-1 rounded-full overflow-hidden">
                <div className="bg-primary w-4/5 h-full"></div>
              </div>
              <p className="mt-1 text-xs font-medium text-on-surface-variant">42/50 Responders Online</p>
            </div>
          </div>
        </aside>

        {/* Map Canvas (Core Jurisdictional View) */}
        <section className="flex-1 relative bg-surface-dim">
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAdTtAGxGQ1GdAdwUXgw-glvJzwFlnD5ig45XaKP1AAIUUS5EN0yTUY21SgmGPgn8J-7ASab3ks6eunqtfkz7NmSOeAgmzZCTW8iDU0pl6FimUVaasZPNyKP81Ya35x5QfWVUTGNPawzOehzYY5PC-wCtOeK2tyutj9qTh-LXG-ov2LFJKOtID0Tpcxma-rmcLvAQkpdK5yFlJD267XxTHsjrKhsixdFt0ULQM33j8NMVGLfQi89ZwA')" }}
            ></div>
          </div>
          
          {/* Overlays: Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button className="bg-surface shadow-md p-2 rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface">layers</span>
            </button>
            <button className="bg-surface shadow-md p-2 rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface">my_location</span>
            </button>
            <button className="bg-surface shadow-md p-2 rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface">add</span>
            </button>
            <button className="bg-surface shadow-md p-2 rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface">remove</span>
            </button>
          </div>
          
          {/* Active Colleague Markers (Simulated) */}
          <div className="absolute top-1/3 left-1/4 z-10 group">
            <div className="w-8 h-8 rounded-full border-2 border-primary bg-white shadow-lg overflow-hidden flex items-center justify-center">
              <img 
                className="w-full h-full object-cover" 
                alt="First responder avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2GaUVHQour1dCcHspZkNdFe0cxaGVuvGXKiSPYXnf8p4cRZdEkP7jPp8F78uK22FglsoQYW35MBabBbuabjKWT2M2ccU7Gw3wHo_CR2cf5vjCEG3ubbxqLqEzhb2VTIrf0QHBb1V_5mLoaCJ35LwPZsJaQQ6oQ8yPX29-LqQr7eebfc4cneqMBRQpJjNn8uDbCi2slqIl1akuODqsCbhsFFMy3Ot2wJBQaDBSDRlpu1ho43_Wd5eE"
              />
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-0.5 rounded whitespace-nowrap">Rescuer-4</div>
          </div>
          
          <div className="absolute top-1/2 right-1/3 z-10 group">
            <div className="w-10 h-10 rounded-full border-2 border-error bg-white shadow-lg flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-error fill-icon">warning</span>
            </div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-error text-on-error font-bold text-[10px] px-2 py-1 rounded-full shadow-lg whitespace-nowrap">ACTIVE ALERT #921</div>
          </div>
          
          {/* Resource Dispatch Panel (Bottom Center Floating) */}
          <div className="absolute bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-20 w-[90%] md:w-auto">
            <div className="bg-surface/90 backdrop-blur-md shadow-lg rounded-2xl p-4 flex flex-wrap md:flex-nowrap items-center gap-4 border border-white/20">
              <div className="flex flex-col pr-4 border-r border-outline-variant">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Resource Dispatch</span>
                <span className="text-xl font-bold text-on-surface">Zone 4 Ready</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span> DEPLOY LOGISTICS
                </button>
                <button className="px-4 py-2 bg-secondary text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">medical_services</span> DISPATCH EMS
                </button>
                <button className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform hidden sm:flex">
                  <span className="material-symbols-outlined text-[18px]">close</span> STANDBY
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Incoming Alert Queue Side Panel */}
        <section className="w-full md:w-[420px] bg-surface-container-low flex flex-col border-l border-outline-variant z-30">
          <div className="p-4 flex items-center justify-between border-b border-outline-variant">
            <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-error fill-icon">notifications_active</span>
              Alert Queue
            </h2>
            <span className="bg-surface-variant px-3 py-1 rounded-full text-xs font-medium text-on-surface-variant">{activeAlerts} Pending</span>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-4" style={{ scrollbarWidth: 'none' }}>
            
            {/* Victim Card 1 (High Priority) */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-error p-4 hover:shadow-md transition-all hover:-translate-y-0.5 relative group">
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle className="text-outline-variant" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                    <circle className="text-error transition-[stroke-dashoffset] duration-1000 ease-out" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="12.5" strokeWidth="3"></circle>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">90%</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Reliability</span>
              </div>
              
              <div className="flex gap-4 mb-4 pr-12">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Victim 1" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuou34BQFcQN06145gvAGW3reGr_paMk_YlWyHs7lOYxk8DIYCZw0ccSmnwJjI2xKcU88hPl8THpEMTkV2Im6-mbkI1dUfF6Rxu5l_ZID-xiDkl_kJnNP-PSUXoKHG5Xrx22C7Aoq8oyjZfflW7hQTfir-M8ZK68A11fiRATUwO9wqHsMI3XkfzoCvC6eVA7yatlyUPgMra1mTGGEaFAcK3r-4k9j2rIuKnrds1H7s0gOyi7Qa0mzG"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-error mb-1">CRITICAL • MEDICAL</p>
                  <h4 className="text-xl font-bold leading-tight text-on-surface">Sarah Jenkins</h4>
                  <p className="text-xs font-medium text-on-surface-variant">Age: 28 • Type: Type 1 Diabetic</p>
                </div>
              </div>
              
              <div className="bg-surface-container rounded-lg p-2 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <p className="text-xs font-medium truncate text-on-surface">Sector 4, Main & Broadway Intersection</p>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center text-[10px] font-bold text-on-primary-fixed">J</div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-secondary-fixed flex items-center justify-center text-[10px] font-bold text-on-secondary-fixed">K</div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-colors">ASSIGN</button>
                  <button className="bg-surface-variant text-on-surface-variant px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-outline-variant transition-colors">DISMISS</button>
                </div>
              </div>
            </div>

            {/* Victim Card 2 (Med Priority) */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border-l-4 border-tertiary-container p-4 hover:shadow-md transition-all hover:-translate-y-0.5 relative">
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle className="text-outline-variant" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                    <circle className="text-tertiary-container transition-[stroke-dashoffset] duration-1000 ease-out" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="40" strokeWidth="3"></circle>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">68%</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Reliability</span>
              </div>
              
              <div className="flex gap-4 mb-4 pr-12">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Victim 2" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1fBb9vo5WjUTQUZLscHtvGVvc2s8CJ5SetVZXU9lEGgnQBDM9FUJPXVmT-JldbKS7lyM1IlLNEZ-PyjodHkgcev5OxJIFVyqmustro0CYmv6rOfGZBFaDhYyqNIMaYoIFIyHx2p2P-QtT9QAvrQPMhnKGVlmdiG3i90aWb9n5gMSTp19xYANZua86VZPdYTRs4032grIzu1J2rOmDZSUXWG4WEhiIAz5bkW4B47NzTV9XeKsKsITF"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary-container mb-1">STABLE • FIRE HAZARD</p>
                  <h4 className="text-xl font-bold leading-tight text-on-surface">Markos V.</h4>
                  <p className="text-xs font-medium text-on-surface-variant">Age: 44 • Trap Status: Entrapped</p>
                </div>
              </div>
              
              <div className="bg-surface-container rounded-lg p-2 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <p className="text-xs font-medium truncate text-on-surface">West 12th St, Apartment 4B</p>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <button className="bg-primary-container text-on-primary-container hover:bg-primary hover:text-white transition-colors px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider w-full">RESPOND</button>
              </div>
            </div>
            
            {/* Notification Overlay (Mini Toast) */}
            {showNotification && (
              <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce">
                <span className="material-symbols-outlined text-error fill-icon">emergency_home</span>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-error">URGENT UPDATE</p>
                  <p className="text-xs font-medium text-inverse-on-surface">Central Power Grid Failure in Sector 7</p>
                </div>
                <button 
                  onClick={() => setShowNotification(false)}
                  className="material-symbols-outlined text-[20px] text-inverse-on-surface opacity-80 hover:opacity-100"
                >
                  close
                </button>
              </div>
            )}
            
          </div>
        </section>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-lg shadow-lg flex justify-around items-center px-2 py-3 pb-safe border-t border-outline-variant/20 rounded-t-xl">
        <button 
          onClick={() => navigate('/home')}
          className="flex flex-col items-center justify-center gap-1 text-primary active:scale-90 transition-transform duration-200"
        >
          <span className="material-symbols-outlined fill-icon">rss_feed</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Feed</span>
        </button>
        <button 
          onClick={() => navigate('/map')}
          className="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary active:scale-90 transition-transform duration-200"
        >
          <span className="material-symbols-outlined">map</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Map</span>
        </button>
        
        {/* Center SOS FAB */}
        <button 
          onClick={() => navigate('/sos')}
          className="flex items-center justify-center w-14 h-14 bg-error text-white rounded-full shadow-[0_0_20px_rgba(215,52,73,0.5)] active:scale-90 transition-all -mt-8 border-4 border-surface"
        >
          <span className="material-symbols-outlined text-[32px] fill-icon">emergency</span>
        </button>
        
        <button className="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary active:scale-90 transition-transform duration-200">
          <span className="material-symbols-outlined">notifications</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Alerts</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary active:scale-90 transition-transform duration-200">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default ResponseTeamDash;
