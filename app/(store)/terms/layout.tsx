import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('terms');

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
