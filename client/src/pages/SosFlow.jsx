import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SosFlow = () => {
  const [isHolding, setIsHolding] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const CIRCUMFERENCE = 691;
  const navigate = useNavigate();

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startHold = () => {
    if (isHolding || isActive) return;
    setIsHolding(true);
    
    // 3 seconds hold to activate
    timerRef.current = setTimeout(() => {
      activateEmergency();
    }, 3000);
  };

  const stopHold = () => {
    if (!isHolding || isActive) return;
    setIsHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const activateEmergency = () => {
    setIsHolding(false);
    setIsActive(true);
    // TODO: Trigger actual emergency API call here
    console.log('Emergency Protocol Activated');
  };

  const cancelEmergency = () => {
    if (window.confirm('Are you sure you want to cancel the SOS?')) {
      setIsActive(false);
      stopHold();
    }
  };

  return (
    <div className="flex-grow flex flex-col pt-14 pb-24 px-4 min-h-[calc(100vh-3.5rem)] relative">
      
      {/* SOS Initiation Screen */}
      <section className="flex-grow flex flex-col items-center justify-center space-y-6 py-8" id="sos-init">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-on-background">Emergency SOS</h2>
          <p className="text-on-surface-variant text-base max-w-[280px] mx-auto">Initiate immediate response and alert emergency services.</p>
        </div>
        
        {/* The Core SOS Button (Hold to activate) */}
        <div className="relative flex items-center justify-center mt-8">
          {/* SVG Progress Ring */}
          <svg className="absolute w-[240px] h-[240px] -rotate-90">
            <circle 
              className="text-surface-container-highest" 
              cx="120" 
              cy="120" 
              fill="transparent" 
              r="110" 
              stroke="currentColor" 
              strokeWidth="8"
            ></circle>
            <circle 
              className="transition-[stroke-dashoffset] ease-linear"
              style={{ 
                transitionDuration: isHolding ? '3s' : '0.3s',
                strokeDashoffset: isHolding ? 0 : CIRCUMFERENCE 
              }}
              cx="120" 
              cy="120" 
              fill="transparent" 
              r="110" 
              stroke="#D73449" 
              strokeDasharray={CIRCUMFERENCE} 
              strokeWidth="8"
            ></circle>
          </svg>
          
          <button 
            className="relative z-10 w-48 h-48 rounded-full bg-[#D73449] flex flex-col items-center justify-center text-white sos-pulse active:scale-90 transition-transform duration-300 select-none"
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={(e) => {
              // Prevent default to avoid scrolling while holding
              startHold();
            }}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}
          >
            <span className="material-symbols-outlined text-[64px] fill-icon">emergency</span>
            <span className="text-xs font-bold mt-2 tracking-widest uppercase">SOS</span>
          </button>
        </div>
        
        <p className={`text-xs font-medium text-center pt-4 uppercase tracking-wider transition-colors ${isHolding ? 'text-alert-red font-bold' : 'text-on-surface-variant'}`}>
          {isHolding ? 'HOLDING...' : 'HOLD TO ACTIVATE'}
        </p>
      </section>

      {/* Active Emergency State Overlay */}
      <section 
        className={`fixed inset-0 z-[100] bg-on-background/85 backdrop-blur-2xl flex flex-col p-4 overflow-y-auto transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="mt-8 flex flex-col items-center text-center text-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-white text-3xl fill-icon">shield_with_heart</span>
          </div>
          <h2 className="text-2xl font-bold">Help is on the way</h2>
          <p className="text-primary-fixed-dim text-base">Emergency services dispatched</p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-4 max-w-lg mx-auto w-full">
          {/* ETA Card */}
          <div className="bg-surface-container-highest/20 rounded-xl p-4 flex items-center justify-between border border-white/10 transition-transform hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined">shuffle</span>
              </div>
              <div>
                <p className="text-white font-bold text-base">ETA 4 mins</p>
                <p className="text-on-surface-variant text-sm">Closest Response Team</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-error animate-ping"></div>
          </div>
          
          {/* Live Location Indicator */}
          <div className="bg-white rounded-xl p-4 space-y-2 shadow-xl transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">LIVE LOCATION ACTIVE</span>
              <span className="material-symbols-outlined text-primary text-sm">location_on</span>
            </div>
            <div className="w-full h-32 rounded-lg relative overflow-hidden bg-surface-dim">
              <div 
                className="absolute inset-0 grayscale opacity-40 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBfSotCvibeTwOG-QNFG8QMeDu0CqTw47j9jrqBvgs39lnS8n7E58ODFiq2W1bzFCCznxgFY53w6scy1zDP3XWPzuBvjkGFcL82L0KazeHznqla8XC_7_R4iI53FCtXfsRrSQQ7Nj7hBbk-ektNtoYyYMSqKn7s_OgPEUzGNzFZciEQRD0msj8Ynf38CdxlCkGE9ZEkzc84xfxumSffvbm3Vxic0uU4TKseeIE_RG6Ho4kPYG4BBDPD')" }}
              ></div>
              {/* UI Map Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-primary rounded-full ring-4 ring-white shadow-lg"></div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-surface px-2 py-1 rounded text-[10px] font-bold text-on-surface">
                40.7128° N, 74.0060° W
              </div>
            </div>
          </div>
          
          {/* Emergency Contacts */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-white/60 px-1 uppercase tracking-wider">CONTACTS NOTIFIED</p>
            <div className="bg-surface-container-highest/10 rounded-xl divide-y divide-white/10 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold">SM</div>
                <div className="flex-grow">
                  <p className="text-white font-bold text-sm">Sarah Miller (Wife)</p>
                  <p className="text-white/60 text-xs font-medium">Alert delivered • Live tracking link sent</p>
                </div>
                <span className="material-symbols-outlined text-primary-fixed-dim">check_circle</span>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-secondary-fixed-dim flex items-center justify-center text-on-secondary-fixed-variant font-bold">JD</div>
                <div className="flex-grow">
                  <p className="text-white font-bold text-sm">John Doe (Neighbor)</p>
                  <p className="text-white/60 text-xs font-medium">Alerting now...</p>
                </div>
                <div className="animate-spin h-4 w-4 border-2 border-primary-fixed-dim border-t-transparent rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto py-8 space-y-4 max-w-lg mx-auto w-full">
          <button 
            onClick={cancelEmergency}
            className="w-full h-14 rounded-full border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            False Alarm (Cancel)
          </button>
          <p className="text-white/40 text-center text-xs font-medium px-4">
            Security protocol active. Your status has been broadcasted to all vetted volunteers within 500m.
          </p>
        </div>
      </section>

    </div>
  );
};

export default SosFlow;
