import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, verifyRegistrationOtp, sendRegistrationOtp, setRegistrationState } from '../features/auth/authSlice';
import { useToast } from '../context/ToastContext';

const OtpVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const inputRefs = useRef([]);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(59);
  const [vettedSubmittedUser, setVettedSubmittedUser] = useState(null);

  const {
    requiresOtp,
    tempToken,
    registrationToken,
    registrationPayload,
    registrationEmail,
    isLoading,
    error
  } = useSelector((state) => state.auth);

  const searchParams = new URLSearchParams(location.search);
  const isRegistrationMode = searchParams.get('mode') === 'registration' || !!registrationToken;

  const targetEmail = isRegistrationMode
    ? registrationEmail || registrationPayload?.email || 'your email'
    : 'your registered email';

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (value.length > 1) {
      e.target.value = value.slice(0, 1);
    }

    const newOtp = [...otp];
    newOtp[index] = e.target.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (e.target.value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;

    if (isRegistrationMode && registrationPayload) {
      try {
        const result = await dispatch(sendRegistrationOtp({
          email: registrationPayload.email,
          phone: registrationPayload.phone
        })).unwrap();

        if (result?.tempRegistrationToken) {
          dispatch(setRegistrationState({
            token: result.tempRegistrationToken,
            payload: registrationPayload,
            email: registrationPayload.email
          }));
          showToast(`A new 6-digit verification code was sent to ${registrationPayload.email}.`, "success");
          setTimeLeft(59);
        }
      } catch (err) {
        showToast(typeof err === 'string' ? err : err?.message || "Failed to resend verification code.", "error");
      }
    } else {
      showToast("Verification code resent.", "info");
      setTimeLeft(59);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      showToast("Please enter the complete 6-digit verification code.", "warning");
      return;
    }

    if (isRegistrationMode) {
      if (!registrationToken || !registrationPayload) {
        showToast("Registration session expired. Please sign up again.", "error");
        navigate('/signup');
        return;
      }

      try {
        const res = await dispatch(verifyRegistrationOtp({
          tempRegistrationToken: registrationToken,
          otp: code,
          registrationPayload
        })).unwrap();

        const created = res.user;
        const isVetted = ['Reporter', 'ResponseTeam'].includes(created?.accountType);

        if (isVetted) {
          setVettedSubmittedUser(created);
          showToast("Email verified! Application submitted for institutional review.", "success");
        } else {
          showToast("Email verified & account registered successfully! Welcome to Protocol Zero.", "success");
          navigate('/home');
        }
      } catch (err) {
        showToast(typeof err === 'string' ? err : err?.message || "OTP verification failed.", "error");
      }
    } else {
      // Login 2FA Mode
      try {
        await dispatch(verifyOtp({ otp: code, tempToken })).unwrap();
        showToast("Authentication successful! Welcome back.", "success");
        navigate('/home');
      } catch (err) {
        showToast(typeof err === 'string' ? err : err?.message || "2FA verification failed.", "error");
      }
    }
  };

  // Graceful Screen for Vetted Applications Under Review
  if (vettedSubmittedUser) {
    return (
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-t-4 border-amber-500 space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-5xl">verified_user</span>
          </div>
          <div>
            <span className="bg-amber-500/10 text-amber-700 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full inline-block mb-3 border border-amber-500/30">
              PENDING ADMIN VERIFICATION
            </span>
            <h2 className="text-2xl font-bold text-on-surface">Application Under Review!</h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Your email has been verified successfully. Your official application for <strong className="text-primary">{vettedSubmittedUser.role ? `${vettedSubmittedUser.role.toUpperCase()} (Response Team)` : vettedSubmittedUser.accountType}</strong> is now registered in our system.
            </p>
            <p className="text-xs text-on-surface-variant/80 mt-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 leading-relaxed">
              System administrators will verify your credentials with precinct/agency records. Operational dispatch tools will activate once verified by precinct admins.
            </p>
          </div>
          <div className="pt-4 border-t border-outline-variant/30 flex gap-3 justify-center">
            <button onClick={() => navigate('/login/vetted')} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer">
              Go to Official Login
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-highest transition-all cursor-pointer">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md bg-surface-container-low shadow-sm flex justify-between items-center px-4 h-14">
        <button
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 duration-150 text-on-surface-variant cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-primary truncate max-w-[200px]">
          {isRegistrationMode ? 'Email Verification' : 'Verify Your Identity'}
        </h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-md px-4 pt-24 pb-12 flex flex-col">
        {/* Illustration / Brand Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-white text-5xl">mark_email_read</span>
          </div>
        </div>

        {/* Descriptive Copy */}
        <section className="text-center mb-8">
          <h2 className="text-2xl font-bold text-on-surface mb-2">
            {isRegistrationMode ? 'Registration Email Verification' : 'Two-Factor Authentication'}
          </h2>
          <p className="text-sm text-on-surface-variant px-4 leading-relaxed">
            We've sent a 6-digit verification code to <strong className="text-primary">{targetEmail}</strong>.
          </p>
        </section>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 bg-error-container text-on-error-container text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{typeof error === 'string' ? error : error?.message || 'Verification error occurred'}</span>
          </div>
        )}

        {/* OTP Input Area */}
        <div className="flex justify-between gap-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="number"
              maxLength="1"
              pattern="\d*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-outline-variant rounded-lg bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{ MozAppearance: 'textfield' }}
            />
          ))}
        </div>

        {/* Timer & Resend */}
        <div className="flex flex-col items-center gap-2 mb-8">
          {timeLeft > 0 ? (
            <p className="text-xs font-medium text-on-surface-variant">
              Resend code in <span className="font-bold text-primary">0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </p>
          ) : (
            <p className="text-xs font-medium text-transparent select-none">
              Resend code active
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={timeLeft > 0 || isLoading}
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              timeLeft > 0 || isLoading ? 'text-outline cursor-not-allowed opacity-50' : 'text-primary cursor-pointer hover:text-primary-container'
            }`}
          >
            RESEND CODE
          </button>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading}
          className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{isLoading ? 'Verifying...' : 'Verify Code'}</span>
          <span className="material-symbols-outlined text-[20px]">verified</span>
        </button>

        {/* Decorative Security Message */}
        <div className="mt-auto pt-8 flex items-center justify-center gap-2 text-outline-variant">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span className="text-xs font-medium">Sha-256 HMAC Encrypted Verification</span>
        </div>
      </main>

      <div className="h-6"></div>
    </div>
  );
};

export default OtpVerification;
