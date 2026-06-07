'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { buildAffiliateLink, normalizeAffiliateCode, DEFAULT_COMMISSION_RATE } from '@/lib/affiliate';

type Affiliate = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  commission_rate: number;
  status: 'active' | 'pending' | 'suspended';
  notes: string | null;
  total_orders: number;
  total_earned: number;
  total_paid: number;
  created_at: string;
};

type Commission = {
  id: string;
  affiliate_id: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  commission_rate: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paid_at: string | null;
  created_at: string;
  affiliates?: { name: string; code: string };
};

const emptyForm = {
  code: '',
  name: '',
  email: '',
  phone: '',
  commission_rate: DEFAULT_COMMISSION_RATE,
  status: 'active' as Affiliate['status'],
  notes: '',
};

const statusColors: Record<string, string> = {
  active: 'bg-brand-nude/50 text-brand-espresso',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

const commissionStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-brand-nude/50 text-brand-espresso',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionLoading, setCommissionLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [commissionFilter, setCommissionFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAffiliates();
    fetchCommissions();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates((data || []) as Affiliate[]);
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      setCommissionLoading(true);
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*, affiliates(name, code)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCommissions((data || []) as Commission[]);
    } catch (err) {
      console.error('Error fetching commissions:', err);
    } finally {
      setCommissionLoading(false);
    }
  };

  const openCreate = () => {
    setEditingAffiliate(null);
    setForm(emptyForm);
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setForm({
      code: affiliate.code,
      name: affiliate.name,
      email: affiliate.email,
      phone: affiliate.phone || '',
      commission_rate: Number(affiliate.commission_rate),
      status: affiliate.status,
      notes: affiliate.notes || '',
    });
    setMessage('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const code = normalizeAffiliateCode(form.code);
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();

    if (!code || !name || !email) {
      setMessage('Code, name, and email are required.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        code,
        name,
        email,
        phone: form.phone.trim() || null,
        commission_rate: Number(form.commission_rate) || DEFAULT_COMMISSION_RATE,
        status: form.status,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingAffiliate) {
        const { error } = await supabase
          .from('affiliates')
          .update(payload)
          .eq('id', editingAffiliate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('affiliates').insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      await fetchAffiliates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save affiliate';
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateCommissionStatus = async (
    commission: Commission,
    newStatus: Commission['status']
  ) => {
    try {
      const wasPaid = commission.status === 'paid';
      const willBePaid = newStatus === 'paid';

      const updates = {
        status: newStatus,
        paid_at: willBePaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('affiliate_commissions')
        .update(updates)
        .eq('id', commission.id);

      if (error) throw error;

      const affiliate = affiliates.find((a) => a.id === commission.affiliate_id);
      if (affiliate) {
        const amount = Number(commission.commission_amount);
        const affiliateUpdates: Record<string, string | number> = {
          updated_at: new Date().toISOString(),
        };

        if (!wasPaid && willBePaid) {
          affiliateUpdates.total_paid = Number(affiliate.total_paid) + amount;
        } else if (wasPaid && !willBePaid) {
          affiliateUpdates.total_paid = Math.max(0, Number(affiliate.total_paid) - amount);
        }

        if (newStatus === 'cancelled' && commission.status !== 'cancelled') {
          affiliateUpdates.total_earned = Math.max(0, Number(affiliate.total_earned) - amount);
          affiliateUpdates.total_orders = Math.max(0, Number(affiliate.total_orders) - 1);
          if (wasPaid) {
            affiliateUpdates.total_paid = Math.max(0, Number(affiliate.total_paid) - amount);
          }
        }

        if (Object.keys(affiliateUpdates).length > 1) {
          await supabase.from('affiliates').update(affiliateUpdates).eq('id', affiliate.id);
        }
      }

      await Promise.all([fetchAffiliates(), fetchCommissions()]);
    } catch (err) {
      console.error('Commission update failed:', err);
      alert('Failed to update commission status.');
    }
  };

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(buildAffiliateLink(code));
      alert('Referral link copied!');
    } catch {
      alert(buildAffiliateLink(code));
    }
  };

  const filteredAffiliates = affiliates.filter(
    (a) => statusFilter === 'all' || a.status === statusFilter
  );

  const filteredCommissions = commissions.filter(
    (c) => commissionFilter === 'all' || c.status === commissionFilter
  );

  const totalPending = affiliates.reduce(
    (sum, a) => sum + (Number(a.total_earned) - Number(a.total_paid)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliates</h1>
          <p className="text-gray-600 mt-1">Manage partners, commissions, and payouts</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-espresso hover:bg-brand-cocoa text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line mr-2"></i>
          Add Affiliate
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Affiliates</p>
          <p className="text-2xl font-bold text-gray-900">{affiliates.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-brand-espresso">
            {affiliates.filter((a) => a.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900">
            GH₵{affiliates.reduce((s, a) => s + Number(a.total_earned), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Pending Payout</p>
          <p className="text-2xl font-bold text-amber-700">GH₵{totalPending.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">All Affiliates</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Partner</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Code</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Rate</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Orders</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Earned</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Paid</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Balance</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    Loading affiliates...
                  </td>
                </tr>
              ) : filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No affiliates yet. Add your first partner to get started.
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((affiliate) => {
                  const balance = Number(affiliate.total_earned) - Number(affiliate.total_paid);
                  return (
                    <tr key={affiliate.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-900">{affiliate.name}</p>
                        <p className="text-sm text-gray-500">{affiliate.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold bg-gray-100 px-3 py-1 rounded">
                          {affiliate.code}
                        </span>
                      </td>
                      <td className="py-4 px-4">{Number(affiliate.commission_rate)}%</td>
                      <td className="py-4 px-4">{affiliate.total_orders}</td>
                      <td className="py-4 px-4">GH₵{Number(affiliate.total_earned).toFixed(2)}</td>
                      <td className="py-4 px-4">GH₵{Number(affiliate.total_paid).toFixed(2)}</td>
                      <td className="py-4 px-4 font-semibold text-amber-700">
                        GH₵{balance.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[affiliate.status]}`}
                        >
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyLink(affiliate.code)}
                            title="Copy referral link"
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brand-mauve hover:bg-brand-nude/30 rounded-lg cursor-pointer"
                          >
                            <i className="ri-link text-lg"></i>
                          </button>
                          <button
                            onClick={() => openEdit(affiliate)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brand-mauve hover:bg-brand-nude/30 rounded-lg cursor-pointer"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Commissions</h2>
          <select
            value={commissionFilter}
            onChange={(e) => setCommissionFilter(e.target.value)}
            className="px-4 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Order</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Affiliate</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Order Total</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Commission</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissionLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Loading commissions...
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No commissions yet. They appear when referred orders are paid.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-mono text-sm">{commission.order_number}</td>
                    <td className="py-4 px-4">
                      <p className="font-medium">{commission.affiliates?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{commission.affiliates?.code}</p>
                    </td>
                    <td className="py-4 px-4">GH₵{Number(commission.order_total).toFixed(2)}</td>
                    <td className="py-4 px-4 font-semibold">
                      GH₵{Number(commission.commission_amount).toFixed(2)}
                      <span className="text-xs text-gray-500 ml-1">
                        ({Number(commission.commission_rate)}%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${commissionStatusColors[commission.status]}`}
                      >
                        {commission.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => updateCommissionStatus(commission, 'approved')}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {(commission.status === 'pending' || commission.status === 'approved') && (
                          <button
                            onClick={() => updateCommissionStatus(commission, 'paid')}
                            className="text-xs px-2 py-1 bg-brand-nude/50 text-brand-espresso rounded hover:bg-brand-nude cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        {commission.status !== 'cancelled' && commission.status !== 'paid' && (
                          <button
                            onClick={() => updateCommissionStatus(commission, 'cancelled')}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingAffiliate ? 'Edit Affiliate' : 'Add Affiliate'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="JANE10"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link: {form.code ? buildAffiliateLink(form.code) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.commission_rate}
                    onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as Affiliate['status'] })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                />
              </div>
            </div>

            {message && <p className="text-red-600 text-sm mt-4">{message}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-brand-espresso text-white rounded-lg hover:bg-brand-cocoa disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : editingAffiliate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
