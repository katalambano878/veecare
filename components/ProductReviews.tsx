'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, invalidateCache } from '@/lib/query-cache';
import { useRecaptcha } from '@/hooks/useRecaptcha';

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  verified: boolean;
  title: string;
  content: string;
  helpful: number;
  user_id: string;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [filter, setFilter] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: ''
  });
  const { getToken, verifying } = useRecaptcha();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchReviews uses productId; stable fetch on productId change
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await cachedQuery<{ data: any; error: any }>(
        `reviews:${productId}`,
        (() => supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })) as any,
        5 * 60 * 1000
      );

      if (error) throw error;

      if (data) {
        const formattedReviews = data.map((r: any) => ({
          id: r.id,
          author: 'Verified Customer',
          rating: r.rating,
          date: r.created_at,
          verified: r.verified_purchase,
          title: r.title,
          content: r.content,
          helpful: r.helpful_votes || 0,
          user_id: r.user_id
        }));
        setReviews(formattedReviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return {
      star,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0
    };
  });

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(filter));

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to submit a review');
      return;
    }

    const isHuman = await getToken('review');
    if (!isHuman) {
      alert('Security verification failed. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([{
        product_id: productId,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content,
        status: 'approved',
        verified_purchase: false
      }]);

      if (error) throw error;

      alert('Review submitted successfully!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', content: '' });
      invalidateCache(`reviews:${productId}`);
      fetchReviews();

    } catch (err: any) {
      console.error('Submit review error:', err);
      alert('Failed to submit review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-brand-cocoa/60">Loading reviews...</div>;

  return (
    <div className="bg-white/80 rounded-2xl shadow-luxury border border-brand-nude/50 p-8">
      <h2 className="font-display text-2xl font-semibold text-brand-espresso mb-6">Customer Reviews</h2>

      {reviews.length === 0 && !showReviewForm ? (
        <div className="text-center py-8 mb-8 border-b border-brand-nude/50">
          <p className="text-brand-cocoa/60 mb-4">No reviews yet. Be the first to review!</p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="btn-luxury-primary px-6 py-2"
          >
            Write a Review
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-brand-nude/50">
            <div className="text-center">
              <div className="font-display text-5xl font-semibold text-brand-espresso mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`ri-star-${star <= Math.round(averageRating) ? 'fill' : 'line'} text-xl ${star <= Math.round(averageRating) ? 'text-brand-champagne' : 'text-brand-nude'
                      }`}
                  ></i>
                ))}
              </div>
              <p className="text-brand-cocoa/60">Based on {reviews.length} reviews</p>
            </div>

            <div className="md:col-span-2">
              <div className="space-y-2">
                {ratingDistribution.map((dist) => (
                  <div key={dist.star} className="flex items-center space-x-3">
                    <button
                      onClick={() => setFilter(dist.star.toString())}
                      className="flex items-center space-x-1 hover:text-brand-espresso transition-colors"
                    >
                      <span className="text-sm font-medium w-6">{dist.star}</span>
                      <i className="ri-star-fill text-brand-champagne text-sm"></i>
                    </button>
                    <div className="flex-1 h-3 bg-brand-nude/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-champagne transition-all duration-300"
                        style={{ width: `${dist.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-brand-cocoa/60 w-8">{dist.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${filter === 'all'
                  ? 'bg-brand-espresso text-white'
                  : 'bg-brand-nude/30 text-brand-cocoa hover:bg-brand-nude/50'
                  }`}
              >
                All Reviews ({reviews.length})
              </button>
            </div>

            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-luxury-primary px-6 py-2"
              >
                Write a Review
              </button>
            )}
          </div>
        </>
      )}

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="bg-brand-nude/20 rounded-2xl p-6 mb-8 border border-brand-nude/50">
          <h3 className="text-lg font-semibold text-brand-espresso mb-4">Write Your Review</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-espresso mb-2">Your Rating *</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <i
                    className={`ri-star-${star <= reviewForm.rating ? 'fill' : 'line'} text-3xl ${star <= reviewForm.rating ? 'text-brand-champagne' : 'text-brand-nude'
                      }`}
                  ></i>
                </button>
              ))}
            </div>
          </div>

          {!user && (
            <div className="mb-4 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
              You must be logged in to submit a review.
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-espresso mb-2">Review Title *</label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-brand-nude/70 rounded-xl focus:ring-2 focus:ring-brand-mauve/30 focus:border-brand-espresso bg-white"
              placeholder="Sum up your experience"
              required
              disabled={!user}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-espresso mb-2">Your Review *</label>
            <textarea
              value={reviewForm.content}
              onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-brand-nude/70 rounded-xl focus:ring-2 focus:ring-brand-mauve/30 focus:border-brand-espresso bg-white"
              placeholder="Share your experience with this product"
              required
              disabled={!user}
            ></textarea>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting || !user}
              className="btn-luxury-primary px-6 py-3 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="btn-luxury-outline px-6 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="pb-6 border-b border-brand-nude/50 last:border-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center bg-brand-nude/50 rounded-full text-brand-espresso font-bold text-lg">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-brand-espresso">{review.author}</span>
                    {review.verified && (
                      <span className="flex items-center text-xs text-brand-espresso bg-brand-nude/40 px-2 py-1 rounded">
                        <i className="ri-checkbox-circle-fill mr-1"></i>
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brand-cocoa/60">{new Date(review.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`ri-star-${star <= review.rating ? 'fill' : 'line'} text-lg ${star <= review.rating ? 'text-brand-champagne' : 'text-brand-nude'
                      }`}
                  ></i>
                ))}
              </div>
            </div>

            <h4 className="font-semibold text-brand-espresso mb-2">{review.title}</h4>
            <p className="text-brand-cocoa/80 mb-4">{review.content}</p>

            <div className="flex items-center space-x-4 text-sm">
              <button className="flex items-center space-x-1 text-brand-cocoa/60 hover:text-brand-espresso transition-colors">
                <i className="ri-thumb-up-line"></i>
                <span>Helpful ({review.helpful})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
