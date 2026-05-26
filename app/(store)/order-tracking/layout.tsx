import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('orderTracking');

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
