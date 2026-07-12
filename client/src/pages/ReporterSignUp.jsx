import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ReporterSignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(!showPassword);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Connect to real API to verify reporter credentials
    setTimeout(() => {
      setIsSubmitting(false);
      setIsVerified(true);
      
      // Auto redirect after successful signup
      setTimeout(() => {
        navigate('/otp-verification');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background min-h-screen text-base overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* TopAppBar Fragment */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-surface/80 backdrop-blur-md bg-surface-container-low shadow-sm">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">menu</button>
          <span className="text-xl font-bold text-primary">Protocol Zero</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-on-surface-variant text-xs font-bold uppercase opacity-60 hidden md:block">Authentication Portal</span>
          <button className="material-symbols-outlined text-primary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">search</button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-32 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Side: Narrative/Brand Info */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 lg:pr-8">
          <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span className="text-xs font-bold uppercase tracking-wider">OFFICIAL REGISTRATION</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Become a <span className="text-primary">Verified Reporter</span>
          </h1>
          
          <p className="text-on-surface-variant text-base max-w-md">
            Join our elite network of response agents. Your reports provide real-time clarity during high-stakes incidents. Requires verification of identity and location.
          </p>
          
          <div className="space-y-4 mt-4">
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-xl text-primary">
                <span className="material-symbols-outlined">priority_high</span>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1">Incident Authority</h4>
                <p className="text-sm text-on-surface-variant">Verified reporters receive priority visibility in the central command feed.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-xl text-primary">
                <span className="material-symbols-outlined">shield_with_heart</span>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1">Safety First</h4>
                <p className="text-sm text-on-surface-variant">Our systems mask your location to unauthorized parties while keeping responders informed.</p>
              </div>
            </div>
          </div>
          
          {/* Background Decorative Element (Shader) */}
          <div className="hidden lg:block absolute -left-64 top-1/4 w-96 h-96 opacity-20 -z-10 blur-3xl rounded-full bg-primary-fixed"></div>
        </div>
        
        {/* Right Side: Registration Form Bento Card */}
        <div className="lg:col-span-7 bg-white border border-outline-variant/30 rounded-xl shadow-lg p-6 lg:p-8">
          <form className="space-y-8" id="signupForm" onSubmit={handleSubmit}>
            
            {/* Section 1: Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                <h3 className="text-xl font-bold">Identity Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 group">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-primary transition-colors" htmlFor="full_name">Full Legal Name</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-primary transition-colors">person</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" id="full_name" placeholder="John Doe" type="text" required />
                  </div>
                </div>
                
                <div className="space-y-1 group">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-primary transition-colors" htmlFor="phone">Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-primary transition-colors">call</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" id="phone" placeholder="+1 (555) 000-0000" type="tel" required />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 group">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-primary transition-colors" htmlFor="email">Work Email</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" id="email" placeholder="agent@protocolzero.org" type="email" required />
                </div>
              </div>
            </div>
            
            {/* Section 2: Localization */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                <h3 className="text-xl font-bold">Location & Security</h3>
              </div>
              
              <div className="space-y-1 group">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-primary transition-colors" htmlFor="address">Primary Operating Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-primary transition-colors">location_on</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" id="address" placeholder="Street, City, Zip Code" type="text" required />
                </div>
              </div>
              
              <div className="space-y-1 group">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-primary transition-colors" htmlFor="password">Create Secure Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                  <input className="w-full pl-10 pr-10 py-3 bg-surface-container-low border-transparent rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" id="password" placeholder="••••••••••••" type={showPassword ? "text" : "password"} required />
                  <button type="button" onClick={togglePassword} className="absolute right-3 text-outline text-[20px] hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Section 3: Verification (Critical) */}
            <div className="space-y-4 pt-4 border-t border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                <h3 className="text-xl font-bold">Reporter Verification</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NID Field */}
                <div className="space-y-1 group">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-primary transition-colors" htmlFor="nid_number">National ID (NID) Number</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-primary transition-colors">badge</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-transparent rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" id="nid_number" placeholder="ABC-12345-X" type="text" required />
                  </div>
                  <p className="text-[10px] font-medium text-on-surface-variant/70 mt-1 uppercase tracking-wider ml-1">Must match government-issued identification.</p>
                </div>
                
                {/* Face Upload Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Official Face Photo</label>
                  <div className="group relative w-full h-14 bg-surface-container border-2 border-dashed border-outline-variant hover:border-primary rounded-lg transition-all flex items-center justify-center cursor-pointer overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" id="face_photo" type="file" onChange={handleFileChange} required />
                    <div className="flex items-center gap-2 text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">photo_camera</span>
                      <span className="text-sm font-medium">Upload Live Capture</span>
                    </div>
                  </div>
                  
                  {fileName && (
                    <div className="text-xs font-medium text-primary mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span className="truncate max-w-[200px]">{fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Section */}
            <div className="pt-8 flex flex-col items-center gap-4 border-t border-outline-variant/30">
              <button 
                type="submit" 
                disabled={isSubmitting || isVerified}
                className={`w-full py-4 text-white text-xl font-bold rounded-full shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isSubmitting || isVerified ? 'opacity-80 pointer-events-none' : 'hover:bg-primary-container active:scale-[0.98]'
                }`}
                style={{ backgroundColor: isVerified ? '#16a34a' : 'var(--color-primary)' }} /* Green when verified, otherwise primary */
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying Credentials...</span>
                  </>
                ) : isVerified ? (
                  'Account Provisioned Successfully'
                ) : (
                  <>
                    Proceed to Verification
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
              
              <p className="text-xs font-medium text-on-surface-variant text-center max-w-sm">
                By clicking "Proceed", you agree to the <Link className="text-primary font-bold hover:underline" to="#">Reporter Code of Conduct</Link> and privacy protocols.
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Bottom Nav Bar (Suppressed as per task-focused rule, but defined for consistency shell reference) */}
      <footer className="fixed bottom-0 w-full py-4 px-4 flex justify-between items-center bg-surface/50 backdrop-blur-sm pointer-events-none z-40 hidden md:flex">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">Protocol 0-Node Secured</span>
        </div>
        <div className="text-[10px] font-medium text-on-surface-variant opacity-40">
          © 2026 P0 INTERNATIONAL
        </div>
      </footer>
    </div>
  );
};

export default ReporterSignUp;
