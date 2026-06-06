'use client';

import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import { HOME_FAQ_PREVIEW } from '@/lib/brand';

export default function HomeFaqSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-brand-ivory">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="text-center mb-10 sm:mb-12">
          <span className="glass inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-brand-espresso mb-4 sm:mb-6 shadow-glass uppercase">
            Questions
          </span>
          <h2 className="font-display text-[2rem] sm:text-5xl text-brand-cocoa tracking-tight leading-[1.12]">
            Gentle answers, clearly shared
          </h2>
        </AnimatedSection>

        <div className="space-y-4">
          {HOME_FAQ_PREVIEW.map((faq, i) => (
            <AnimatedSection key={faq.question} delay={i * 50}>
              <details className="group rounded-2xl bg-white border border-brand-blush shadow-wellness overflow-hidden">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 font-medium text-brand-cocoa hover:text-brand-berry transition-colors">
                  <span>{faq.question}</span>
                  <i className="ri-add-line text-brand-berry group-open:hidden shrink-0" />
                  <i className="ri-subtract-line text-brand-berry hidden group-open:block shrink-0" />
                </summary>
                <div className="px-6 pb-5 text-sm text-brand-cocoa/80 leading-relaxed border-t border-brand-blush/80 pt-4">
                  {faq.answer}
                </div>
              </details>
            </AnimatedSection>
          ))}
        </div>

        <p className="text-center mt-10">
          <Link
            href="/faqs"
            className="text-brand-berry font-medium hover:text-brand-rose transition-colors inline-flex items-center gap-1"
          >
            View all FAQs
            <i className="ri-arrow-right-line text-sm" />
          </Link>
        </p>
      </div>
    </section>
  );
}
