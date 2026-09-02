'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AffiliateLandingPage() {
  usePageTitle('Affiliate Program');
  const router = useRouter();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState<{ code: string; email: string; name: string } | null>(null);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', code: '' });

  useEffect(() => {
    fetch('/api/affiliate/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.affiliate) router.replace('/affiliate/dashboard');
      })
      .catch(() => undefined);
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit application');
        return;
      }
      setRegisterSuccess({
        code: data.affiliate.code,
        email: data.affiliate.email,
        name: data.affiliate.name,
      });
      setEmail(data.affiliate.email);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/affiliate/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send code');
        return;
      }
      setOtpSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/affiliate/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not sign in');
        return;
      }
      router.push('/affiliate/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title="Reseller Program"
        subtitle="Share Vee-care products. Customers pay your selling price. You earn the markup on top — never from Vee-care’s base price."
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 text-sm">
          {[
            'Apply',
            'Get approved',
            'Select products',
            'Generate selling links',
            'Share links',
            'Customer purchases',
            'Earn markup',
            'Get paid',
          ].map((step, index) => (
            <li key={step} className="bg-white rounded-xl border border-brand-nude/60 p-4">
              <span className="text-xs text-brand-cocoa/50">{index + 1}</span>
              <p className="font-medium text-brand-espresso">{step}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-brand-cocoa/70 mb-10">
          Earnings depend on paid customer orders. We do not promise a specific income.
        </p>

        <div className="max-w-lg mx-auto">
          {registerSuccess ? (
            <div className="bg-white rounded-2xl border border-brand-nude/60 shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-brand-espresso mb-2">Application submitted</h2>
              <p className="text-sm text-brand-cocoa/80 mb-4">
                Thanks, {registerSuccess.name}. Your public code is{' '}
                <span className="font-mono font-bold">{registerSuccess.code}</span>. You will sign in with a
                one-time email code after approval — not with this code.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegisterSuccess(null);
                  setMode('login');
                }}
                className="w-full bg-brand-espresso text-white py-3 rounded-lg font-semibold"
              >
                Go to sign in
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brand-nude/60 shadow-sm p-8">
              <div className="flex rounded-xl bg-brand-cream p-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                    mode === 'register' ? 'bg-white text-brand-espresso shadow-sm' : 'text-brand-cocoa/70'
                  }`}
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                    mode === 'login' ? 'bg-white text-brand-espresso shadow-sm' : 'text-brand-cocoa/70'
                  }`}
                >
                  Sign in
                </button>
              </div>

              {mode === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <input
                    required
                    placeholder="Full name"
                    className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                  <input
                    placeholder="Phone (optional)"
                    className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                  <input
                    placeholder="Preferred code (optional)"
                    className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg uppercase"
                    value={registerForm.code}
                    onChange={(e) => setRegisterForm({ ...registerForm, code: e.target.value.toUpperCase() })}
                  />
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-espresso text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Submitting…' : 'Submit application'}
                  </button>
                </form>
              ) : (
                <form onSubmit={otpSent ? verifyOtp : requestOtp} className="space-y-4">
                  <p className="text-sm text-brand-cocoa/80">
                    We email a one-time code to the address on your affiliate account. Your public referral code is
                    not a password.
                  </p>
                  <input
                    required
                    type="email"
                    placeholder="Affiliate email"
                    className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {otpSent && (
                    <input
                      required
                      inputMode="numeric"
                      placeholder="6-digit code"
                      className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg tracking-[0.3em] text-center"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  )}
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-espresso text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Please wait…' : otpSent ? 'Sign in' : 'Email me a code'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
