'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { LoyaltySettings } from '@/lib/loyalty-math';

type LoyaltyLedgerRow = {
  id: string;
  entry_type: 'earn' | 'redeem' | 'adjust';
  points: number;
  note: string | null;
  created_at: string;
};

export default function LoyaltyPage() {
  usePageTitle('Loyalty Program');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [points, setPoints] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [ledger, setLedger] = useState<LoyaltyLedgerRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/auth/login');
        return;
      }
      const res = await fetch('/api/loyalty/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const json = await res.json();
      setEnabled(Boolean(json.enabled));
      setPoints(Number(json.account?.points || 0));
      setLifetime(Number(json.account?.lifetime_points || 0));
      setSettings(json.settings || null);
      setLedger(json.ledger || []);
      setLoading(false);
    }
    void load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <i className="ri-loader-4-line animate-spin text-4xl text-brand-espresso"></i>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/account" className="text-sm font-semibold text-brand-espresso hover:underline">
            ← Back to account
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Loyalty Program</h1>
          <p className="text-gray-600 mt-1">Earn points on every paid order using this email — even as a guest — and redeem them at checkout.</p>
        </div>

        {!enabled && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            The loyalty program is not active yet. Check back soon.
          </div>
        )}

        {enabled && settings && (
          <>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Your points</p>
              <p className="text-4xl font-bold text-brand-espresso mt-1">{points}</p>
              <p className="text-sm text-gray-500 mt-2">{lifetime} lifetime points earned</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-2">How it works</h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Earn 1 point for every GH₵ {settings.earnGhsPerPoint} you spend on a paid order.</li>
                <li>{settings.redeemPoints} points = GH₵ {settings.redeemValueGhs} off your next checkout.</li>
                <li>You need at least {settings.minRedeemPoints} points to redeem.</li>
                <li>Guest checkouts count too, as long as you use the same email.</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="font-bold text-gray-900 mb-3">Activity</h2>
              {ledger.length === 0 ? (
                <p className="text-sm text-gray-500">No points yet. Place an order while signed in to start earning.</p>
              ) : (
                <div className="space-y-3">
                  {ledger.map((row) => (
                    <div key={row.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                      <div>
                        <p className="font-medium capitalize">{row.entry_type}</p>
                        <p className="text-gray-500">{row.note}</p>
                      </div>
                      <span className={row.points >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                        {row.points > 0 ? '+' : ''}
                        {row.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
