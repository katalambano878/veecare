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
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mb-16 md:mb-20">
      <div className="glass-panel rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-mauve/20 rounded-full blur-[70px]" />
          <div className="absolute bottom-0 -left-16 w-56 h-56 bg-brand-champagne/25 rounded-full blur-[50px]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-10 md:p-14 gap-10">
          <div className="text-center lg:text-left max-w-lg">
            <span className="inline-block text-[10px] uppercase tracking-widest-xl text-brand-mauve mb-4 font-semibold">
              Community
            </span>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-display text-brand-espresso mb-4 leading-tight tracking-tight">
              Join Our <span className="italic text-brand-mauve">Community</span>
            </h3>
            <p className="text-brand-cocoa/75 text-base leading-relaxed font-light">
              Be the first to know about new arrivals, trending finds, imported lifestyle products, and exclusive
              updates.
            </p>
          </div>

          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-[1.5rem] bg-white/60 backdrop-blur-md border border-white/80 shadow-inner"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-transparent border-none text-brand-cocoa placeholder-brand-cocoa/40 px-6 py-3.5 focus:ring-0 text-base min-w-0 rounded-[1.25rem] font-light tracking-wide"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-luxury-primary px-8 py-3.5 rounded-[1.25rem] whitespace-nowrap text-sm tracking-wide"
              >
                {isSubmitting ? (
                  <i className="ri-loader-4-line animate-spin text-lg" />
                ) : (
                  'Stay Updated'
                )}
              </button>
            </form>
            {submitStatus === 'success' && (
              <p className="mt-3 text-sm text-brand-mauve text-center lg:text-left animate-fade-in">
                <i className="ri-checkbox-circle-line mr-1" />
                You&apos;re on the list — welcome!
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
