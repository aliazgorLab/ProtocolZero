import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerVettedUser, clearError } from '../features/auth/authSlice';
import { useToast } from '../context/ToastContext';

const VettedRegistration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const { isLoading, error } = useSelector((state) => state.auth);

  // Determine initial accountType based on current route path
  const isResponseTeamPath = location.pathname.includes('response-team');
  const isReporterPath = location.pathname.includes('reporter');
  const initialAccountType = isReporterPath ? 'Reporter' : 'ResponseTeam';

  const [showPassword, setShowPassword] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    homeAddress: '',
    accountType: initialAccountType,
    role: isResponseTeamPath ? 'police' : '',
    officeName: '',
    officeAddress: '',
    nid: '',
    password: ''
  });

  const [faceImage, setFaceImage] = useState(null);
  const [faceBase64, setFaceBase64] = useState('');
  const [nidImage, setNidImage] = useState(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFaceFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFaceImage(file);
      compressImage(file, (compressedBase64) => {
        setFaceBase64(compressedBase64);
      });
    }
  };

  const handleNidFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNidImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.email || !formData.nid || !formData.password) {
      showToast("Please fill in all mandatory fields.", "error");
      return;
    }

    if (formData.accountType === 'ResponseTeam') {
      if (!formData.role || !formData.officeName || !formData.officeAddress) {
        showToast("Office details and Unit Designation (Police, Firefighter, Civil Surgeon) are required for Response Teams.", "error");
        return;
      }
    }

    if (!faceBase64) {
      showToast("Please upload a facial verification image.", "error");
      return;
    }

    const payload = {
      name: formData.name,
      phone: formData.phone.startsWith('+') ? formData.phone : `+880${formData.phone.replace(/^0+/, '')}`,
      email: formData.email,
      password: formData.password,
      accountType: formData.accountType,
      role: formData.accountType === 'ResponseTeam' ? formData.role : null,
      nid: formData.nid,
      face: faceBase64,
      officeName: formData.accountType === 'ResponseTeam' ? formData.officeName : (formData.officeName || null),
      officeAddress: formData.accountType === 'ResponseTeam' ? formData.officeAddress : (formData.officeAddress || null),
    };

    try {
      const result = await dispatch(sendRegistrationOtp({ email: payload.email, phone: payload.phone })).unwrap();
      if (result?.tempRegistrationToken) {
        dispatch(setRegistrationState({ token: result.tempRegistrationToken, payload, email: payload.email }));
        showToast("Verification code dispatched to your email!", "info");
        navigate('/otp-verification?mode=registration');
      }
    } catch (err) {
      showToast(err || "Failed to dispatch registration verification OTP.", "error");
    }
  };

  if (submittedSuccess) {
    return (
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-t-4 border-tertiary space-y-6">
          <div className="w-20 h-20 bg-tertiary/10 text-tertiary rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-5xl">verified_user</span>
          </div>
          <div>
            <span className="bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3">
              Application Under Review
            </span>
            <h2 className="text-2xl font-bold text-on-surface">Registration Submitted!</h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Your official application for <strong className="text-tertiary">{formData.accountType === 'ResponseTeam' ? `${formData.role.toUpperCase()} (Response Team)` : 'Reporter'}</strong> has been registered.
            </p>
            <p className="text-xs text-on-surface-variant/80 mt-2">
              System administrators will verify your credentials with precinct/agency records. You will receive an update once verified.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Link
              to="/login/vetted"
              className="w-full py-3.5 bg-tertiary text-on-tertiary font-bold rounded-xl hover:brightness-110 transition-all text-center"
            >
              Go to Official Login
            </Link>
            <Link
              to="/"
              className="w-full py-3.5 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-all text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen text-base overflow-x-hidden selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-surface/80 backdrop-blur-md border-b border-tertiary/20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/signup/select-role" className="material-symbols-outlined text-tertiary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">arrow_back</Link>
          <span className="text-xl font-bold text-tertiary">Protocol Zero</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full hidden md:block">
            Official Responder Portal
          </span>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto relative">
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-tertiary-container text-on-tertiary-container px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 mb-4">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="text-xs font-bold uppercase tracking-wider">RESPONSE TEAM & VETTED REGISTRATION</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-on-surface">
            Enroll as <span className="text-tertiary">Official Response Team</span>
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl text-sm md:text-base mx-auto md:mx-0">
            Submit your professional credentials (Police, Civil Surgeon, or Firefighters) for agency verification and tactical emergency response access.
          </p>
        </div>

        {/* Bento Registration Form */}
        <div className="bg-white border-t-[4px] border-tertiary rounded-2xl shadow-xl p-6 lg:p-10 relative z-10">
          <form className="space-y-8" onSubmit={handleSubmit}>

            {/* Account Classification */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Registration Classification</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'ResponseTeam', role: prev.role || 'police' }))}
                  className={`p-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                    formData.accountType === 'ResponseTeam'
                      ? 'border-tertiary bg-tertiary/10 text-tertiary shadow-sm'
                      : 'border-outline-variant text-on-surface-variant hover:border-tertiary/50'
                  }`}
                >
                  <span className="material-symbols-outlined">shield</span>
                  Response Team (Police / Fire / EMT)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, accountType: 'Reporter', role: '' }))}
                  className={`p-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all ${
                    formData.accountType === 'Reporter'
                      ? 'border-tertiary bg-tertiary/10 text-tertiary shadow-sm'
                      : 'border-outline-variant text-on-surface-variant hover:border-tertiary/50'
                  }`}
                >
                  <span className="material-symbols-outlined">campaign</span>
                  Vetted Reporter
                </button>
              </div>
            </div>

            {/* Section 1: Personal Identity */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">person_pin</span>
                <h3 className="text-xl font-bold text-on-surface">Personal Identity</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Full Legal Name *</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">badge</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="name" value={formData.name} onChange={handleInputChange} placeholder="Commander / Dr. John Doe" type="text" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Mobile Phone Number *</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">phone_iphone</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="01717xxxxxx" type="tel" required />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Official Work Email *</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">alternate_email</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="email" value={formData.email} onChange={handleInputChange} placeholder="officer@police.gov.bd" type="email" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Residential Address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">home</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} placeholder="Residential Address, City" type="text" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Duty & Station (Response Team Specific) */}
            {formData.accountType === 'ResponseTeam' && (
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                  <span className="material-symbols-outlined text-tertiary text-2xl">local_police</span>
                  <h3 className="text-xl font-bold text-on-surface">Unit & Station Duty</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Response Designation Unit *</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">work</span>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full appearance-none pl-10 pr-10 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none cursor-pointer text-on-surface font-semibold"
                    >
                      <option value="police">Police / Law Enforcement</option>
                      <option value="firefighter">Firefighter / Search & Rescue</option>
                      <option value="civilsurgeon">Civil Surgeon / EMT Medical</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Precinct / Station Name *</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">domain</span>
                      <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="officeName" value={formData.officeName} onChange={handleInputChange} placeholder="Central Precinct / Fire Station 04" type="text" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Station Address *</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">location_on</span>
                      <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="officeAddress" value={formData.officeAddress} onChange={handleInputChange} placeholder="900 Justice Plaza, Sector 4" type="text" required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Document Verification */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">fingerprint</span>
                <h3 className="text-xl font-bold text-on-surface">Identity Verification Assets</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">National ID (NID) Number *</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">badge</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none font-mono" name="nid" value={formData.nid} onChange={handleInputChange} placeholder="1995123456789" type="text" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Face Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Facial Image Verification *</label>
                  <div className="group/file relative w-full h-28 bg-surface-container-lowest border-2 border-dashed border-outline-variant hover:border-tertiary hover:bg-tertiary/5 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" type="file" accept="image/*" onChange={handleFaceFileChange} required />

                    {faceImage ? (
                      <div className="flex flex-col items-center gap-1 text-tertiary z-0">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        <span className="text-xs font-semibold truncate max-w-[180px] px-2">{faceImage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-outline group-hover/file:text-tertiary transition-colors z-0">
                        <span className="material-symbols-outlined text-3xl">face</span>
                        <span className="text-xs font-medium">Click to upload live facial photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* NID Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Official NID Card Image</label>
                  <div className="group/file relative w-full h-28 bg-surface-container-lowest border-2 border-dashed border-outline-variant hover:border-tertiary hover:bg-tertiary/5 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" type="file" accept="image/*" onChange={handleNidFileChange} />

                    {nidImage ? (
                      <div className="flex flex-col items-center gap-1 text-tertiary z-0">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        <span className="text-xs font-semibold truncate max-w-[180px] px-2">{nidImage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-outline group-hover/file:text-tertiary transition-colors z-0">
                        <span className="material-symbols-outlined text-3xl">id_card</span>
                        <span className="text-xs font-medium">Click to upload physical NID photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Security */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">lock</span>
                <h3 className="text-xl font-bold text-on-surface">Account Passcode</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Create Secure Password *</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">vpn_key</span>
                  <input className="w-full pl-10 pr-10 py-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-base focus:ring-2 focus:ring-tertiary outline-none" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••••••" type={showPassword ? "text" : "password"} required />
                  <button type="button" onClick={togglePassword} className="absolute right-3 text-outline hover:text-tertiary transition-colors p-1">
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Backend Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                <span>{typeof error === 'string' ? error : error?.message || 'Registration error occurred'}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-6 border-t border-outline-variant/40 flex flex-col items-center gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 text-on-tertiary text-lg font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isLoading ? 'opacity-80 pointer-events-none bg-tertiary/70' : 'bg-tertiary hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    <span>Submitting Credentials...</span>
                  </>
                ) : (
                  <>
                    Submit Application for Review
                    <span className="material-symbols-outlined text-[24px]">send</span>
                  </>
                )}
              </button>

              <p className="text-xs font-medium text-on-surface-variant text-center max-w-lg">
                By submitting this application, you verify that you are an authorized professional representing your precinct or department.
              </p>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center pb-8">
          <p className="text-sm text-on-surface-variant">
            Already have a registered account? <Link className="text-tertiary font-bold hover:underline" to="/login/vetted">Go to Official Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default VettedRegistration;
