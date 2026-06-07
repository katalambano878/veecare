'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getInitiateEndpoint, PAYMENT_ENDPOINTS, resolvePaymentProvider, type PaymentProvider } from '@/lib/payments/providers';

type PaymentMethodOption = {
  id: PaymentProvider;
  label: string;
  description: string;
  icon: string;
};

export default function PaymentPage() {
  usePageTitle('Complete Payment');
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>('moolre');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  useEffect(() => {
    async function loadMethods() {
      try {
        const res = await fetch('/api/payment/methods');
        const data = await res.json();
        setPaymentMethods(data.methods || []);
      } catch {
        /* ignore */
      }
    }
    loadMethods();
  }, []);

  useEffect(() => {
    async function fetchOrder() {
      try {
        // Fetch order by ID (UUID) or order_number
        let query = supabase
          .from('orders')
          .select('*')
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .single();

        const { data, error: fetchError } = await query;

        if (fetchError || !data) {
          setError('Order not found. Please check your link and try again.');
          setLoading(false);
          return;
        }

        setOrder(data);
        const provider = resolvePaymentProvider(data.payment_method, data.metadata);
        setPaymentMethod(provider);

        // If already paid, redirect to success page
        if (data.payment_status === 'paid') {
          router.push(`/order-success?order=${data.order_number}`);
          return;
        }

      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  const handlePayNow = async () => {
    if (!order) return;

    setProcessing(true);
    setError(null);

    try {
      const provider = resolvePaymentProvider(order.payment_method, order.metadata);
      const paymentRes = await fetch(getInitiateEndpoint(provider), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.order_number,
          customerEmail: order.email
        })
      });

      const paymentResult = await paymentRes.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment initialization failed');
      }

      // Redirect to Moolre payment page
      window.location.href = paymentResult.url;

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-nude/70 border-t-brand-espresso rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <i className="ri-error-warning-line text-4xl text-red-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-brand-espresso hover:bg-brand-cocoa text-white rounded-lg font-semibold transition-colors"
          >
            <i className="ri-home-line mr-2"></i>
            Go to Homepage
          </Link>
        </div>
      </main>
    );
  }

  const shippingAddress = order?.shipping_address || {};
  const customerName = order?.metadata?.first_name || shippingAddress.firstName || 'Customer';

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-['Pacifico'] text-brand-espresso">YOUR_APP_TITLE</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Hi {customerName}, your order is waiting for payment.</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">Order Number</span>
            <span className="font-semibold text-gray-900">{order?.order_number}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">GH₵ {order?.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">GH₵ {order?.shipping_total?.toFixed(2)}</span>
            </div>
            {order?.discount_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-GH₵ {order?.discount_total?.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-brand-espresso">GH₵ {order?.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Status */}
        {order?.payment_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <i className="ri-time-line text-xl text-yellow-600 mt-0.5"></i>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Payment Pending</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete your payment to confirm your order.
                </p>
              </div>
            </div>
          </div>
        )}

        {order?.payment_status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <i className="ri-error-warning-line text-xl text-red-600 mt-0.5"></i>
              <div>
                <p className="text-sm font-semibold text-red-800">Payment Failed</p>
                <p className="text-sm text-red-700 mt-1">
                  Your previous payment attempt was unsuccessful. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {paymentMethods.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Choose payment method</p>
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer ${
                  paymentMethod === method.id ? 'border-brand-espresso bg-brand-nude/30' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="retry-payment"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="w-4 h-4 text-brand-espresso"
                />
                <i className={`${method.icon} text-brand-espresso text-lg`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayNow}
          disabled={processing || paymentMethods.length === 0}
          className="w-full bg-brand-espresso hover:bg-brand-cocoa text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer"
        >
          {processing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <i className="ri-secure-payment-line mr-2"></i>
              Pay GH₵ {order?.total?.toFixed(2)} with {PAYMENT_ENDPOINTS[paymentMethod]?.label || 'secure checkout'}
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <i className="ri-lock-line mr-1"></i>
            Secure payment powered by {PAYMENT_ENDPOINTS[paymentMethod]?.label || 'our payment partner'}
          </p>
        </div>

        {/* Help Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Having issues? <Link href="/contact" className="text-brand-espresso hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
