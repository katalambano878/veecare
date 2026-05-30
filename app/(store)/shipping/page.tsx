import Link from 'next/link';
import {
  DELIVERY_DAYS,
  DELIVERY_DAYS_DISPLAY,
  NO_PICKUP_NOTICE,
  WHATSAPP_LINK,
} from '@/lib/brand';

export default function ShippingPage() {
  const steps = [
    {
      title: 'Place your order',
      body: 'Shop online and checkout with your delivery address. We confirm your order and delivery cost via WhatsApp or phone.',
    },
    {
      title: 'We prepare your package',
      body: 'Orders are packed discreetly before the next available delivery day.',
    },
    {
      title: 'Delivery day',
      body: `Your order goes out on ${DELIVERY_DAYS_DISPLAY}. Our team or courier will contact you before arrival.`,
    },
    {
      title: 'Receive with care',
      body: 'Please ensure your phone and address details are correct, and someone is available to receive the package.',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-ivory">
      <div className="bg-gradient-to-br from-brand-blush/40 via-brand-ivory to-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-display text-brand-cocoa mb-6">Shipping & Delivery</h1>
          <p className="text-lg text-brand-cocoa/75 leading-relaxed">
            {NO_PICKUP_NOTICE}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="rounded-3xl border-2 border-brand-berry/30 bg-white p-8 sm:p-10 text-center shadow-wellness">
          <span className="brand-eyebrow mb-3 inline-block">Delivery schedule</span>
          <h2 className="text-2xl sm:text-3xl font-display text-brand-cocoa mb-6">Our delivery days</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {DELIVERY_DAYS.map((day) => (
              <span
                key={day}
                className="inline-flex items-center px-6 py-3 rounded-full bg-brand-blush/60 text-brand-berry font-semibold text-lg border border-brand-rose/30"
              >
                {day}
              </span>
            ))}
          </div>
          <p className="brand-body text-brand-cocoa/80 max-w-xl mx-auto">
            Orders are scheduled for the next available delivery day after payment is confirmed. Delivery cost depends on your location and is shared with you before dispatch.
          </p>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-display text-brand-cocoa mb-8 text-center">How it works</h2>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-5 p-6 rounded-2xl bg-white border border-brand-blush">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-berry text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-display text-xl text-brand-cocoa mb-2">{step.title}</h3>
                  <p className="brand-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-brand-blush/30 border border-brand-blush p-8">
          <h2 className="text-xl font-display text-brand-cocoa mb-4">Important to know</h2>
          <ul className="space-y-3 brand-body text-brand-cocoa/85">
            <li className="flex gap-2">
              <i className="ri-store-2-line text-brand-berry mt-0.5" aria-hidden />
              <span>No walk-in shop and no order pickups — online delivery only.</span>
            </li>
            <li className="flex gap-2">
              <i className="ri-calendar-line text-brand-berry mt-0.5" aria-hidden />
              <span>Deliveries run on {DELIVERY_DAYS_DISPLAY} only.</span>
            </li>
            <li className="flex gap-2">
              <i className="ri-map-pin-line text-brand-berry mt-0.5" aria-hidden />
              <span>Provide a correct address and reachable phone number.</span>
            </li>
            <li className="flex gap-2">
              <i className="ri-shield-check-line text-brand-berry mt-0.5" aria-hidden />
              <span>Packages are packed discreetly for your privacy.</span>
            </li>
          </ul>
        </div>

        <div className="text-center pt-4">
          <Link
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-wellness-primary mr-3"
          >
            <i className="ri-whatsapp-line" aria-hidden />
            Ask about delivery
          </Link>
          <Link href="/order-tracking" className="inline-flex items-center gap-2 btn-wellness-secondary mt-3 sm:mt-0">
            Track your order
          </Link>
        </div>
      </div>
    </div>
  );
}
