'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHero from '@/components/PageHero';
import RefundPolicySection from '@/components/RefundPolicySection';
import { usePageTitle } from '@/hooks/usePageTitle';
import { REFUND_POLICY } from '@/lib/brand';

const mockOrders = [
  {
    id: 'ORD-2024-156',
    date: '2024-01-20',
    items: [
      {
        id: 1,
        name: 'Premium Leather Crossbody Bag',
        price: 289,
        image:
          'https://readdy.ai/api/search-image?query=elegant%20premium%20leather%20crossbody%20bag&width=400&height=400&seq=return1&orientation=squarish',
        returnable: true,
      },
      {
        id: 2,
        name: 'Minimalist Ceramic Vase Set',
        price: 159,
        image:
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20ceramic%20vase%20set&width=400&height=400&seq=return2&orientation=squarish',
        returnable: true,
      },
    ],
  },
];

export default function ReturnsPage() {
  usePageTitle('Returns & Refunds');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [returnReasons, setReturnReasons] = useState<Record<number, string>>({});
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund');
  const [isLoading, setIsLoading] = useState(false);
  const [foundOrder, setFoundOrder] = useState<(typeof mockOrders)[0] | null>(null);

  const reasons = [...REFUND_POLICY.refundReasons, 'Other (describe in notes to support)'];

  const handleFindOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setFoundOrder(mockOrders[0]);
      setIsLoading(false);
      setStep(2);
    }, 1000);
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmitReturn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/returns/confirmation');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title="Returns & Refunds"
        subtitle="Read our refund policy below, then start a return or exchange request with your order details."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-14">
        <RefundPolicySection />

        <div id="returns-portal">
          <div className="text-center mb-8">
            <span className="brand-eyebrow mb-3 block">Start a request</span>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-brand-espresso tracking-tight">
              Returns portal
            </h2>
            <p className="brand-body mt-3 max-w-lg mx-auto">
              Enter your order number and email to begin. Exchanges must meet the 24 hour window in our policy above.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm ${
                      i <= step ? 'bg-brand-espresso text-brand-cream' : 'bg-brand-nude text-brand-cocoa/50'
                    }`}
                  >
                    {i < step ? <i className="ri-check-line" /> : i}
                  </div>
                  {i < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 sm:mx-4 ${i < step ? 'bg-brand-espresso' : 'bg-brand-nude'}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs sm:text-sm font-medium text-brand-cocoa/80">
              <span>Find order</span>
              <span>Select items</span>
              <span>Submit</span>
            </div>
          </div>

          {step === 1 && (
            <div className="bg-white rounded-2xl border border-brand-nude shadow-soft p-6 sm:p-8">
              <h3 className="text-xl font-display font-semibold text-brand-espresso mb-6">Find your order</h3>
              <form onSubmit={handleFindOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-brand-espresso mb-2">Order number *</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-brand-nude rounded-xl bg-brand-cream text-brand-cocoa focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-mauve"
                    placeholder="ORD-2024-156"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-espresso mb-2">Email address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-brand-nude rounded-xl bg-brand-cream text-brand-cocoa focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-mauve"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-luxury-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Finding order…' : 'Find order'}
                </button>
              </form>

              <p className="brand-body text-sm mt-6 text-brand-cocoa/80">
                Prefer to talk first?{' '}
                <Link href="/contact" className="font-semibold text-brand-espresso hover:text-brand-mauve">
                  Contact us
                </Link>{' '}
                with your order number before sending anything back.
              </p>
            </div>
          )}

          {step === 2 && foundOrder && (
            <div className="bg-white rounded-2xl border border-brand-nude shadow-soft p-6 sm:p-8">
              <h3 className="text-xl font-display font-semibold text-brand-espresso mb-6">Select items to return</h3>

              <div className="mb-6 p-4 bg-brand-nude/30 rounded-xl border border-brand-nude">
                <p className="text-sm font-medium text-brand-cocoa/80">
                  Order #{foundOrder.id} · Placed on {foundOrder.date}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {foundOrder.items.map((item) => (
                  <div key={item.id} className="border border-brand-nude rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-1 w-5 h-5 text-brand-espresso rounded border-brand-nude focus:ring-brand-mauve/40"
                      />
                      <div className="w-20 h-20 shrink-0 bg-brand-nude/40 rounded-lg overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-espresso mb-1">{item.name}</p>
                        <p className="text-lg font-semibold text-brand-espresso mb-3">
                          GH₵{item.price.toFixed(2)}
                        </p>
                        {selectedItems.includes(item.id) && (
                          <div className="mt-2">
                            <label className="block text-sm font-semibold text-brand-espresso mb-2">
                              Reason *
                            </label>
                            <select
                              value={returnReasons[item.id] || ''}
                              onChange={(e) =>
                                setReturnReasons({ ...returnReasons, [item.id]: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-brand-nude rounded-xl bg-brand-cream focus:ring-2 focus:ring-brand-mauve/40"
                              required
                            >
                              <option value="">Select a reason</option>
                              {reasons.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-brand-espresso mb-3">What would you like? *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setReturnType('refund')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      returnType === 'refund'
                        ? 'border-brand-espresso bg-brand-nude/40'
                        : 'border-brand-nude hover:border-brand-mauve/40'
                    }`}
                  >
                    <i className="ri-refund-line text-2xl text-brand-espresso mb-2" />
                    <p className="font-semibold text-brand-espresso">Refund</p>
                    <p className="text-sm text-brand-cocoa/75 mt-1 font-medium">When policy conditions apply</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('exchange')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      returnType === 'exchange'
                        ? 'border-brand-espresso bg-brand-nude/40'
                        : 'border-brand-nude hover:border-brand-mauve/40'
                    }`}
                  >
                    <i className="ri-exchange-line text-2xl text-brand-espresso mb-2" />
                    <p className="font-semibold text-brand-espresso">Exchange</p>
                    <p className="text-sm text-brand-cocoa/75 mt-1 font-medium">Within 24 hours of purchase</p>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border-2 border-brand-nude text-brand-espresso rounded-xl font-semibold hover:bg-brand-nude/30 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={
                    selectedItems.length === 0 || !selectedItems.every((id) => returnReasons[id])
                  }
                  className="flex-1 py-4 btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && foundOrder && (
            <div className="bg-white rounded-2xl border border-brand-nude shadow-soft p-6 sm:p-8">
              <h3 className="text-xl font-display font-semibold text-brand-espresso mb-6">Review & submit</h3>

              <div className="mb-8">
                <h4 className="font-semibold text-brand-espresso mb-4">Return summary</h4>
                <div className="space-y-3">
                  {foundOrder.items
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-brand-nude/25 rounded-xl border border-brand-nude/60"
                      >
                        <div>
                          <p className="font-semibold text-brand-espresso">{item.name}</p>
                          <p className="text-sm text-brand-cocoa/75 font-medium">
                            {returnType === 'exchange' ? 'Exchange' : 'Refund'} · {returnReasons[item.id]}
                          </p>
                        </div>
                        <p className="font-semibold text-brand-espresso">GH₵{item.price.toFixed(2)}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mb-8 p-6 border border-brand-mauve/25 bg-brand-mauve/10 rounded-xl">
                <h4 className="font-semibold text-brand-espresso mb-4">Next steps</h4>
                <ol className="space-y-2 brand-body text-sm">
                  <li>
                    <span className="font-semibold text-brand-espresso">1.</span> Our team will confirm your request
                    matches the refund policy.
                  </li>
                  <li>
                    <span className="font-semibold text-brand-espresso">2.</span> Pack items unworn, with tags and
                    original packaging.
                  </li>
                  <li>
                    <span className="font-semibold text-brand-espresso">3.</span> Bring to store or follow instructions
                    we send by WhatsApp or email.
                  </li>
                  <li>
                    <span className="font-semibold text-brand-espresso">4.</span> Exchanges must be within 24 hours of
                    purchase.
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 border-2 border-brand-nude text-brand-espresso rounded-xl font-semibold hover:bg-brand-nude/30 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={isLoading}
                  className="flex-1 py-4 btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Submitting…' : 'Submit return request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
