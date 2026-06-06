import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('shop');

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
