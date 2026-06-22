'use client';

import { useState } from 'react';
import type { StoredAppliedCoupon } from '@/lib/coupons';

interface AdvancedCouponSystemProps {
  subtotal: number;
  shippingCost?: number;
  onApply: (coupon: StoredAppliedCoupon) => void;
  onRemove: () => void;
  appliedCoupon: StoredAppliedCoupon | null;
}

export default function AdvancedCouponSystem({
  subtotal,
  shippingCost = 0,
  onApply,
  onRemove,
  appliedCoupon,
}: AdvancedCouponSystemProps) {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setError('');
    const code = couponCode.trim();
    if (!code) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, shippingCost }),
      });
      const data = await res.json();

      if (!data.valid || !data.coupon) {
        setError(data.reason || 'Invalid coupon code');
        return;
      }

      onApply({
        ...data.coupon,
        discountAmount: data.discountAmount ?? 0,
      });
      setCouponCode('');
    } catch {
      setError('Could not validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDiscountLabel = (coupon: StoredAppliedCoupon) => {
    if (coupon.type === 'fixed_amount') return `GH₵${coupon.value} off`;
    if (coupon.type === 'free_shipping') return 'Free shipping';
    return `${coupon.value}% off`;
  };

  return (
    <div className="space-y-4">
      {!appliedCoupon ? (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Have a coupon code?
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="Enter code"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso text-sm"
            />
            <button
              onClick={handleApply}
              disabled={loading}
              className="bg-gray-900 hover:bg-brand-cocoa text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {loading ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2 flex items-center">
              <i className="ri-error-warning-line mr-1"></i>
              {error}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Enter the code your admin gave you (e.g. LOYAL10).
          </p>
        </div>
      ) : (
        <div className="bg-brand-nude/30 border-2 border-brand-nude/70 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <i className="ri-price-tag-3-fill text-brand-espresso"></i>
                <span className="font-bold text-brand-cocoa">{appliedCoupon.code}</span>
                <span className="text-xs bg-brand-espresso/10 text-brand-espresso px-2 py-0.5 rounded">
                  {formatDiscountLabel(appliedCoupon)}
                </span>
              </div>
              {appliedCoupon.description && (
                <p className="text-sm text-brand-espresso">{appliedCoupon.description}</p>
              )}
              <p className="text-sm font-semibold text-brand-mauve mt-1">
                Saving GH₵{appliedCoupon.discountAmount.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onRemove}
              className="w-8 h-8 flex items-center justify-center text-brand-espresso hover:text-brand-cocoa transition-colors"
              aria-label="Remove coupon"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
