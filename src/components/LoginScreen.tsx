import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { cn } from '../lib/utils';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sv-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm flex flex-col items-center text-center relative z-10 border border-sv-border/50">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sv-primary to-blue-800 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-6">
          <Shield className="w-8 h-8 text-white" fill="currentColor" strokeWidth={1} />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Admin Portal</h1>
        <p className="text-sm text-sv-text-secondary mb-8">Sword Payment Tracker</p>
        
        {error && (
          <div className="w-full bg-sv-danger/10 border border-sv-danger/20 text-sv-danger rounded-xl p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-[#060B16] font-medium rounded-xl hover:bg-gray-100 premium-transition shadow-[0_0_20px_rgba(255,255,255,0.1)]",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        <div className="mt-8 pt-6 border-t border-sv-border/50 w-full text-xs text-sv-text-secondary flex flex-col gap-2">
          <p>Secure Admin Access Only</p>
          <p className="opacity-50">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
