import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, X, CheckCircle, AlertCircle, Loader, 
  ArrowRight, RefreshCw, Shield, Phone 
} from 'lucide-react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../config/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PhoneVerification = ({ isOpen, onClose, onVerified, token, currentPhone }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91'); // Default to India
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const otpRefs = useRef([]);
  const recaptchaRef = useRef(null);
  const recaptchaVerifier = useRef(null);

  // Country codes
  const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  ];

  // Initialize reCAPTCHA
  useEffect(() => {
    if (isOpen && !recaptchaVerifier.current) {
      try {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
      } catch (err) {
        console.error('reCAPTCHA init error:', err);
      }
    }

    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    };
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Send OTP
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      const confirmation = await signInWithPhoneNumber(auth, fullNumber, recaptchaVerifier.current);
      setConfirmationResult(confirmation);
      setStep('otp');
      setTimer(60); // 60 second resend timer
      
    } catch (err) {
      console.error('Send OTP error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA verification failed. Please refresh and try again.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otpValue);
      const firebaseUser = result.user;
      
      // Save verified phone to backend
      const fullNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      const response = await fetch(`${API_BASE}/auth/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: fullNumber,
          firebaseUid: firebaseUser.uid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save phone number');
      }

      setStep('success');
      setTimeout(() => {
        onVerified?.(fullNumber);
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Verify OTP error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pasted.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP
  const handleResend = () => {
    if (timer > 0) return;
    setOtp(['', '', '', '', '', '']);
    handleSendOTP();
  };

  // Reset state on close
  const handleClose = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setTimer(0);
    setConfirmationResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-2xl border border-cyan-500/30 w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Phone Verification</h2>
                  <p className="text-sm text-gray-400">
                    {step === 'phone' && 'Enter your phone number'}
                    {step === 'otp' && 'Enter the verification code'}
                    {step === 'success' && 'Verified successfully'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone Input Step */}
            {step === 'phone' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                        focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    >
                      {countryCodes.map(({ code, country, flag }) => (
                        <option key={code} value={code}>
                          {flag} {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter phone number"
                      maxLength={15}
                      className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                        placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg mb-4">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-400">
                    We'll send a 6-digit verification code via SMS
                  </span>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phoneNumber}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg 
                    font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* OTP Input Step */}
            {step === 'otp' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-gray-400 mb-4">
                  We sent a code to <span className="text-cyan-400 font-mono">{countryCode}{phoneNumber}</span>
                </p>

                <div className="flex justify-center gap-2 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold bg-gray-800 border border-gray-700 
                        rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  {timer > 0 ? (
                    <span className="text-sm text-gray-400">
                      Resend code in <span className="text-cyan-400 font-mono">{timer}s</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Resend Code
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('phone')}
                    className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium 
                      hover:bg-gray-700 transition-colors"
                  >
                    Change Number
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.join('').length !== 6}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg 
                      font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Phone Verified!</h3>
                <p className="text-gray-400">
                  Your phone number has been successfully verified.
                </p>
              </motion.div>
            )}
          </div>

          {/* reCAPTCHA container (invisible) */}
          <div id="recaptcha-container" ref={recaptchaRef}></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhoneVerification;
