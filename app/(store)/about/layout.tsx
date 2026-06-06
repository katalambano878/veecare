import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('about');

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
