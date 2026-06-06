import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('contact');

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
