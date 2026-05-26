'use client';

import AnimatedSection from '@/components/AnimatedSection';
import { CONTACT_PHONE_LINK, WHATSAPP_LINK } from '@/lib/brand';

export default function WhatsAppCta() {
  return (
    <section className="py-24 md:py-24 px-4 sm:px-6 relative z-20 -mb-16">
      <AnimatedSection className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-[3rem] glass-panel border border-white/60 p-10 sm:p-14 md:p-20 text-center shadow-glass-strong">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-rose/10 to-brand-lavender/10 opacity-50 mix-blend-overlay pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-rose/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-lavender/30 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass text-[#25D366] mb-8 shadow-glass animate-float">
              <i className="ri-whatsapp-fill text-4xl" aria-hidden />
            </span>

            <h2 className="font-display text-[2rem] sm:text-4xl lg:text-5xl font-semibold text-brand-cocoa mb-4 sm:mb-6 tracking-tight leading-[1.12]">
              We are here when you <span className="italic text-brand-berry">need us</span>
            </h2>
            <p className="text-lg text-brand-cocoa/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Questions about products, orders, or what is right for you? Message us on WhatsApp for a
              warm, discreet conversation — no pressure, just support.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wellness-primary w-full sm:w-auto justify-center text-base py-4 px-10 shadow-glass hover:shadow-glass-hover"
              >
                <i className="ri-whatsapp-line text-xl mr-2.5" />
                Chat on WhatsApp
              </a>
              <a
                href={CONTACT_PHONE_LINK}
                className="glass-panel w-full sm:w-auto justify-center inline-flex items-center px-10 py-4 rounded-full font-sans text-base font-semibold text-brand-espresso hover:text-brand-berry transition-all hover:-translate-y-1 hover:shadow-glass-hover"
              >
                <i className="ri-phone-line text-xl mr-2.5" />
                Call us
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
