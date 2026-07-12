import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: connect to real API for authentication
    // For now, redirect to dashboard
    navigate('/home');
  };

  // Add visual interest to the background on mouse move (Desktop)
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const blobs = document.querySelectorAll('.ambient-blob');
      if (blobs.length >= 2) {
        blobs[0].style.transform = `translate(${x * 20}px, ${y * 20}px)`;
        blobs[1].style.transform = `translate(${-x * 30}px, ${-y * 30}px)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md bg-surface-container-low shadow-sm flex justify-between items-center px-4 h-14">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined text-primary">menu</span>
          </button>
          <h1 className="text-xl font-bold text-primary">Protocol Zero</h1>
        </div>
        <div className="flex items-center">
          <button className="p-2 hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined text-primary">search</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-6 relative overflow-hidden">
        {/* Subtle Atmospheric Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="ambient-blob absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-fixed-dim blur-[120px]"></div>
          <div className="ambient-blob absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-fixed blur-[120px]"></div>
        </div>

        {/* Login Container */}
        <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-md border border-white/30 p-8 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-primary-container rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Welcome Back</h2>
            <p className="text-sm text-on-surface-variant mt-1">Access the secure command network</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {/* Mobile Number Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">Mobile Number</label>
              <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
                <select className="bg-transparent border-none text-sm font-medium py-3 pl-3 pr-1 focus:ring-0 outline-none cursor-pointer">
                  <option>+1</option>
                  <option>+44</option>
                  <option>+91</option>
                  <option>+880</option>
                </select>
                <input 
                  className="w-full bg-transparent border-none py-3 px-2 text-base focus:ring-0 outline-none placeholder:text-outline" 
                  placeholder="(555) 000-0000" 
                  type="tel" 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">Password</label>
              <div className="relative flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input 
                  className="w-full bg-transparent border-none py-3 px-4 text-base focus:ring-0 outline-none placeholder:text-outline" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                />
                <button 
                  className="absolute right-3 p-1 text-on-surface-variant hover:text-primary transition-colors" 
                  onClick={togglePasswordVisibility} 
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link className="text-sm text-primary hover:underline transition-all" to="#">Forgot Password?</Link>
              </div>
            </div>

            {/* Action Button */}
            <button 
              type="submit"
              className="w-full h-[48px] bg-primary-container text-white text-base font-semibold rounded-lg shadow-md hover:bg-primary transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
            >
              <span>Log In</span>
              <span className="material-symbols-outlined text-[20px]">login</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-4">
              <div className="h-[1px] flex-grow bg-outline-variant"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-outline">OR</span>
              <div className="h-[1px] flex-grow bg-outline-variant"></div>
            </div>

            {/* Secondary Link */}
            <div className="text-center">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <Link className="text-primary font-bold hover:underline" to="#">Sign Up</Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Messaging */}
      <footer className="w-full px-4 py-6 pb-8 max-w-[500px] mx-auto text-center">
        <p className="text-xs font-medium text-on-surface-variant leading-relaxed opacity-70">
          Signing in as Citizen, Volunteer, Reporter, or Response Team — access is determined by your account level and protocol authorization.
        </p>
      </footer>
    </div>
  );
};

export default Login;
