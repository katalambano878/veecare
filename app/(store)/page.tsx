import { buildPageMetadata } from '@/lib/seo';
import { HERO_IMAGE, HERO_IMAGE_MOBILE, HERO_IMAGE_VERSION } from '@/lib/brand';
import { getHomePageData } from '@/lib/home-data';
import HomeClient from './HomeClient';

export const metadata = buildPageMetadata('home');

/** Cache home catalog on the server — faster repeat visits on mobile */
export const revalidate = 300;

export default async function HomePage() {
  const { featuredProducts, categories } = await getHomePageData();

  const mobileLcp = `${HERO_IMAGE_MOBILE}?v=${HERO_IMAGE_VERSION}`;
  const desktopLcp = `${HERO_IMAGE}?v=${HERO_IMAGE_VERSION}`;

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={mobileLcp}
        media="(max-width: 1023px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={desktopLcp}
        media="(min-width: 1024px)"
        fetchPriority="high"
      />
      <HomeClient
        initialFeaturedProducts={featuredProducts}
        initialCategories={categories}
      />
    </>
  );
}
