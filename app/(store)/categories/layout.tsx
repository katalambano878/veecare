import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata('categories');

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
