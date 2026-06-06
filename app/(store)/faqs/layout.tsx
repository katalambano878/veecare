import { HOME_FAQ_PREVIEW } from '@/lib/brand';
import { buildPageMetadata, faqPageJsonLd } from '@/lib/seo';

export const metadata = buildPageMetadata('faqs');

const faqSchema = faqPageJsonLd(
  HOME_FAQ_PREVIEW.map((faq) => ({ question: faq.question, answer: faq.answer }))
);

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
