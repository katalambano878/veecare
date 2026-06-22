'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

interface CouponRow {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  status: string;
}

interface SaleState {
  active: boolean;
  percent: number | null;
  appliedAt: string | null;
}

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'percentage' as CouponType,
  value: 10,
  minPurchase: 0,
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

const PRESET_SALE_PERCENTAGES = [5, 10, 15, 20, 25, 30];

function deriveStatus(c: { isActive: boolean; endDate: string | null; startDate: string | null }): string {
  if (!c.isActive) return 'Disabled';
  const now = new Date();
  if (c.endDate && new Date(c.endDate) < now) return 'Expired';
  if (c.startDate && new Date(c.startDate) > now) return 'Scheduled';
  return 'Active';
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [sale, setSale] = useState<SaleState>({ active: false, percent: null, appliedAt: null });
  const [customSalePercent, setCustomSalePercent] = useState('');
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleMessage, setSaleMessage] = useState('');

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCoupons(
        (data || []).map((c: Record<string, unknown>) => ({
          id: String(c.id),
          code: String(c.code),
          description: String(c.description || ''),
          type: (c.type as CouponType) || 'percentage',
          value: Number(c.value ?? 0),
          minPurchase: Number(c.minimum_purchase ?? 0),
          maxDiscount: c.maximum_discount != null ? Number(c.maximum_discount) : null,
          usageLimit: c.usage_limit != null ? Number(c.usage_limit) : null,
          usedCount: Number(c.usage_count ?? 0),
          startDate: c.start_date ? String(c.start_date) : null,
          endDate: c.end_date ? String(c.end_date) : null,
          isActive: c.is_active !== false,
          status: deriveStatus({
            isActive: c.is_active !== false,
            endDate: c.end_date ? String(c.end_date) : null,
            startDate: c.start_date ? String(c.start_date) : null,
          }),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSale = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sales/bulk-discount');
      if (res.ok) {
        const data = await res.json();
        setSale({
          active: data.active === true,
          percent: data.percent ?? null,
          appliedAt: data.appliedAt ?? null,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchSale();
  }, [fetchCoupons, fetchSale]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (coupon: CouponRow) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : '',
      isActive: coupon.isActive,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    const code = form.code.trim().toUpperCase();
    if (!code) {
      setFormError('Coupon code is required.');
      return;
    }
    if (form.value <= 0 && form.type !== 'free_shipping') {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code,
        description: form.description.trim() || null,
        type: form.type,
        value: form.type === 'free_shipping' ? 0 : Number(form.value),
        minimum_purchase: Number(form.minPurchase) || 0,
        maximum_discount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usage_limit: form.usageLimit ? Number(form.usageLimit) : null,
        start_date: form.startDate ? new Date(form.startDate).toISOString() : null,
        end_date: form.endDate ? new Date(form.endDate).toISOString() : null,
        is_active: form.isActive,
      };

      if (editingId) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
      }

      setShowModal(false);
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save coupon';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchCoupons();
  };

  const applyStoreSale = async (percent: number) => {
    setSaleLoading(true);
    setSaleMessage('');
    try {
      const res = await fetch('/api/admin/sales/bulk-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', percent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to apply sale');
      setSaleMessage(
        `Applied ${percent}% off to ${data.products_updated ?? 0} products and ${data.variants_updated ?? 0} variants.`
      );
      fetchSale();
    } catch (err: unknown) {
      setSaleMessage(err instanceof Error ? err.message : 'Failed to apply sale');
    } finally {
      setSaleLoading(false);
    }
  };

  const clearStoreSale = async () => {
    if (!confirm('End the store-wide sale and restore original prices on all products?')) return;
    setSaleLoading(true);
    setSaleMessage('');
    try {
      const res = await fetch('/api/admin/sales/bulk-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to end sale');
      setSaleMessage(
        `Sale ended. Restored ${data.products_restored ?? 0} products and ${data.variants_restored ?? 0} variants.`
      );
      fetchSale();
    } catch (err: unknown) {
      setSaleMessage(err instanceof Error ? err.message : 'Failed to end sale');
    } finally {
      setSaleLoading(false);
    }
  };

  const handleCustomSale = () => {
    const pct = Number(customSalePercent);
    if (!pct || pct <= 0 || pct >= 100) {
      setSaleMessage('Enter a valid percentage between 1 and 99.');
      return;
    }
    if (!confirm(`Apply ${pct}% discount to ALL products?`)) return;
    applyStoreSale(pct);
  };

  const activeCoupons = coupons.filter((c) => c.status === 'Active');
  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  const statusColors: Record<string, string> = {
    Active: 'bg-brand-nude/50 text-brand-espresso',
    Scheduled: 'bg-amber-100 text-amber-800',
    Expired: 'bg-gray-100 text-gray-700',
    Disabled: 'bg-red-100 text-red-700',
  };

  const formatType = (type: CouponType) => {
    if (type === 'fixed_amount') return 'Fixed Amount';
    if (type === 'free_shipping') return 'Free Shipping';
    return 'Percentage';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons & Promotions</h1>
          <p className="text-gray-600 mt-1">Store-wide sales and loyalty discount codes</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-brand-espresso hover:bg-brand-cocoa text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line mr-2"></i>
          Create Coupon
        </button>
      </div>

      {/* Store-wide sale */}
      <div className="bg-white rounded-xl border-2 border-brand-nude/70 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <i className="ri-percent-line text-brand-espresso"></i>
              Store-Wide Sale
            </h2>
            <p className="text-gray-600 mt-1 text-sm">
              Apply one discount to every product at once. Original prices are saved so you can end the sale anytime.
            </p>
            {sale.active && sale.percent != null && (
              <p className="mt-2 text-sm font-semibold text-brand-espresso">
                Active: {sale.percent}% off all products
                {sale.appliedAt && (
                  <span className="text-gray-500 font-normal ml-2">
                    since {new Date(sale.appliedAt).toLocaleString()}
                  </span>
                )}
              </p>
            )}
          </div>
          {sale.active && (
            <button
              onClick={clearStoreSale}
              disabled={saleLoading}
              className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50 whitespace-nowrap"
            >
              End Sale & Restore Prices
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_SALE_PERCENTAGES.map((pct) => (
            <button
              key={pct}
              onClick={() => {
                if (confirm(`Apply ${pct}% off to ALL products?`)) applyStoreSale(pct);
              }}
              disabled={saleLoading}
              className="px-4 py-2 bg-brand-espresso hover:bg-brand-cocoa text-white rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {pct}% Off All
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Custom percentage</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={customSalePercent}
                onChange={(e) => setCustomSalePercent(e.target.value)}
                placeholder="e.g. 12"
                className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
              />
              <span className="text-gray-600 font-medium">%</span>
            </div>
          </div>
          <button
            onClick={handleCustomSale}
            disabled={saleLoading}
            className="px-5 py-2 bg-gray-900 hover:bg-brand-cocoa text-white rounded-lg font-semibold disabled:opacity-50"
          >
            Apply Custom Sale
          </button>
        </div>

        {saleMessage && (
          <p className={`mt-4 text-sm ${saleMessage.includes('Failed') || saleMessage.includes('valid') ? 'text-red-600' : 'text-brand-espresso'}`}>
            {saleMessage}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Coupons</p>
          <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-brand-espresso">{activeCoupons.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Uses</p>
          <p className="text-2xl font-bold text-gray-900">{totalUses}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Store Sale</p>
          <p className="text-2xl font-bold text-purple-700">
            {sale.active && sale.percent != null ? `${sale.percent}%` : 'Off'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Discount Codes (for loyal customers)</h2>
          <p className="text-sm text-gray-500 mt-1">Create codes and share privately — customers enter them at cart or checkout.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Code</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Value</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Min Purchase</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Usage</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Valid Period</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading coupons...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-500">No coupons yet. Create one for your loyal customers.</td></tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">{coupon.code}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{formatType(coupon.type)}</td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {coupon.type === 'percentage'
                        ? `${coupon.value}%`
                        : coupon.type === 'fixed_amount'
                          ? `GH₵ ${coupon.value}`
                          : '—'}
                    </td>
                    <td className="py-4 px-4 text-gray-700 whitespace-nowrap">
                      {coupon.minPurchase > 0 ? `GH₵ ${coupon.minPurchase.toFixed(2)}` : 'No minimum'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 font-semibold">{coupon.usedCount}</span>
                      <span className="text-gray-500"> / {coupon.usageLimit ?? '∞'}</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'Anytime'}
                      <br />
                      <span className="text-gray-500">{coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'No expiry'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColors[coupon.status] || 'bg-gray-100'}`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-brand-mauve hover:bg-brand-nude/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
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
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>

            {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="LOYAL10"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="10% off for loyal customers"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed amount (GH₵)</option>
                    <option value="free_shipping">Free shipping</option>
                  </select>
                </div>
                {form.type !== 'free_shipping' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">Value</label>
                    <input
                      type="number"
                      min={0}
                      step={form.type === 'percentage' ? 1 : 0.01}
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Min purchase (GH₵)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minPurchase}
                    onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                  />
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">Max discount (GH₵)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Usage limit</label>
                <input
                  type="number"
                  min={1}
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">End date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-brand-espresso text-white rounded-lg font-semibold hover:bg-brand-cocoa disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
