import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(59);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Countdown Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    // Allow only 1 character
    if (value.length > 1) {
      e.target.value = value.slice(0, 1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = e.target.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (e.target.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    // TODO: Connect to real API for resending OTP
    alert('Verification code resent successfully.');
    setTimeLeft(59);
  };

  const handleVerify = () => {
    // TODO: Connect to real API to verify OTP
    // const code = otp.join('');
    navigate('/home');
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md bg-surface-container-low shadow-sm flex justify-between items-center px-4 h-14">
        <button 
          aria-label="Go back" 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors active:scale-95 duration-150 text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-primary truncate max-w-[200px]">Verify Your Identity</h1>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-md px-4 pt-24 pb-12 flex flex-col">
        {/* Illustration / Brand Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
        </div>

        {/* Descriptive Copy */}
        <section className="text-center mb-8">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Verification</h2>
          <p className="text-base text-on-surface-variant px-4">
            We've sent a 6-digit verification code to your registered mobile number.
          </p>
        </section>

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
              style={{ MozAppearance: 'textfield' }} // Hide arrows in Firefox
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
              Resend placeholder
            </p> // keeps spacing stable
          )}
          
          <button 
            onClick={handleResend}
            disabled={timeLeft > 0}
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              timeLeft > 0 ? 'text-outline cursor-not-allowed opacity-50' : 'text-primary cursor-pointer hover:text-primary-container'
            }`}
          >
            RESEND CODE
          </button>
        </div>

        {/* CTA Button */}
        <button 
          onClick={handleVerify}
          className="w-full h-12 bg-primary-container text-white font-bold rounded-lg shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="text-base">Verify</span>
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
        </button>

        {/* Decorative Security Message */}
        <div className="mt-auto pt-8 flex items-center justify-center gap-2 text-outline-variant">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span className="text-xs font-medium">End-to-end encrypted verification</span>
        </div>
      </main>

      {/* Bottom spacing for mobile virtual keyboards */}
      <div className="h-6"></div>
    </div>
  );
};

export default OtpVerification;
