import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('cart');

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
