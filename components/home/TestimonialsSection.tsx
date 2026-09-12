'use client';

import { useCallback, useEffect, useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import { TESTIMONIALS } from '@/lib/brand';

export default function TestimonialsSection() {
  const total = TESTIMONIALS.length;
  const [active, setActive] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const [paused, setPaused] = useState(false);
  const review = TESTIMONIALS[active];

  const goTo = useCallback(
    (next: number) => {
      setShowFull(false);
      setActive((next + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (paused || showFull) return;
    const id = window.setInterval(() => goTo(active + 1), 8000);
    return () => window.clearInterval(id);
  }, [active, goTo, paused, showFull]);

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-brand-cream relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '128px 128px',
        }}
      />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-brand-rose/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-lavender/20 rounded-full blur-[140px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center mb-8 sm:mb-10">
          <span className="glass inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-brand-espresso mb-3 sm:mb-4 shadow-glass">
            COMMUNITY VOICES
          </span>
          <h2 className="font-display text-[1.75rem] sm:text-3xl lg:text-4xl text-brand-cocoa tracking-tight leading-[1.12]">
            Trusted by women across <span className="italic text-brand-berry font-medium">Ghana</span>
          </h2>
        </AnimatedSection>

        <div
          className="max-w-xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <figure className="relative px-5 py-6 sm:px-8 sm:py-8 rounded-[1.5rem] sm:rounded-[2rem] glass-card shadow-glass border border-white/60 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase text-brand-berry bg-brand-blush/50 mb-3">
              {review.product}
            </span>

            <i className="ri-double-quotes-l block text-xl sm:text-2xl text-brand-berry/35 mb-2" aria-hidden />

            <blockquote>
              <p
                key={active}
                className="font-display text-base sm:text-lg text-brand-cocoa leading-snug tracking-tight"
              >
                &ldquo;{review.excerpt}&rdquo;
              </p>
              {showFull ? (
                <p className="mt-4 text-left text-sm text-brand-cocoa/75 leading-relaxed whitespace-pre-line font-normal">
                  {review.quote}
                </p>
              ) : null}
            </blockquote>

            <button
              type="button"
              onClick={() => setShowFull((open) => !open)}
              className="mt-3 text-xs font-semibold text-brand-berry hover:text-brand-rose transition-colors"
            >
              {showFull ? 'Show less' : 'Read full review'}
            </button>

            <figcaption className="mt-5 pt-4 border-t border-brand-nude/40">
              <div className="flex justify-center gap-0.5 mb-2 text-brand-champagne" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className="ri-star-fill text-sm" aria-hidden />
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-brand-berry text-white">
                  <i className="ri-check-line text-xs" aria-hidden />
                </span>
                <cite className="not-italic font-semibold text-sm text-brand-espresso">{review.name}</cite>
              </div>
            </figcaption>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                className="glass-panel flex items-center justify-center w-9 h-9 rounded-full text-brand-espresso hover:text-brand-berry transition-colors"
                aria-label="Previous review"
              >
                <i className="ri-arrow-left-line text-base" />
              </button>
              <div className="flex items-center gap-2" role="tablist" aria-label="Customer reviews">
                {TESTIMONIALS.map((item, i) => (
                  <button
                    key={item.excerpt}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Review ${i + 1} of ${total}`}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === active ? 'w-6 bg-brand-berry' : 'w-2 bg-brand-nude hover:bg-brand-rose/70'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                className="glass-panel flex items-center justify-center w-9 h-9 rounded-full text-brand-espresso hover:text-brand-berry transition-colors"
                aria-label="Next review"
              >
                <i className="ri-arrow-right-line text-base" />
              </button>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
