import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitize';
import { getBlogPostBySlugOrId, getPublishedBlogPosts } from '@/lib/blog-data';

export const revalidate = 300;

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPostBySlugOrId(id);

  if (!post) {
    notFound();
  }

  const allPosts = await getPublishedBlogPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-brand-cream via-white to-brand-blush/20 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-brand-espresso hover:text-brand-cocoa mb-8 transition-colors"
          >
            <i className="ri-arrow-left-line" />
            Back to blog
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
            <span className="bg-brand-nude/50 text-brand-espresso px-3 py-1 rounded-full font-medium">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span className="flex items-center gap-1">
              <i className="ri-time-line" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-semibold text-brand-cocoa mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-nude/50 rounded-full flex items-center justify-center">
              <i className="ri-user-line text-brand-espresso" />
            </div>
            <span className="text-brand-cocoa font-medium">{post.author}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden mb-10">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <article
          className="prose prose-lg max-w-none text-brand-cocoa/90 prose-headings:text-brand-cocoa prose-a:text-brand-berry"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />

        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-brand-blush/40">
            <h2 className="text-2xl font-display font-semibold text-brand-cocoa mb-6">More to read</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="block rounded-2xl border border-brand-blush/30 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-40">
                    <img src={related.image} alt={related.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-brand-cocoa line-clamp-2">{related.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
