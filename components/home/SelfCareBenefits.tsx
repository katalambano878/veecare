'use client';

import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';
import { SELF_CARE_BENEFITS } from '@/lib/brand';

export default function SelfCareBenefits() {
  return (
    <section className="py-24 md:py-24 bg-brand-blush/20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-rose/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="glass inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-brand-espresso mb-6 shadow-glass">
            WHY WOMEN CHOOSE US
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-cocoa tracking-tight mb-4 sm:mb-6 leading-[1.12]">
            Wellness that feels <span className="italic text-brand-berry font-medium">supportive</span>
          </h2>
          <p className="text-lg sm:text-xl text-brand-cocoa/70 max-w-2xl mx-auto leading-relaxed">
            Calm, thoughtful care — never clinical, never loud. Just space to feel comfortable in your
            own rhythm.
          </p>
        </AnimatedSection>

        <AnimatedGrid className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {SELF_CARE_BENEFITS.map((benefit, i) => (
            <div
              key={benefit.title}
              className="group relative p-4 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card transition-all duration-500 hover:-translate-y-3"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] pointer-events-none" />
              <span className="relative inline-flex w-10 h-10 sm:w-14 sm:h-14 items-center justify-center rounded-xl sm:rounded-2xl glass mb-3 sm:mb-6 shadow-glass group-hover:scale-110 transition-transform duration-500">
                <i className={`${benefit.icon} text-lg sm:text-2xl text-brand-espresso group-hover:text-brand-berry transition-colors`} aria-hidden />
              </span>
              <h3 className="relative font-display text-[0.95rem] sm:text-2xl font-semibold text-brand-cocoa mb-1.5 sm:mb-3 group-hover:text-brand-espresso transition-colors">
                {benefit.title}
              </h3>
              <p className="relative text-[0.8rem] sm:text-base text-brand-cocoa/70 leading-snug sm:leading-relaxed group-hover:text-brand-cocoa/85 transition-colors line-clamp-3 sm:line-clamp-none">
                {benefit.description}
              </p>
            </div>
          ))}
        </AnimatedGrid>
      </div>
    </section>
  );
}
