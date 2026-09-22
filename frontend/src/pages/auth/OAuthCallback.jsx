import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback, isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');

    if (!provider || !code) {
      setStatus('error');
      setErrorMsg('Missing OAuth parameters. Please try again.');
      return;
    }

    const processCallback = async () => {
      const result = await handleOAuthCallback(provider, code);
      if (result.success) {
        setStatus('success');
        // Short delay then redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Authentication failed. Please try again.');
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user && status === 'success') {
      navigate(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, user, status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-10 rounded-2xl bg-slate-800/30 border border-slate-700/50 max-w-sm w-full mx-4"
      >
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
            <p className="text-slate-400 text-sm">
              Completing {searchParams.get('provider') === 'google' ? 'Google' : 'GitHub'} sign-in
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome!</h2>
            <p className="text-slate-400 text-sm">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-cyan-500/25 transition-all"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
