import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('shipping');

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
