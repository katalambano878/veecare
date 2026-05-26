import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('returns');

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
