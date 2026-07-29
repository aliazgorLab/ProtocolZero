import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, verifyOtp, clearError, resetOtpState } from '../features/auth/authSlice';

const Login = () => {
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
    dispatch(loginUser({ email, password }));
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

        {requiresOtp ? (
          /* OTP Verification Container */
          <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-md border border-white/30 p-8 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-primary-container rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">Enter OTP Code</h2>
              <p className="text-sm text-on-surface-variant mt-1">A verification code was sent to your email.</p>
            </div>

            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              {/* OTP Code Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">6-Digit Code</label>
                <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
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
                className={`w-full h-[48px] text-white text-base font-semibold rounded-lg shadow-md transition-all mt-6 flex items-center justify-center gap-2 ${isLoading ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary-container hover:bg-primary active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Verifying...</>
                ) : (
                  <><span>Verify OTP</span><span className="material-symbols-outlined text-[20px]">done</span></>
                )}
              </button>

            </form>

            {/* Back to Login Button */}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full h-[48px] text-primary text-base font-semibold rounded-lg border border-outline-variant hover:bg-surface-container transition-all mt-4 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          /* Login Container */
          <div className="relative z-10 w-full max-w-[420px] bg-white/80 backdrop-blur-md border border-white/30 p-8 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-primary-container rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">Welcome Back</h2>
              <p className="text-sm text-on-surface-variant mt-1">Access the secure command network</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">Email Address</label>
                <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
                  <input
                    className="w-full bg-transparent border-none py-3 px-4 text-base focus:ring-0 outline-none placeholder:text-outline"
                    placeholder="email@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                className={`w-full h-[48px] text-white text-base font-semibold rounded-lg shadow-md transition-all mt-6 flex items-center justify-center gap-2 ${isLoading ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary-container hover:bg-primary active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Signing In...</>
                ) : (
                  <><span>Log In</span><span className="material-symbols-outlined text-[20px]">login</span></>
                )}
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
                  <Link className="text-primary font-bold hover:underline" to="/signup">Sign Up</Link>
                </p>
              </div>
            </form>
          </div>
        )}
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
