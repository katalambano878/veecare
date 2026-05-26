import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('blog');

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
