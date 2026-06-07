import Link from 'next/link';
import { getPublishedBlogPosts } from '@/lib/blog-data';

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const featuredPost = posts[0];
  const latestPosts = posts.slice(1);

  const categories = Array.from(new Set(posts.map((p) => p.category))).map((name) => ({
    name,
    count: posts.filter((p) => p.category === name).length,
    icon: 'ri-article-line',
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-brand-cream via-white to-brand-blush/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-display font-semibold text-brand-cocoa mb-6">Wellness Journal</h1>
            <p className="text-xl text-brand-cocoa/70 leading-relaxed">
              Feminine care tips, self-care guidance, and gentle wellness stories from Vee-Care Hera.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {featuredPost && (
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="block mb-16 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="bg-white border border-brand-blush/40 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-96 md:h-auto min-h-[280px]">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-6 left-6">
                    <span className="bg-brand-espresso text-white px-4 py-2 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                    <span className="bg-brand-nude/50 text-brand-espresso px-3 py-1 rounded-full font-medium">
                      {featuredPost.category}
                    </span>
                    <span>{featuredPost.date}</span>
                    <span className="flex items-center gap-1">
                      <i className="ri-time-line" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display font-semibold text-brand-cocoa mb-4 leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-brand-cocoa/70 text-lg leading-relaxed mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-nude/50 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-brand-espresso" />
                    </div>
                    <span className="text-brand-cocoa font-medium">{featuredPost.author}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <h2 className="text-3xl font-display font-semibold text-brand-cocoa mb-8">Latest Articles</h2>
            {latestPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="bg-white border border-brand-blush/30 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="relative h-64">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium text-xs">
                          {post.category}
                        </span>
                        <span className="text-xs">{post.date}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-brand-cocoa mb-3 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-brand-cocoa/70 mb-4 leading-relaxed text-sm">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <i className="ri-user-line text-gray-600 text-sm" />
                          </div>
                          <span className="text-sm text-brand-cocoa font-medium">{post.author}</span>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <i className="ri-time-line" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-brand-cocoa/60">More articles coming soon.</p>
            )}
          </div>

          <div>
            <div className="bg-brand-cream/50 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-brand-cocoa mb-6">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/60"
                  >
                    <div className="flex items-center gap-3">
                      <i className={`${category.icon} text-brand-espresso`} />
                      <span className="text-brand-cocoa font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-espresso to-brand-cocoa py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-semibold text-white mb-4">Explore the shop</h2>
          <p className="text-xl text-brand-nude/90 mb-8 leading-relaxed">
            Feminine care, hygiene, and wellness essentials — curated for everyday confidence.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-white text-brand-espresso px-8 py-4 rounded-full font-medium hover:bg-brand-nude/30 transition-colors whitespace-nowrap"
          >
            Shop now
            <i className="ri-arrow-right-line" />
          </Link>
        </div>
      </div>
    </div>
  );
}
