'use client';

import Link from 'next/link';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function ReturnConfirmationPage() {
  usePageTitle('Return request received');
  const returnId = `RET-${Date.now().toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl border border-brand-nude shadow-soft p-8 text-center">
          <div className="w-20 h-20 flex items-center justify-center bg-brand-nude/50 rounded-full mx-auto mb-6">
            <i className="ri-check-line text-4xl text-brand-espresso" />
          </div>

          <h1 className="text-3xl font-display font-semibold text-brand-espresso mb-4">
            Return request submitted
          </h1>
          <p className="brand-body mb-2">We have received your request and will review it against our refund policy.</p>
          <p className="text-sm font-medium text-brand-cocoa/70 mb-8">
            Return ID: <span className="font-semibold text-brand-espresso">{returnId}</span>
          </p>

          <div className="mb-8 p-6 bg-brand-mauve/10 border border-brand-mauve/25 rounded-xl text-left">
            <h2 className="font-display font-semibold text-brand-espresso mb-4 flex items-center gap-2">
              <i className="ri-mail-line text-2xl text-brand-mauve" />
              What happens next
            </h2>
            <ol className="brand-body text-sm space-y-3 list-decimal list-inside">
              <li>We confirm your request matches our refund or exchange policy.</li>
              <li>You receive instructions by WhatsApp or email.</li>
              <li>Items must be unworn, with tags and original packaging.</li>
              <li>Exchanges must stay within 24 hours of purchase.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link href="/returns#refund-policy" className="block w-full btn-luxury-outline py-4 font-semibold">
              Read refund policy
            </Link>
            <Link href="/contact" className="block w-full btn-luxury-primary py-4 font-semibold">
              Contact us
            </Link>
            <Link
              href="/shop"
              className="block text-brand-espresso hover:text-brand-mauve font-semibold text-sm pt-2"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-brand-nude/40 border border-brand-nude rounded-xl p-6">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-2xl text-brand-espresso shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-brand-espresso mb-2">Please remember</p>
              <ul className="brand-body text-sm space-y-1">
                <li>Refunds apply only for policy eligible reasons.</li>
                <li>Items outside our conditions cannot be returned or exchanged.</li>
                <li>Approved refunds go to your original payment method.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
