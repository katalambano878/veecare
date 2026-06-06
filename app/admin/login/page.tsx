'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import Logo from '@/components/Logo';
import { BRAND_NAME, TAGLINE } from '@/lib/brand';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { getToken, verifying } = useRecaptcha();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const isHuman = await getToken('admin_login');
    if (!isHuman) {
      setError('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;

        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-nude/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex justify-center">
              <Logo className="h-16 w-auto max-w-[240px] object-contain mx-auto" priority />
            </div>
          </Link>
          <p className="font-display text-brand-mauve text-sm tracking-wide mt-3">{BRAND_NAME}</p>
          <h1 className="font-display text-3xl font-semibold text-brand-espresso mt-4 mb-2">
            Admin Login
          </h1>
          <p className="text-brand-cocoa/80 text-sm max-w-xs mx-auto">{TAGLINE}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-luxury p-8 border border-brand-nude">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <i className="ri-error-warning-line text-red-600 text-xl mt-0.5"></i>
              <div>
                <p className="text-red-800 font-semibold">Login Failed</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-brand-espresso mb-2">
                Email Address
              </label>
              <div className="relative">
                <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-brand-cocoa/40 text-lg"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-brand-nude rounded-lg focus:ring-2 focus:ring-brand-champagne/50 focus:border-brand-espresso text-brand-cocoa"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-espresso mb-2">
                Password
              </label>
              <div className="relative">
                <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-brand-cocoa/40 text-lg"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-brand-nude rounded-lg focus:ring-2 focus:ring-brand-champagne/50 focus:border-brand-espresso text-brand-cocoa"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cocoa/50 hover:text-brand-espresso w-5 h-5 flex items-center justify-center"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || verifying}
              className="w-full bg-brand-espresso hover:bg-brand-cocoa text-brand-cream py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
            >
              {isLoading || verifying ? (
                <span className="flex items-center justify-center space-x-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  <span>{verifying ? 'Verifying...' : 'Signing in...'}</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-brand-cocoa/80 hover:text-brand-espresso transition-colors whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
