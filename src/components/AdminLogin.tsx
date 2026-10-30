import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useAdminSettings } from '../context/AdminSettingsContext';
import { verifyPassword, setAuthenticatedSession, DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/auth';
import { navigate } from '../router';
import { DemoNotice } from './DemoNotice';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { settings, accentTextColor } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const activeHash = settings.passwordHash || DEFAULT_ADMIN_PASSWORD_HASH;
      const isValid = await verifyPassword(password, activeHash);

      if (isValid) {
        setAuthenticatedSession(rememberMe);
        onSuccess();
      } else {
        setError('Incorrect password. Please check your credentials and try again.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center px-4 py-12 transition-colors ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-[#f0ebf8]/40 text-neutral-900'
      }`}
    >
      <div className="w-full max-w-md mb-4">
        <DemoNotice />
      </div>
      <div
        className={`w-full max-w-md rounded-2xl border shadow-xl overflow-hidden transition-all ${
          isDark
            ? 'bg-neutral-900 border-neutral-800'
            : 'bg-white border-neutral-200/90'
        } ${isShaking ? 'animate-shake' : ''}`}
      >
        {/* Decorative Top Accent Bar */}
        <div
          className="h-2.5 transition-colors"
          style={{ backgroundColor: settings.accentColor }}
        />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Icon */}
          <div className="text-center space-y-2">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs mb-3 transition-transform hover:scale-105"
              style={{
                backgroundColor: `${settings.accentColor}18`,
                color: settings.accentColor
              }}
            >
              <Lock className="w-7 h-7" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Admin Authentication
            </h1>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Please enter your admin credentials to access the 3D Print management console.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter admin password..."
                  autoFocus
                  required
                  className={`w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border outline-none transition-all ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500'
                      : 'bg-neutral-50/80 border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-700 accent-purple-600 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Remember me for 7 days</span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted Session</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: settings.accentColor,
                color: accentTextColor
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Info & Default Password Helper */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400">
              <span>Default key:</span>
              <code className="font-semibold text-neutral-800 dark:text-neutral-200">admin123</code>
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Customer Request Form</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
