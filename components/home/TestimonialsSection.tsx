'use client';

import AnimatedSection from '@/components/AnimatedSection';
import { TESTIMONIALS } from '@/lib/brand';

export default function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-24 md:py-24 bg-brand-cream relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '128px 128px' }} />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-brand-rose/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-lavender/20 rounded-full blur-[140px] pointer-events-none translate-x-1/3 translate-y-1/3" />
      
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center mb-10 sm:mb-16 lg:mb-20">
          <span className="glass inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-brand-espresso mb-4 sm:mb-6 shadow-glass">
            COMMUNITY VOICES
          </span>
          <h2 className="font-display text-[2rem] sm:text-4xl lg:text-5xl text-brand-cocoa tracking-tight leading-[1.12]">
            Trusted by women across <span className="italic text-brand-berry font-medium">Ghana</span>
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 80}>
              <blockquote className="h-full flex flex-col p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card shadow-glass hover:shadow-glass-strong hover:-translate-y-2 transition-all duration-500 border border-white/60">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl glass flex items-center justify-center mb-4 sm:mb-6 shadow-glass">
                  <i className="ri-double-quotes-l text-xl sm:text-2xl text-brand-berry" aria-hidden />
                </div>
                <p className="text-brand-cocoa/85 leading-relaxed flex-1 font-normal text-[0.95rem] sm:text-lg mb-6 sm:mb-8 relative z-10">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="pt-6 border-t border-brand-nude/40">
                  <cite className="block not-italic font-semibold text-brand-espresso text-base mb-1">{t.name}</cite>
                  <p className="text-sm font-medium tracking-wide text-brand-cocoa/50 uppercase">{t.location}</p>
                </footer>
              </blockquote>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
