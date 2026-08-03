import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const VettedRegistration = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    homeAddress: '',
    role: '',
    officeName: '',
    officeAddress: '',
    nid: '',
    password: ''
  });

  const [faceImage, setFaceImage] = useState(null);
  const [nidImage, setNidImage] = useState(null);

  const navigate = useNavigate();
  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, setFileState) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileState(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // UI-only flow for now
    setTimeout(() => {
      setIsSubmitting(false);
      // Mock navigation to OTP or pending state
      navigate('/login/vetted');
    }, 2000);
  };

  return (
    <div className="bg-background text-on-background min-h-screen text-base overflow-x-hidden selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
      {/* TopAppBar Fragment */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-surface/80 backdrop-blur-md border-b border-tertiary/20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="material-symbols-outlined text-tertiary hover:bg-surface-variant/50 transition-colors p-2 rounded-full active:scale-95">arrow_back</Link>
          <span className="text-xl font-bold text-tertiary">Protocol Zero</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full hidden md:block">
            Official Registration Portal
          </span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto relative">
        {/* Background Decorative Element */}
        <div className="hidden lg:block absolute -left-32 top-10 w-96 h-96 opacity-20 -z-10 blur-[100px] rounded-full bg-tertiary"></div>

        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-tertiary-container text-on-tertiary-container px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 mb-4">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="text-xs font-bold uppercase tracking-wider">VETTED PROFESSIONAL APPLICATION</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-on-surface">
            Apply for <span className="text-tertiary">Official Access</span>
          </h1>
          <p className="text-on-surface-variant mt-3 max-w-2xl text-sm md:text-base mx-auto md:mx-0">
            Submit your credentials to join the Protocol Zero network as a Reporter or Response Team member. Your application will be manually reviewed by administrators.
          </p>
        </div>

        {/* Registration Form Bento Card */}
        <div className="bg-white border-t-[4px] border-tertiary rounded-xl shadow-xl p-6 lg:p-10 relative z-10">
          <form className="space-y-10" id="vettedSignupForm" onSubmit={handleSubmit}>

            {/* Section 1: Personal Identity */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">person_pin</span>
                <h3 className="text-xl font-bold text-on-surface">Personal Identity</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="name">Full Legal Name</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">badge</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" type="text" required />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="phone">Mobile Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">phone_iphone</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" type="tel" required />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="email">Official Work Email</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">alternate_email</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="agent@department.gov" type="email" required />
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="homeAddress">Residential Home Address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">home</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="homeAddress" name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} placeholder="123 Sentinel Way, Metro City" type="text" required />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Duty & Station */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">local_police</span>
                <h3 className="text-xl font-bold text-on-surface">Duty & Station</h3>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="role">Professional Role</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">work</span>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full appearance-none pl-10 pr-10 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none cursor-pointer text-on-surface"
                  >
                    <option disabled value="">Select your official designation...</option>
                    <option value="reporter">Reporter / Media Analyst</option>
                    <option value="police">Police / Law Enforcement</option>
                    <option value="firefighter">Firefighter / Search & Rescue</option>
                    <option value="civilsurgeon">Civil Surgeon / EMT Medical</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="officeName">Office / Precinct Name</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">domain</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="officeName" name="officeName" value={formData.officeName} onChange={handleInputChange} placeholder="Central Precinct 04" type="text" required />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="officeAddress">Primary Office Address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">location_on</span>
                    <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="officeAddress" name="officeAddress" value={formData.officeAddress} onChange={handleInputChange} placeholder="900 Justice Plaza" type="text" required />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Document Verification */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-2">
                <span className="material-symbols-outlined text-tertiary text-2xl">fingerprint</span>
                <h3 className="text-xl font-bold text-on-surface">Identity Verification Assets</h3>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="nid">National ID (NID) Number</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">badge</span>
                  <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none font-mono" id="nid" name="nid" value={formData.nid} onChange={handleInputChange} placeholder="ABC-12345-X" type="text" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Face Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Live Face Photo</label>
                  <div className="group/file relative w-full h-24 bg-surface-container-lowest border-2 border-dashed border-outline-variant hover:border-tertiary hover:bg-tertiary/5 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" id="face_photo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFaceImage)} required />

                    {faceImage ? (
                      <div className="flex flex-col items-center gap-1 text-tertiary z-0">
                        <span className="material-symbols-outlined text-[28px]">check_circle</span>
                        <span className="text-xs font-semibold truncate max-w-[150px] px-2">{faceImage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-outline group-hover/file:text-tertiary transition-colors z-0">
                        <span className="material-symbols-outlined text-[28px]">face</span>
                        <span className="text-xs font-medium">Upload clear facial image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* NID Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1">Official NID Document</label>
                  <div className="group/file relative w-full h-24 bg-surface-container-lowest border-2 border-dashed border-outline-variant hover:border-tertiary hover:bg-tertiary/5 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                    <input className="absolute inset-0 opacity-0 cursor-pointer z-10" id="nid_photo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, setNidImage)} required />

                    {nidImage ? (
                      <div className="flex flex-col items-center gap-1 text-tertiary z-0">
                        <span className="material-symbols-outlined text-[28px]">check_circle</span>
                        <span className="text-xs font-semibold truncate max-w-[150px] px-2">{nidImage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-outline group-hover/file:text-tertiary transition-colors z-0">
                        <span className="material-symbols-outlined text-[28px]">id_card</span>
                        <span className="text-xs font-medium">Upload photo of physical NID</span>
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
                <h3 className="text-xl font-bold text-on-surface">Account Security</h3>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant ml-1 group-focus-within:text-tertiary transition-colors" htmlFor="password">Create Secure Passcode</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] group-focus-within:text-tertiary transition-colors">vpn_key</span>
                  <input className="w-full pl-10 pr-10 py-3 bg-surface-container-low border border-transparent rounded-lg text-base focus:ring-2 focus:ring-tertiary focus:border-transparent transition-all outline-none" id="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••••••" type={showPassword ? "text" : "password"} required />
                  <button type="button" onClick={togglePassword} className="absolute right-3 text-outline text-[20px] hover:text-tertiary transition-colors p-1">
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-6 border-t border-outline-variant/40 flex flex-col items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 text-on-tertiary text-lg font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-80 pointer-events-none bg-tertiary/70' : 'bg-tertiary hover:brightness-110 active:scale-[0.98]'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    <span>Encrypting Application...</span>
                  </>
                ) : (
                  <>
                    Submit Application for Review
                    <span className="material-symbols-outlined text-[24px]">send</span>
                  </>
                )}
              </button>

              <p className="text-xs font-medium text-on-surface-variant text-center max-w-lg">
                By submitting this form, you acknowledge that providing false institutional credentials is a federal offense. Review the <Link className="text-tertiary font-bold hover:underline" to="#">Terms of Service</Link>.
              </p>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center pb-8">
          <p className="text-sm text-on-surface-variant">
            Already have a verified account? <Link className="text-tertiary font-bold hover:underline" to="/login/vetted">Go to Official Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default VettedRegistration;
