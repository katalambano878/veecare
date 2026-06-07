import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { isStoreModuleEnabled } from '@/lib/store-modules';

export const metadata = buildPageMetadata('blog');

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const blogEnabled = await isStoreModuleEnabled('blog');
  if (!blogEnabled) {
    notFound();
  }

  return children;
}
