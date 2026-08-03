import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, verifyOtp, clearError, resetOtpState } from '../features/auth/authSlice';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, user, error, requiresOtp, tempToken } = useSelector((state) => state.auth);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      if (['Admin', 'SuperAdmin'].includes(user?.accountType)) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password, loginType: 'admin' }));
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-slate-800 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-800 transition rounded-full text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-2xl">admin_panel_settings</span>
            <h1 className="text-lg font-bold text-white tracking-wider uppercase">Protocol Zero</h1>
          </div>
        </div>
        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          ADMIN COMMAND GATEWAY
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative">
        <div className="relative z-10 w-full max-w-[440px] bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl animate-in fade-in duration-500">
          
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <span className="material-symbols-outlined text-3xl">shield</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Admin Sign In</h2>
            <p className="text-xs text-slate-400 mt-1.5">Restricted access portal for System Moderators</p>
          </div>

          {requiresOtp ? (
            /* OTP Verification Container */
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Admin Security Code</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-base focus:border-rose-500 outline-none text-center tracking-[0.5em] font-mono text-xl text-white"
                  placeholder="000000"
                  maxLength={6}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{typeof error === 'string' ? error : error?.message || 'Admin authentication error occurred'}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Verifying Admin Code...' : 'Authorize Admin Session'}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full h-12 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition mt-2"
              >
                Back to Credentials
              </button>
            </form>
          ) : (
            /* Standard Login Form */
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Admin Email Address</label>
                <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 focus-within:border-rose-500 transition-all overflow-hidden group">
                  <span className="material-symbols-outlined pl-3.5 text-slate-500 group-focus-within:text-rose-500 text-xl">mail</span>
                  <input
                    className="w-full bg-transparent border-none py-3 px-3 text-sm text-white focus:ring-0 outline-none placeholder:text-slate-600"
                    placeholder="protocolzero@admin.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Master Password</label>
                <div className="relative flex items-center bg-slate-950 rounded-xl border border-slate-800 focus-within:border-rose-500 transition-all group">
                  <span className="material-symbols-outlined pl-3.5 text-slate-500 group-focus-within:text-rose-500 text-xl">key</span>
                  <input
                    className="w-full bg-transparent border-none py-3 px-3 pr-10 text-sm text-white focus:ring-0 outline-none placeholder:text-slate-600"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 p-1 text-slate-500 hover:text-rose-500 transition-colors" 
                    onClick={togglePasswordVisibility} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{typeof error === 'string' ? error : error?.message || 'Admin authentication error occurred'}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Authenticating Admin...' : 'Authenticate Command Console'}
              </button>

              <div className="pt-4 border-t border-slate-800 text-center">
                <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-white transition">
                  Standard Citizen Login Portal →
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-6 text-center text-slate-500 text-xs font-medium">
        Protocol Zero Command & Control Node • Strictly Authorized System Personnel Only
      </footer>
    </div>
  );
};

export default AdminLogin;
