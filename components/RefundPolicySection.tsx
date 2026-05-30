import { REFUND_POLICY, WHATSAPP_LINK } from '@/lib/brand';
import Link from 'next/link';

type RefundPolicySectionProps = {
  id?: string;
  className?: string;
};

export default function RefundPolicySection({
  id = 'refund-policy',
  className = '',
}: RefundPolicySectionProps) {
  return (
    <section
      id={id}
      className={`rounded-3xl border border-brand-mauve/25 bg-gradient-to-br from-brand-mauve/20 via-brand-nude/40 to-brand-cream px-6 py-10 sm:px-10 sm:py-12 ${className}`}
    >
      <div className="max-w-3xl mx-auto text-center">
        <span className="brand-eyebrow mb-4 inline-block">Returns & refunds</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold text-brand-espresso mb-6 tracking-tight">
          {REFUND_POLICY.title}
        </h2>
        <p className="brand-body-lg text-brand-cocoa/85 mb-10 text-left sm:text-center">{REFUND_POLICY.intro}</p>

        <div className="space-y-8 text-left">
          {REFUND_POLICY.sections.map((section, index) => (
            <div key={section.title} className={index > 0 ? 'pt-2 border-t border-brand-mauve/20' : ''}>
              <h3 className="text-lg sm:text-xl font-display font-semibold text-brand-espresso mb-3">
                {index + 1}. {section.title}
              </h3>
              <p className="brand-body">{section.body}</p>
            </div>
          ))}

          <p className="brand-body text-center pt-4">
            {REFUND_POLICY.contactCta}{' '}
            <Link
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-espresso underline underline-offset-4 decoration-brand-mauve/50 hover:text-brand-mauve transition-colors"
            >
              Chat on WhatsApp
            </Link>
            {' · '}
            <Link
              href="/contact"
              className="font-semibold text-brand-espresso underline underline-offset-4 decoration-brand-mauve/50 hover:text-brand-mauve transition-colors"
            >
              Contact page
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
