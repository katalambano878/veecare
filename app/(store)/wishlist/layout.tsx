import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('wishlist');

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
