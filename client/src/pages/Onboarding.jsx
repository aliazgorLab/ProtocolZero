import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const bgRef = useRef(null);
  const navigate = useNavigate();

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
        <div className="flex flex-col items-center text-center max-w-lg">
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

        {/* Action Section */}
        <div className="w-full max-w-xs flex flex-col gap-2 animate-enter">
          {/* TODO: connect to real Login/Signup flow */}
          <button 
            onClick={() => navigate('/login')}
            className="group relative overflow-hidden bg-primary text-on-primary text-xl font-semibold h-14 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-white/10 translate-y-14 group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
          
          <button 
            onClick={() => navigate('/login?role=responder')}
            className="flex items-center justify-center gap-1 text-on-surface-variant text-xs font-medium h-12 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-sm hover:bg-surface-container-high transition-colors active:opacity-80"
          >
            <span className="material-symbols-outlined text-sm">medical_services</span>
            I am a First Responder
          </button>
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
