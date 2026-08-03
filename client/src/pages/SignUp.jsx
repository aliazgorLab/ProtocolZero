import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, sendRegistrationOtp, setRegistrationState, clearError } from '../features/auth/authSlice';
import { ROLES } from '../constants/roles';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState(ROLES.USER);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+880');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error } = useSelector((state) => state.auth);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleAvatarFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 500;
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          setAvatarBase64(compressed);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !email || !homeAddress) return;

    const fullPhone = `${countryCode}${phone.replace(/^0+/, '')}`;
    const payload = {
      name,
      phone: fullPhone,
      email,
      password,
      accountType,
      currentAddress: homeAddress,
      homeAddress,
      avatar: avatarBase64 || null,
    };

    try {
      const result = await dispatch(sendRegistrationOtp({ email, phone: fullPhone })).unwrap();
      if (result?.tempRegistrationToken) {
        dispatch(setRegistrationState({ token: result.tempRegistrationToken, payload, email }));
        navigate('/otp-verification?mode=registration');
      }
    } catch (err) {
      console.error("Failed to send registration OTP:", err);
    }
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
              
              {/* Optional Profile Picture Upload */}
              <div className="flex flex-col items-center justify-center space-y-2 pb-2 border-b border-outline-variant/30">
                <div className="relative w-20 h-20 rounded-full bg-surface-container-low border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-inner group">
                  {avatarBase64 ? (
                    <img src={avatarBase64} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-outline">person_add</span>
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                    <span>{avatarBase64 ? 'Change' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-on-surface-variant">Profile Picture (Optional)</span>
              </div>

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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Role Selection Chips */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Account Type</label>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input className="sr-only peer" name="role" type="radio" value={ROLES.USER} checked={accountType === ROLES.USER} onChange={() => setAccountType(ROLES.USER)} />
                    <div className="h-11 flex items-center justify-center rounded-lg border-2 border-outline-variant peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed-variant transition-all text-xs font-medium">
                      Citizen
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input className="sr-only peer" name="role" type="radio" value={ROLES.VOLUNTEER} checked={accountType === ROLES.VOLUNTEER} onChange={() => setAccountType(ROLES.VOLUNTEER)} />
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
                    <select className="w-full h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none text-base appearance-none pl-3 pr-8 cursor-pointer"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}>
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
                    placeholder="1717xxxxxx"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-outline uppercase tracking-wider" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input
                    className="w-full pl-10 pr-4 h-12 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-base"
                    id="email"
                    placeholder="email@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error-container text-on-error-container text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{typeof error === 'string' ? error : error?.message || 'Registration error occurred'}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-14 text-white text-xl font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-primary/60 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-container active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Creating Account...
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
