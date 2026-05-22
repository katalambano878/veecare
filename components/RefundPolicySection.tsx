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
        <span className="brand-eyebrow mb-4 inline-block">Returns & exchanges</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold text-brand-espresso mb-8 tracking-tight">
          {REFUND_POLICY.title}
        </h2>

        <div className="space-y-8 text-left">
          <div>
            <p className="brand-body-lg font-semibold text-brand-espresso mb-4">
              {REFUND_POLICY.refundIntro}
            </p>
            <ol className="brand-body space-y-3 list-decimal list-inside marker:font-semibold marker:text-brand-espresso">
              {REFUND_POLICY.refundReasons.map((reason, index) => (
                <li key={index} className="pl-1">
                  {reason}
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-2 border-t border-brand-mauve/20">
            <h3 className="text-xl sm:text-2xl font-display font-semibold text-brand-espresso mb-3">
              {REFUND_POLICY.exchangeTitle}
            </h3>
            <p className="brand-body mb-4">{REFUND_POLICY.exchangeBody}</p>
            <p className="brand-body font-semibold text-brand-espresso">{REFUND_POLICY.exchangeWindow}</p>
          </div>

          <p className="brand-body text-brand-cocoa/90">{REFUND_POLICY.finalNote}</p>

          <p className="brand-body text-center pt-2">
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
