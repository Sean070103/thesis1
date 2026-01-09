'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AlertModal from '@/components/AlertModal';

// Create default admin user if none exists
function ensureDefaultUser() {
  if (typeof window === 'undefined') return;
  
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.length === 0) {
    const defaultAdmin = {
      id: 'admin_default',
      name: 'System Admin',
      email: 'admin@autocarpets.com',
      password: 'admin123',
      role: 'admin',
      department: 'management',
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    localStorage.setItem('users', JSON.stringify([defaultAdmin]));
    console.log('Default admin user created: admin@autocarpets.com / admin123');
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Ensure default user exists on component mount
  useEffect(() => {
    ensureDefaultUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Use redirect path from login result, default to dashboard
        router.push(result.redirectTo || '/');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Password Reset Info Modal */}
      <AlertModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Password Reset"
        message="Please contact your system administrator to reset your password."
        type="info"
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20 mb-4">
            <Box className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Autocarpets Inc.</h1>
          <p className="text-slate-400 text-sm mt-1">Inventory Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                placeholder="admin@autocarpets.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
                />
                <span className="ml-2 text-sm text-slate-400">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-slate-500 text-sm">
              Need access?{' '}
              <span className="text-slate-400">Contact system administrator</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-500 text-xs">
            Access is restricted to authorized Autocarpets Inc. personnel.
          </p>
          <p className="text-slate-600 text-xs">
            © 2024 Autocarpets Incorporation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
