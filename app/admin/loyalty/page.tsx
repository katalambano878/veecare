'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { LoyaltySettings } from '@/lib/loyalty-math';

type AccountRow = {
  user_id: string | null;
  points: number;
  lifetime_points: number;
  updated_at: string | null;
  email: string;
  full_name: string | null;
};

type LedgerRow = {
  id: string;
  entry_type: 'earn' | 'redeem' | 'adjust';
  points: number;
  note: string | null;
  created_at: string;
};

async function adminFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export default function AdminLoyaltyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [settings, setSettings] = useState<LoyaltySettings>({
    earnGhsPerPoint: 10,
    redeemPoints: 100,
    redeemValueGhs: 10,
    minRedeemPoints: 100,
  });
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async (email?: string | null) => {
    setLoading(true);
    try {
      const qs = email ? `?email=${encodeURIComponent(email)}` : '';
      const data = await adminFetch(`/api/admin/loyalty${qs}`);
      setEnabled(Boolean(data.enabled));
      if (data.settings) setSettings(data.settings);
      setAccounts(data.accounts || []);
      setLedger(data.ledger || []);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      await adminFetch('/api/admin/loyalty', {
        method: 'POST',
        body: JSON.stringify({ action: 'save-settings', settings }),
      });
      setMessage('Loyalty rules saved.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async () => {
    setSaving(true);
    setMessage('');
    try {
      const data = await adminFetch('/api/admin/loyalty', {
        method: 'POST',
        body: JSON.stringify({ action: 'set-enabled', enabled: !enabled }),
      });
      setEnabled(Boolean(data.enabled));
      setMessage(data.enabled ? 'Loyalty program enabled.' : 'Loyalty program disabled.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Could not update program status');
    } finally {
      setSaving(false);
    }
  };

  const applyAdjustment = async () => {
    if (!selectedEmail) return;
    const points = Number(adjustPoints);
    if (!points) {
      setMessage('Enter a positive or negative point amount.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await adminFetch('/api/admin/loyalty', {
        method: 'POST',
        body: JSON.stringify({
          action: 'adjust',
          email: selectedEmail,
          points,
          note: adjustNote || 'Admin adjustment',
        }),
      });
      setAdjustPoints('');
      setAdjustNote('');
      setMessage('Points updated.');
      await load(selectedEmail);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.full_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-gray-600 mt-1">Set earn/redeem rules and manage customer points.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/modules" className="text-sm font-semibold text-brand-espresso hover:underline">
            Modules
          </Link>
          <button
            onClick={toggleEnabled}
            disabled={saving}
            className={`px-5 py-3 rounded-lg font-semibold ${
              enabled ? 'bg-brand-espresso text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-white border border-brand-nude rounded-xl px-4 py-3 text-sm text-gray-800">{message}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Rules</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">
            GHS spent per 1 point
            <input
              type="number"
              min={1}
              value={settings.earnGhsPerPoint}
              onChange={(e) => setSettings((s) => ({ ...s, earnGhsPerPoint: Number(e.target.value) }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Points needed for a reward
            <input
              type="number"
              min={1}
              value={settings.redeemPoints}
              onChange={(e) => setSettings((s) => ({ ...s, redeemPoints: Number(e.target.value) }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Reward value (GHS)
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={settings.redeemValueGhs}
              onChange={(e) => setSettings((s) => ({ ...s, redeemValueGhs: Number(e.target.value) }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Minimum points to redeem
            <input
              type="number"
              min={1}
              value={settings.minRedeemPoints}
              onChange={(e) => setSettings((s) => ({ ...s, minRedeemPoints: Number(e.target.value) }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Current rule: 1 point per GH₵ {settings.earnGhsPerPoint} spent. {settings.redeemPoints} points = GH₵ {settings.redeemValueGhs} off.
        </p>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="mt-4 bg-brand-espresso hover:bg-brand-cocoa text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          Save rules
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Customer balances</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or name"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500">No loyalty balances yet. Points appear after a paid order, including guest checkout, using the customer email.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Customer</th>
                    <th className="py-2">Points</th>
                    <th className="py-2">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.email}
                      onClick={() => {
                        setSelectedEmail(row.email);
                        void load(row.email);
                      }}
                      className={`border-b cursor-pointer ${selectedEmail === row.email ? 'bg-brand-nude/40' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-3">
                        <div className="font-semibold text-gray-900">{row.full_name || (row.user_id ? 'Customer' : 'Guest')}</div>
                        <div className="text-gray-500">{row.email}</div>
                      </td>
                      <td className="py-3 font-semibold">{row.points}</td>
                      <td className="py-3">{row.lifetime_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Adjust points</h2>
          {!selectedEmail ? (
            <p className="text-sm text-gray-500">Select a customer to view history and add or remove points.</p>
          ) : (
            <>
              <input
                type="number"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
              />
              <input
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3"
              />
              <button
                onClick={applyAdjustment}
                disabled={saving}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
              >
                Apply adjustment
              </button>
              <h3 className="font-semibold text-gray-900 mt-6 mb-2">Recent activity</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {ledger.map((row) => (
                  <div key={row.id} className="text-sm border-b border-gray-100 pb-2">
                    <div className="flex justify-between">
                      <span className="capitalize font-medium">{row.entry_type}</span>
                      <span className={row.points >= 0 ? 'text-green-700' : 'text-red-700'}>
                        {row.points > 0 ? '+' : ''}
                        {row.points}
                      </span>
                    </div>
                    <p className="text-gray-500">{row.note}</p>
                    <p className="text-xs text-gray-400">{new Date(row.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
