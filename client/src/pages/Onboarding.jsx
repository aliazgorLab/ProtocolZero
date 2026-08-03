import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const bgRef = useRef(null);
  const navigate = useNavigate();

  const [showPortals, setShowPortals] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPortals(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!bgRef.current) return;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      bgRef.current.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Simple enter animation
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-enter');
    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 200 + (index * 150));
    });
  }, []);

  return (
    <div className="bg-background text-on-background overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen relative">
      {/* Ambient Grid Layer */}
      <div ref={bgRef} className="fixed inset-0 grid-background z-0"></div>
      
      {/* Animated Decoration Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full pulse-soft blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/5 rounded-full pulse-soft blur-3xl" style={{ animationDelay: '1s' }}></div>
        
        <div className="absolute top-20 left-20 floating-node opacity-40">
          <span className="material-symbols-outlined text-primary-fixed-variant" style={{ fontSize: '48px' }}>hub</span>
        </div>
        <div className="absolute bottom-40 right-20 floating-node opacity-40" style={{ animationDelay: '2s' }}>
          <span className="material-symbols-outlined text-primary-fixed-variant" style={{ fontSize: '32px' }}>verified_user</span>
        </div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Brand Section */}
        <div className={`flex flex-col items-center text-center max-w-lg transition-transform duration-1000 ease-in-out ${showPortals ? 'scale-100 translate-y-0' : 'scale-110 md:scale-125 translate-y-24 md:translate-y-32'}`}>
          <div className="relative mb-6 group animate-enter">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-700"></div>
            <img 
              alt="Protocol Zero Logo" 
              className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-sm" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLsFZd9m7ptmonppw50NCzXgTHE7r4IlGTGf-aEwssFOBTCQ4brZbreirH7yu4jAUpXWz4wiKxrlFb423XxRmKx2v7xK3ey91l2SX_pLHS_qX-HIxbv6wptTTSN_wzKNgLqzylk4bzjlvYjwOel2IQvE0lrZuQplK4AZN2CfQ4ok8LGIHXIIAzEqqRdV1BbQrXMAIuT9hCXs-BRgHr6cHviUH9Z7SsYJv9W-bMNPnJ2adFtfj-6ciQSIans" 
            />
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-primary mb-2 animate-enter">
            Protocol Zero
          </h1>
          <p className="text-xs font-bold text-on-surface-variant tracking-[0.2em] mb-8 opacity-80 uppercase animate-enter">
            Report. Verify. Respond.
          </p>
          
          <p className="text-base text-on-surface-variant mb-8 px-4 max-w-sm animate-enter">
            Advanced civilian coordination during high-stakes events. Direct access to verified incident reporting.
          </p>
        </div>

        {/* Portals Section */}
        <div className={`w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 px-4 transition-all duration-1000 ease-in-out ${showPortals ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          
          {/* Citizen Portal */}
          <div className="bg-surface-container-low/80 backdrop-blur-md rounded-2xl p-6 border border-outline-variant/30 flex flex-col items-center text-center hover:border-primary/50 transition-colors shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <span className="material-symbols-outlined text-[32px]">groups</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Citizen Portal</h2>
            <p className="text-sm text-on-surface-variant mb-6 flex-grow">
              Report incidents, view local alerts, and assist your community as a citizen or volunteer.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-primary text-on-primary font-semibold h-12 rounded-xl hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Vetted Professional Portal */}
          <div className="bg-surface-container-low/80 backdrop-blur-md rounded-2xl p-6 border border-outline-variant/30 flex flex-col items-center text-center hover:border-tertiary/50 transition-colors shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase px-2 py-1 rounded-bl-lg rounded-tr-lg">
                Official Access
              </span>
            </div>
            <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center mb-4 text-tertiary">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-on-surface">Vetted Professionals</h2>
            <p className="text-sm text-on-surface-variant mb-6 flex-grow">
              Secure access for Reporters, Law Enforcement, Medical, and Emergency Response Teams.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => navigate('/login/vetted')}
                className="w-full bg-tertiary text-on-tertiary font-semibold h-12 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Official Sign In
              </button>
            </div>
          </div>
          
        </div>

        {/* Accessibility / Footer Meta */}
        <div className="absolute bottom-6 flex flex-col items-center gap-1 animate-enter">
          <div className="flex items-center gap-2 text-outline">
            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
            <span className="text-xs font-medium">End-to-End Encrypted</span>
            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
          </div>
          <p className="text-[10px] font-medium text-outline/60 uppercase tracking-widest">
            System Status: Operational
          </p>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
