import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useToast } from '../context/ToastContext';

const SosFlow = () => {
  const [isHolding, setIsHolding] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const CIRCUMFERENCE = 691;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startHold = () => {
    if (isHolding || isActive) return;
    setIsHolding(true);
    
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
    showToast("EMERGENCY SIGNAL BROADCASTED", "error");
  };

  const cancelEmergency = () => {
    if (window.confirm('Are you sure you want to cancel the emergency SOS signal?')) {
      setIsActive(false);
      stopHold();
      showToast("SOS Signal Cancelled", "info");
    }
  };

  const coordinatesText = currentUser?.gps?.coordinates
    ? `${currentUser.gps.coordinates[1].toFixed(4)}° N, ${currentUser.gps.coordinates[0].toFixed(4)}° E`
    : 'GPS Acquiring...';

  return (
    <div className="flex-grow flex flex-col pt-14 pb-24 px-4 min-h-[calc(100vh-3.5rem)] relative">
      
      {/* SOS Initiation Screen */}
      <section className="flex-grow flex flex-col items-center justify-center space-y-6 py-8" id="sos-init">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-on-background">Emergency SOS</h2>
          <p className="text-on-surface-variant text-base max-w-[280px] mx-auto">Initiate immediate response and broadcast high-priority beacon to responders.</p>
        </div>
        
        {/* Core SOS Button */}
        <div className="relative flex items-center justify-center mt-8">
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
            onTouchStart={() => startHold()}
            onTouchEnd={stopHold}
            onTouchCancel={stopHold}
          >
            <span className="material-symbols-outlined text-[64px] fill-icon">emergency</span>
            <span className="text-xs font-bold mt-2 tracking-widest uppercase">SOS</span>
          </button>
        </div>
        
        <p className={`text-xs font-medium text-center pt-4 uppercase tracking-wider transition-colors ${isHolding ? 'text-alert-red font-bold' : 'text-on-surface-variant'}`}>
          {isHolding ? 'HOLDING...' : 'HOLD FOR 3 SECONDS TO ACTIVATE'}
        </p>
      </section>

      {/* Active Emergency State Overlay */}
      <section 
        className={`fixed inset-0 z-[100] bg-on-background/90 backdrop-blur-2xl flex flex-col p-4 overflow-y-auto transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="mt-8 flex flex-col items-center text-center text-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-white text-3xl fill-icon">shield_with_heart</span>
          </div>
          <h2 className="text-2xl font-bold">Emergency Signal Broadcasted</h2>
          <p className="text-primary-fixed-dim text-base">Alerting Nearest Responders & Dispatch Units</p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-4 max-w-lg mx-auto w-full">
          {/* Beacon Status */}
          <div className="bg-surface-container-highest/20 rounded-xl p-4 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-error/20 text-error flex items-center justify-center">
                <span className="material-symbols-outlined">radar</span>
              </div>
              <div>
                <p className="text-white font-bold text-base">Beacon Active</p>
                <p className="text-on-surface-variant text-xs">Transmitting High-Priority Telemetry</p>
              </div>
            </div>
            <div className="h-3 w-3 rounded-full bg-error animate-ping"></div>
          </div>
          
          {/* Live Location Indicator */}
          <div className="bg-white rounded-xl p-4 space-y-2 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">GPS STREAM ACTIVE</span>
              <span className="material-symbols-outlined text-primary text-sm">location_on</span>
            </div>
            <div className="w-full h-24 rounded-lg bg-surface-container-high flex flex-col items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-primary text-2xl animate-bounce">my_location</span>
              <span className="text-xs font-bold mt-1">{coordinatesText}</span>
            </div>
          </div>
          
          {/* Network Dispatch */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-white/60 px-1 uppercase tracking-wider">RESPONSE NETWORK BROADCAST</p>
            <div className="bg-surface-container-highest/10 rounded-xl divide-y divide-white/10 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">RT</div>
                <div className="flex-grow">
                  <p className="text-white font-bold text-sm">Nearest Response Team</p>
                  <p className="text-white/60 text-xs font-medium">Telemetry transmitted to local sector room</p>
                </div>
                <span className="material-symbols-outlined text-primary-fixed-dim">check_circle</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto py-8 space-y-4 max-w-lg mx-auto w-full">
          <button 
            onClick={cancelEmergency}
            className="w-full h-14 rounded-full border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            Cancel SOS Beacon
          </button>
        </div>
      </section>

    </div>
  );
};

export default SosFlow;
