'use client';

import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { ABOUT_US, BRAND_INTRO_SECONDARY, BRAND_MOTTO } from '@/lib/brand';

type AboutBrandSectionProps = {
  /** When true, CTA scrolls to story on the About page instead of linking away */
  onAboutPage?: boolean;
};

export default function AboutBrandSection({ onAboutPage = false }: AboutBrandSectionProps) {
  return (
    <section className="py-24 md:py-24 bg-brand-ivory relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-rose/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-brand-lavender/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none mix-blend-multiply" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-24 items-center">
          <AnimatedSection>
            <span className="glass inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-brand-espresso mb-6 shadow-glass">
              ABOUT THE BRAND
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-cocoa mb-6 sm:mb-8 leading-[1.12] tracking-tight">
              Empowering women&apos;s <span className="italic text-brand-berry font-medium block mt-2">yoni wellness</span>
            </h2>
            <div className="space-y-6 text-lg text-brand-cocoa/80 leading-relaxed font-normal">
              <p>{ABOUT_US}</p>
              <p>{BRAND_INTRO_SECONDARY}</p>
              <p className="font-display text-xl italic text-brand-berry/90 border-l-4 border-brand-rose pl-5">
                &ldquo;{BRAND_MOTTO}&rdquo;
              </p>
            </div>
            <Link
              href={onAboutPage ? '#our-story' : '/about'}
              className="inline-flex items-center mt-10 text-brand-espresso font-semibold hover:text-brand-berry transition-all group glass px-6 py-3 rounded-full shadow-glass hover:shadow-glass-hover"
            >
              <span>{onAboutPage ? 'Explore our story' : 'Read our full story'}</span>
              <i className="ri-arrow-right-line ml-2 text-lg transition-transform group-hover:translate-x-1" />
            </Link>
          </AnimatedSection>

          <AnimatedSection delay={150} className="relative">
            <div className="aspect-[4/5] max-w-md mx-auto lg:ml-auto rounded-[3rem] overflow-hidden glass-panel border border-white/60 p-8 sm:p-10 flex flex-col justify-end shadow-luxury-lg hover:shadow-glass-strong transition-all duration-700 hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand-rose/20 blur-3xl pointer-events-none" aria-hidden />
              <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-brand-lavender/30 blur-3xl pointer-events-none" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                {[
                  { label: 'Feminine wellness', icon: 'ri-heart-2-line' },
                  { label: 'Personal care', icon: 'ri-drop-line' },
                  { label: 'Self-care rituals', icon: 'ri-moon-foggy-line' },
                  { label: 'Community trust', icon: 'ri-team-line' },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="group flex items-center gap-5 p-4 sm:p-5 rounded-2xl glass transition-all duration-500 hover:bg-white/70 hover:shadow-glass-hover hover:-translate-y-1"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <span className="w-12 h-12 rounded-xl glass flex items-center justify-center text-brand-berry shadow-glass transition-transform duration-500 group-hover:scale-110 group-hover:text-brand-rose">
                      <i className={`${item.icon} text-xl`} aria-hidden />
                    </span>
                    <span className="font-semibold text-brand-cocoa text-lg tracking-tight group-hover:text-brand-espresso transition-colors">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
