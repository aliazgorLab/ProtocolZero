import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, verifyOtp, clearError, resetOtpState } from '../features/auth/authSlice';

const VettedLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error, requiresOtp, tempToken } = useSelector((state) => state.auth);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password, loginType: 'vetted' }));
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp) return;
    dispatch(verifyOtp({ otp, tempToken }));
  };

  const handleBackToLogin = () => {
    setPassword('');
    setOtp('');
    dispatch(resetOtpState());
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
    <div className="bg-background text-on-surface min-h-screen flex flex-col overflow-x-hidden selection:bg-tertiary-container selection:text-on-tertiary-container">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md bg-surface-container-low shadow-sm flex justify-between items-center px-4 h-14 border-b border-tertiary/20">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-outlined text-tertiary">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold text-tertiary">Protocol Zero</h1>
        </div>
        <div className="flex items-center">
          <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest hidden md:inline-block">
            Secure Node
          </span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-4 pt-20 pb-6 relative overflow-hidden">
        {/* Atmospheric Background Element */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="ambient-blob absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary blur-[120px]"></div>
          <div className="ambient-blob absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-fixed-dim blur-[120px]"></div>
        </div>

        {requiresOtp ? (
          /* OTP Verification Container */
          <div className="relative z-10 w-full max-w-[420px] bg-white/90 backdrop-blur-xl border-t-[4px] border-tertiary shadow-2xl p-8 rounded-b-xl rounded-t-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-tertiary-container rounded-full mx-auto flex items-center justify-center mb-4 shadow-inner border border-tertiary/30">
                <span className="material-symbols-outlined text-tertiary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">Identity Verification</h2>
              <p className="text-sm text-on-surface-variant mt-1">A secure code was sent to your official email.</p>
            </div>

            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              {/* OTP Code Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">Authorization Code</label>
                <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-tertiary focus-within:ring-2 focus-within:ring-tertiary/20 transition-all overflow-hidden">
                  <input
                    className="w-full bg-transparent border-none py-3 px-4 text-base focus:ring-0 outline-none placeholder:text-outline text-center tracking-[0.5em] font-mono text-xl"
                    placeholder="000000"
                    maxLength={6}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error-container text-on-error-container text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-[48px] text-on-tertiary text-base font-semibold rounded-lg shadow-md transition-all mt-6 flex items-center justify-center gap-2 ${isLoading ? 'bg-tertiary/60 cursor-not-allowed' : 'bg-tertiary hover:brightness-110 active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Authenticating...</>
                ) : (
                  <><span>Authorize Session</span><span className="material-symbols-outlined text-[20px]">done</span></>
                )}
              </button>
            </form>

            {/* Back to Login Button */}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full h-[48px] text-tertiary text-base font-semibold rounded-lg border border-outline-variant hover:bg-surface-container transition-all mt-4 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Back to Credentials</span>
            </button>
          </div>
        ) : (
          /* Login Container */
          <div className="relative z-10 w-full max-w-[420px] bg-white/90 backdrop-blur-xl border-t-[4px] border-tertiary shadow-2xl p-8 rounded-b-xl rounded-t-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-tertiary-container rounded-full mx-auto flex items-center justify-center mb-4 shadow-inner border border-tertiary/30">
                <span className="material-symbols-outlined text-tertiary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">Official Sign In</h2>
              <p className="text-sm text-on-surface-variant mt-1">Vetted Professionals Gateway</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">Institutional Email</label>
                <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-tertiary focus-within:ring-2 focus-within:ring-tertiary/20 transition-all overflow-hidden group">
                  <span className="material-symbols-outlined pl-3 text-outline group-focus-within:text-tertiary transition-colors">mail</span>
                  <input
                    className="w-full bg-transparent border-none py-3 px-3 text-base focus:ring-0 outline-none placeholder:text-outline"
                    placeholder="agent@agency.gov"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">Passcode</label>
                <div className="relative flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-tertiary focus-within:ring-2 focus-within:ring-tertiary/20 transition-all group">
                  <span className="material-symbols-outlined pl-3 text-outline group-focus-within:text-tertiary transition-colors">lock</span>
                  <input
                    className="w-full bg-transparent border-none py-3 px-3 pr-10 text-base focus:ring-0 outline-none placeholder:text-outline"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 p-1 text-on-surface-variant hover:text-tertiary transition-colors" 
                    onClick={togglePasswordVisibility} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <Link className="text-[13px] text-tertiary font-semibold hover:underline transition-all" to="#">Recover Access</Link>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error-container text-on-error-container text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-[48px] text-on-tertiary text-base font-semibold rounded-lg shadow-md transition-all mt-6 flex items-center justify-center gap-2 ${isLoading ? 'bg-tertiary/60 cursor-not-allowed' : 'bg-tertiary hover:brightness-110 active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Authenticating...</>
                ) : (
                  <><span>Secure Login</span><span className="material-symbols-outlined text-[20px]">login</span></>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="h-[1px] flex-grow bg-outline-variant/60"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-outline">Unregistered?</span>
                <div className="h-[1px] flex-grow bg-outline-variant/60"></div>
              </div>

              {/* Secondary Link */}
              <div className="text-center">
                <Link className="inline-flex items-center justify-center w-full h-[48px] text-tertiary text-sm font-bold border-2 border-tertiary/20 rounded-lg hover:bg-tertiary/5 active:scale-[0.98] transition-all" to="/signup/vetted">
                  Apply for Vetted Access
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer Messaging */}
      <footer className="w-full px-4 py-6 pb-8 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant/30 text-on-surface-variant mb-3 border border-outline-variant/20">
          <span className="material-symbols-outlined text-[14px]">encrypted</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Session</span>
        </div>
        <p className="text-[11px] font-medium text-on-surface-variant/70 leading-relaxed uppercase tracking-wider">
          Unauthorized access to this node is strictly prohibited and monitored.
        </p>
      </footer>
    </div>
  );
};

export default VettedLogin;
