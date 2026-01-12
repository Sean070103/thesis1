'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Load remembered email on mount
  useEffect(() => {
    ensureDefaultUser();
    if (typeof window !== 'undefined') {
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    }
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-100/30 to-orange-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/20 to-purple-100/10 rounded-full blur-3xl" />
      </div>

      {/* Password Reset Info Modal */}
      <AlertModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Password Reset"
        message="Please contact your system administrator to reset your password."
        type="info"
      />

      {/* Left Side - Image with enhanced overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden group h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-transparent z-10" />
        <img 
          src="/images/work.jfif" 
          alt="Work Environment" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Overlay content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-2xl font-bold">Autocarpets Inc.</h3>
            <p className="text-slate-200 text-base">Inventory Management</p>
          </div>
        </div>
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-4 lg:p-8 relative z-10 h-full overflow-hidden">
        <div className="w-full max-w-md mx-auto flex flex-col h-full">
          {/* Logo Section */}
          <div className="mb-6 animate-fade-in flex-shrink-0">
            <img 
              src="/images/aclogo.jfif" 
              alt="ACI Autocarpets Inc. Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-2xl ring-1 ring-slate-200/50">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="mb-5 flex-shrink-0">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
                  Welcome back
                </h2>
                <p className="text-slate-600 text-xs">Sign in to your account to continue</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-shake">
                  <div className="w-1 h-full bg-red-500 rounded-full flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs font-medium flex-1">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-3 py-3 bg-slate-50 rounded-xl text-slate-900 text-sm placeholder-slate-400 transition-all duration-200 outline-none border-0 ${
                        focusedField === 'email'
                          ? 'bg-white shadow-lg shadow-amber-500/10'
                          : 'hover:bg-slate-100/50'
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full pl-10 pr-10 py-3 bg-slate-50 rounded-xl text-slate-900 text-sm placeholder-slate-400 transition-all duration-200 outline-none border-0 ${
                        focusedField === 'password'
                          ? 'bg-white shadow-lg shadow-amber-500/10'
                          : 'hover:bg-slate-100/50'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors p-1 rounded-lg hover:bg-amber-50"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-2 border-slate-300 bg-white text-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-1 cursor-pointer transition-all group-hover:border-amber-400"
                    />
                    <span className="ml-2 text-xs text-slate-600 group-hover:text-slate-900 font-medium transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-all hover:underline decoration-2 underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group mt-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">Sign In</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-auto pt-4 border-t border-slate-200 flex-shrink-0">
                <p className="text-center text-slate-500 text-[10px]">
                  Need access?{' '}
                  <span className="text-slate-700 font-semibold">Contact system administrator</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
