'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AffiliateProfilePage() {
  usePageTitle('Affiliate profile');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    payout_method: 'momo',
    payout_network: '',
    payout_account: '',
    code: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/affiliate/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.affiliate) return;
        setForm({
          name: data.affiliate.name || '',
          email: data.affiliate.email || '',
          phone: data.affiliate.phone || '',
          payout_method: data.affiliate.payout_method || 'momo',
          payout_network: data.affiliate.payout_network || '',
          payout_account: data.affiliate.payout_account || '',
          code: data.affiliate.code || '',
        });
      })
      .catch(() => undefined);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/affiliate/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMessage(res.ok ? 'Profile saved.' : data.error || 'Could not save');
  };

  return (
    <PortalShell>
      <form onSubmit={save} className="bg-white rounded-xl border border-brand-nude/60 p-4 space-y-3 max-w-lg">
        <p className="text-sm text-brand-cocoa/70">Public code: <strong>{form.code}</strong> (not a password)</p>
        <label className="block text-sm">
          Name
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Email (sign-in)
          <input className="mt-1 w-full border rounded-lg px-3 py-2 bg-brand-cream" value={form.email} disabled />
        </label>
        <label className="block text-sm">
          Phone
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          Payout method
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.payout_method}
            onChange={(e) => setForm({ ...form, payout_method: e.target.value })}
          >
            <option value="momo">Mobile money</option>
            <option value="bank">Bank</option>
          </select>
        </label>
        <label className="block text-sm">
          Network / bank
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.payout_network}
            onChange={(e) => setForm({ ...form, payout_network: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          MoMo / account number
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={form.payout_account}
            onChange={(e) => setForm({ ...form, payout_account: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-luxury-primary w-full py-3">
          Save profile
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>
    </PortalShell>
  );
}
