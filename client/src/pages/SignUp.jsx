import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: connect to real API for registration
    setTimeout(() => {
      setIsSubmitting(false);
      setIsVerified(true);
      
      // Auto redirect after successful signup
      setTimeout(() => {
        navigate('/otp-verification');
      }, 1000);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Suppressed TopAppBar for transactional focused journey */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Atmospheric Background Element */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          {/* Subtle gradient could go here */}
        </div>
        
        <div className="w-full max-w-[480px] z-10">
          {/* Brand Identity Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-on-primary mb-4 shadow-lg">
              <span className="material-symbols-outlined text-[32px]">shield_person</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-primary mb-1">Protocol Zero</h1>
            <p className="text-base text-on-surface-variant">Secure Enrollment for Citizens & Volunteers</p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-xl shadow-xl p-4 md:p-8 border border-outline-variant/30">
            <form className="space-y-4" id="signup-form" onSubmit={handleSubmit}>
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="full_name">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                  <input 
                    className="w-full pl-10 pr-4 h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-base" 
                    id="full_name" 
                    placeholder="John Doe" 
                    required 
                    type="text"
                  />
                </div>
              </div>

              {/* Role Selection Chips */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Account Type</label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input className="sr-only peer" name="role" type="radio" value="citizen" defaultChecked />
                    <div className="h-11 flex items-center justify-center rounded-lg border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed-variant transition-all text-xs font-medium">
                      Citizen
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input className="sr-only peer" name="role" type="radio" value="volunteer" />
                    <div className="h-11 flex items-center justify-center rounded-lg border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed-variant transition-all text-xs font-medium">
                      Volunteer
                    </div>
                  </label>
                </div>
              </div>

              {/* Phone Number with Country Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="phone">Phone Number</label>
                <div className="flex gap-1">
                  <div className="w-24 shrink-0 relative">
                    <select className="w-full h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none text-base appearance-none pl-3 pr-8 cursor-pointer">
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+91">+91</option>
                      <option value="+880">+880</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline">arrow_drop_down</span>
                  </div>
                  <input 
                    className="flex-grow h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-base px-4" 
                    id="phone" 
                    placeholder="555-0123" 
                    required 
                    type="tel"
                  />
                </div>
              </div>

              {/* Password with Toggle */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="password">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input 
                    className="w-full pl-10 pr-12 h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-base" 
                    id="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors p-1" 
                    onClick={togglePassword} 
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="email">Email Address</label>
                  <span className="text-xs font-medium text-outline-variant">Optional</span>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input 
                    className="w-full pl-10 pr-4 h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-base" 
                    id="email" 
                    placeholder="email@example.com" 
                    type="email"
                  />
                </div>
              </div>

              {/* Home Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="address">Home Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-4 text-outline group-focus-within:text-primary transition-colors">home</span>
                  <textarea 
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-base resize-none" 
                    id="address" 
                    placeholder="Street name, City, Postcode" 
                    required 
                    rows="2"
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || isVerified}
                  className={`w-full h-14 text-white text-xl font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    isVerified 
                      ? 'bg-tertiary-container' 
                      : 'bg-primary hover:bg-primary-container active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Securing Identity...
                    </>
                  ) : isVerified ? (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      Account Verified
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terms Notice */}
              <p className="text-xs font-medium text-center text-on-surface-variant px-4">
                By signing up, you agree to the <Link className="text-primary font-bold hover:underline" to="#">Duty of Care Protocols</Link> and <Link className="text-primary font-bold hover:underline" to="#">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Already part of the network? <Link className="text-primary font-bold hover:underline" to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Security Badge */}
      <footer className="pb-8 px-4 text-center">
        <div className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-surface-variant/50 border border-outline-variant/30 text-outline">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span className="text-xs font-medium uppercase tracking-widest">End-to-End Encrypted Enrollment</span>
        </div>
      </footer>
    </div>
  );
};

export default SignUp;
