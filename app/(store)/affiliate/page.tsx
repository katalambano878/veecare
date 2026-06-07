'use client';

import { useState, useEffect } from 'react';
import PageHero from '@/components/PageHero';
import { usePageTitle } from '@/hooks/usePageTitle';

type AffiliateData = {
  code: string;
  name: string;
  email: string;
  commission_rate: number;
  status: string;
  total_orders: number;
  total_earned: number;
  total_paid: number;
  pendingBalance: number;
  referralLink: string;
};

type Commission = {
  id: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

const STORAGE_KEY = 'veecare_affiliate_login';

export default function AffiliatePage() {
  usePageTitle('Affiliate Dashboard');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.code && parsed.email) {
          setCode(parsed.code);
          setEmail(parsed.email);
          loadDashboard(parsed.code, parsed.email);
        }
      }
    } catch {
      // ignore invalid storage
    }
  }, []);

  const loadDashboard = async (loginCode: string, loginEmail: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/affiliate/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: loginCode, email: loginEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAffiliate(null);
        setCommissions([]);
        setError(data.error || 'Could not load dashboard');
        return;
      }

      setAffiliate(data.affiliate);
      setCommissions(data.commissions || []);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ code: loginCode.trim().toUpperCase(), email: loginEmail.trim().toLowerCase() })
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboard(code, email);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAffiliate(null);
    setCommissions([]);
    setCode('');
    setEmail('');
    setError('');
  };

  const copyLink = async () => {
    if (!affiliate?.referralLink) return;
    try {
      await navigator.clipboard.writeText(affiliate.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(affiliate.referralLink);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-brand-nude/50 text-brand-espresso',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title="Affiliate Program"
        subtitle="Share your link, earn commission on every sale"
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {!affiliate ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-brand-nude/60 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-brand-espresso mb-2">Partner Login</h2>
            <p className="text-brand-cocoa/80 mb-6 text-sm">
              Enter the referral code and email your admin gave you to view earnings.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-espresso mb-1">
                  Referral Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="JANE10"
                  required
                  className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-espresso mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-brand-nude rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-espresso hover:bg-brand-cocoa text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Loading...' : 'View Dashboard'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-brand-espresso">Welcome, {affiliate.name}</h2>
                <p className="text-brand-cocoa/80">
                  Code: <span className="font-mono font-bold">{affiliate.code}</span> ·{' '}
                  {Number(affiliate.commission_rate)}% commission
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-brand-cocoa hover:text-brand-espresso cursor-pointer"
              >
                Sign out
              </button>
            </div>

            {affiliate.status !== 'active' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                Your account is currently <strong>{affiliate.status}</strong>. New referrals may
                not earn commission until an admin activates your account.
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-brand-nude/60 p-5">
                <p className="text-sm text-brand-cocoa/70 mb-1">Referred Orders</p>
                <p className="text-2xl font-bold text-brand-espresso">{affiliate.total_orders}</p>
              </div>
              <div className="bg-white rounded-xl border border-brand-nude/60 p-5">
                <p className="text-sm text-brand-cocoa/70 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-brand-espresso">
                  GH₵{Number(affiliate.total_earned).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-brand-nude/60 p-5">
                <p className="text-sm text-brand-cocoa/70 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-brand-espresso">
                  GH₵{Number(affiliate.total_paid).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-brand-nude/60 p-5">
                <p className="text-sm text-brand-cocoa/70 mb-1">Pending Payout</p>
                <p className="text-2xl font-bold text-amber-700">
                  GH₵{Number(affiliate.pendingBalance).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-brand-nude/60 p-6">
              <h3 className="text-lg font-bold text-brand-espresso mb-3">Your Referral Link</h3>
              <p className="text-sm text-brand-cocoa/80 mb-4">
                Share this link. When someone buys within 30 days, you earn commission on their
                order.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  readOnly
                  value={affiliate.referralLink}
                  className="flex-1 px-4 py-3 bg-brand-cream border-2 border-brand-nude rounded-lg font-mono text-sm"
                />
                <button
                  onClick={copyLink}
                  className="bg-brand-espresso hover:bg-brand-cocoa text-white px-6 py-3 rounded-lg font-semibold whitespace-nowrap cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-brand-nude/60 overflow-hidden">
              <div className="p-6 border-b border-brand-nude/40">
                <h3 className="text-lg font-bold text-brand-espresso">Recent Commissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-cream/80">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-brand-cocoa">
                        Order
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-brand-cocoa">
                        Order Total
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-brand-cocoa">
                        Commission
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-brand-cocoa">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-brand-cocoa">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-brand-cocoa/70">
                          No commissions yet. Share your link to start earning!
                        </td>
                      </tr>
                    ) : (
                      commissions.map((c) => (
                        <tr key={c.id} className="border-t border-brand-nude/30">
                          <td className="py-3 px-6 font-mono text-sm">{c.order_number}</td>
                          <td className="py-3 px-4">GH₵{Number(c.order_total).toFixed(2)}</td>
                          <td className="py-3 px-4 font-semibold">
                            GH₵{Number(c.commission_amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-brand-cocoa/80">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[c.status] || 'bg-gray-100'}`}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
