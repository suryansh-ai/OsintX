import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, X, CheckCircle, AlertCircle, Loader, 
  ArrowRight, RefreshCw, Shield 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmailVerification = ({ isOpen, onClose, onVerified, token, email }) => {
  const [step, setStep] = useState('send'); // 'send' | 'otp' | 'success'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  
  const otpRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('send');
      setOtp(['', '', '', '', '', '']);
      setError('');
      setTimer(0);
    }
  }, [isOpen]);

  // Send verification code
  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/email/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('otp');
      setTimer(60); // 60 second resend timer
      
    } catch (err) {
      console.error('Send verification error:', err);
      setError(err.message || 'Failed to send verification code');
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
      const response = await fetch(`${API_BASE}/auth/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: otpValue })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setStep('success');
      setTimeout(() => {
        onVerified?.();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Verify error:', err);
      setError(err.message || 'Verification failed');
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

  // Resend code
  const handleResend = () => {
    if (timer > 0) return;
    setOtp(['', '', '', '', '', '']);
    handleSendCode();
  };

  // Reset state on close
  const handleClose = () => {
    setStep('send');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setTimer(0);
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
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Email Verification</h2>
                  <p className="text-sm text-gray-400">
                    {step === 'send' && 'Verify your email address'}
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

            {/* Send Code Step */}
            {step === 'send' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <p className="text-gray-400 mb-4">
                  We'll send a 6-digit verification code to:
                </p>
                <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
                  <p className="text-cyan-400 font-mono">{email}</p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg mb-4">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-400">
                    The code will expire in 10 minutes
                  </span>
                </div>

                <button
                  onClick={handleSendCode}
                  disabled={loading}
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
                  We sent a code to <span className="text-cyan-400">{email}</span>
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
                    onClick={() => setStep('send')}
                    className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium 
                      hover:bg-gray-700 transition-colors"
                  >
                    Back
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
                <h3 className="text-xl font-bold text-white mb-2">Email Verified!</h3>
                <p className="text-gray-400">
                  Your email address has been successfully verified.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailVerification;
