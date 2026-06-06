"use client";

import { useState } from 'react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSubmitStatus('success');
      setEmail('');
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mt-4 mb-16 md:mb-24">
      <div className="glass-panel rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-rose/15 rounded-full blur-[70px]" />
          <div className="absolute bottom-0 -left-16 w-56 h-56 bg-brand-lavender/30 rounded-full blur-[50px]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 sm:p-10 md:p-14 gap-8 md:gap-10">
          <div className="text-center lg:text-left max-w-lg">
            <span className="brand-eyebrow mb-4 inline-block">Wellness letters</span>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-display text-brand-cocoa mb-4 leading-tight tracking-tight font-semibold">
              Stay in a <span className="italic text-brand-berry">caring</span> circle
            </h3>
            <p className="brand-body text-left lg:text-left max-w-lg">
              Gentle updates on new arrivals, self-care tips, and moments that remind you to pause —
              never spam, never pressure.
            </p>
          </div>

          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-[1.5rem] bg-white/70 backdrop-blur-md border border-brand-blush shadow-inner"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 bg-transparent border-none text-brand-cocoa placeholder-brand-cocoa/40 px-6 py-3.5 focus:ring-0 text-base min-w-0 rounded-[1.25rem] font-light tracking-wide"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-wellness-primary whitespace-nowrap px-6 py-3.5 text-sm disabled:opacity-60"
              >
                {isSubmitting ? 'Joining…' : 'Join us'}
              </button>
            </form>
            {submitStatus === 'success' && (
              <p className="text-sm text-brand-berry mt-3 text-center sm:text-left">
                Thank you — we are glad you are here.
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="text-sm text-red-600/80 mt-3 text-center sm:text-left">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
