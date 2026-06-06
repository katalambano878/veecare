import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('privacy');

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
