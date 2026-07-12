import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ResponseTeamSignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Connect to real API for response team verification
    setTimeout(() => {
      setIsSubmitting(false);
      setIsVerified(true);
      // alert('Onboarding Sequence Initiated. Agency check pending.'); // optional feedback
      
      // Auto redirect after successful signup
      setTimeout(() => {
        navigate('/otp-verification');
      }, 2000);
    }, 2000);
  };

  return (
    <div className="bg-surface text-on-surface text-base min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-4 h-14 w-full">
          <div className="flex items-center gap-4">
            <button className="hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95 duration-150">
              <span className="material-symbols-outlined text-primary">menu</span>
            </button>
            <span className="text-xl font-bold text-primary">Protocol Zero</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              RESPONSE PORTAL
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-20 px-4 md:px-0 flex flex-col items-center">
        {/* Content Container */}
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Information & Branding (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 sticky top-24">
            <div className="p-8 bg-primary-container text-on-primary-container rounded-xl shadow-lg">
              <h1 className="text-4xl font-bold mb-4 tracking-tight">Secure Response Enrollment</h1>
              <p className="text-base mb-6 opacity-90">
                Join our elite network of responders. Protocol Zero provides a unified communication layer for cross-agency emergency coordination.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-on-primary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  </div>
                  <span className="text-sm">Vetted Professional Network</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-on-primary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>send_time_extension</span>
                  </div>
                  <span className="text-sm">Real-time Incident Routing</span>
                </div>
              </div>
            </div>
            
            {/* Trust Badge */}
            <div className="p-4 bg-surface-container-high rounded-xl flex items-center gap-4 border border-outline-variant">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-primary text-3xl">policy</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">IDENTITY VERIFICATION</p>
                <p className="text-xs font-medium text-on-surface-variant">Credentials are verified with regional headquarters within 24 hours.</p>
              </div>
            </div>
          </div>
          
          {/* Right Side: The Form */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-outline-variant/30">
              
              {/* Progress Stepper */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-on-primary font-bold text-sm">1</div>
                <div className="h-[2px] flex-grow bg-primary"></div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant font-bold text-sm">2</div>
                <div className="h-[2px] flex-grow bg-surface-container-highest"></div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant font-bold text-sm">3</div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-primary">Professional Identity</h2>
                  <p className="text-sm text-on-surface-variant">Enter your official responder details for agency mapping.</p>
                </div>
                
                {/* Basic Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Full Name</label>
                    <input 
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                      placeholder="Johnathan Doe" 
                      required
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Mobile Phone</label>
                    <div className="flex">
                      <span className="bg-surface-container-high px-3 flex items-center rounded-l-lg border-r border-outline-variant text-on-surface-variant text-sm">+1</span>
                      <input 
                        className="w-full bg-surface-container-low border-none rounded-r-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                        placeholder="555-0123" 
                        required
                        type="tel"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Work Email</label>
                    <input 
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                      placeholder="j.doe@agency.gov" 
                      required
                      type="email"
                    />
                  </div>
                  <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Secure Password</label>
                    <input 
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                      placeholder="••••••••" 
                      required
                      type="password"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Residential Address</label>
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                    placeholder="123 Sentinel Way, Metro City" 
                    required
                    type="text"
                  />
                </div>
                
                {/* Specialized Professional Fields */}
                <div className="pt-4 border-t border-outline-variant/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                    <h3 className="text-base font-bold">Duty Specifics</h3>
                  </div>
                  
                  <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Role Dropdown</label>
                    <div className="relative">
                      <select 
                        defaultValue=""
                        required
                        className="w-full appearance-none bg-secondary-container/30 border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary text-on-surface cursor-pointer"
                      >
                        <option disabled value="">Select Professional Role</option>
                        <option value="police">Police / Law Enforcement</option>
                        <option value="fire">Firefighter / Rescue</option>
                        <option value="medical">Paramedic / EMT</option>
                        <option value="social">Social Worker / Mental Health</option>
                        <option value="dispatcher">Emergency Dispatcher</option>
                        <option value="response_team">Special Response Team (SRT)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Office / Precinct Name</label>
                      <input 
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                        placeholder="Central Precinct 04" 
                        required
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1 focus-within:scale-[1.01] transition-transform">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Office Address</label>
                      <input 
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline-variant" 
                        placeholder="900 Justice Plaza" 
                        required
                        type="text"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Submit Section */}
                <div className="pt-6 flex flex-col gap-4">
                  <button 
                    disabled={isSubmitting || isVerified}
                    className={`w-full py-4 rounded-xl text-xl font-bold transition-all shadow-md active:scale-[0.98] duration-150 flex items-center justify-center gap-2 ${
                      isSubmitting || isVerified ? 'opacity-80 pointer-events-none bg-primary text-on-primary' : 'bg-primary text-on-primary hover:bg-primary-container'
                    }`}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <>
                        Processing... 
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>
                  <p className="text-xs font-medium text-center text-on-surface-variant px-4">
                    By clicking "Verify & Continue", you authorize Protocol Zero to validate your professional credentials with your listed agency.
                  </p>
                </div>
              </form>
            </div>
            
            {/* Assistance Card */}
            <div className="mt-6 p-6 bg-white/80 backdrop-blur-md border border-white/30 rounded-xl flex items-start gap-6">
              <span className="material-symbols-outlined text-primary text-4xl shrink-0">contact_support</span>
              <div>
                <h4 className="text-base font-bold">Need Agency Setup?</h4>
                <p className="text-sm text-on-surface-variant mb-2">If your department is not yet part of Protocol Zero, our deployment team can assist with rapid integration.</p>
                <Link className="text-primary text-xs font-bold uppercase tracking-wider hover:underline" to="#">CONTACT DEPLOYMENT TEAM</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Visual Accent Element */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent blur-3xl opacity-50"></div>
      <div class="fixed bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-gradient-to-tr from-secondary-fixed/20 to-transparent blur-3xl opacity-30"></div>
      
      {/* Background Decoration for high-trust feel */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-primary/2 mix-blend-multiply filter blur-3xl animate-pulse"></div>
      </div>
    </div>
  );
};

export default ResponseTeamSignUp;
