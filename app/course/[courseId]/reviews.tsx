'use client';

import { useState } from 'react';
import { submitReview } from '@/app/actions/feedback';
import { Star, Loader2 } from 'lucide-react';

type Review = {
  id: string;
  learnerName: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

function Stars({ value, interactive = false, onChange }: { value: number; interactive?: boolean; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={interactive ? 22 : 14}
          className={`transition-colors ${
            i <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/30'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({
  courseId,
  isEnrolled,
  reviews,
  avgRating,
  totalReviews,
  myReview,
}: {
  courseId: string;
  isEnrolled: boolean;
  reviews: Review[];
  avgRating: number | null;
  totalReviews: number;
  myReview: Review | null;
}) {
  const [rating,    setRating]    = useState(myReview?.rating ?? 0);
  const [comment,   setComment]   = useState(myReview?.comment ?? '');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [err,       setErr]       = useState('');

  const handleSubmit = async () => {
    if (!rating) { setErr('Please select a star rating'); return; }
    setSaving(true); setErr('');
    const r = await submitReview(courseId, rating, comment);
    setSaving(false);
    if (r.success) setSaved(true);
    else setErr(r.error ?? 'Failed to submit');
  };

  return (
    <div className='bg-white rounded-2xl shadow-sm overflow-hidden'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-black/[0.06]'>
        <div className='flex items-center gap-4'>
          <h2 className='text-sm font-bold text-foreground'>Reviews</h2>
          {avgRating && (
            <div className='flex items-center gap-2'>
              <Stars value={Math.round(avgRating)} />
              <span className='text-sm font-bold text-foreground'>{avgRating}</span>
              <span className='text-xs text-muted-foreground'>({totalReviews})</span>
            </div>
          )}
        </div>
      </div>

      {/* Write a review */}
      {isEnrolled && (
        <div className='px-6 py-5 border-b border-black/[0.04] bg-[#F5F5F7]'>
          <p className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3'>
            {myReview ? 'Your review' : 'Write a review'}
          </p>
          {saved ? (
            <p className='text-sm font-semibold text-primary'>✓ Review submitted — thank you!</p>
          ) : (
            <div className='space-y-3'>
              <Stars value={rating} interactive onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder='Share your experience with this course… (optional)'
                className='w-full px-3 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground/50'
              />
              {err && <p className='text-xs text-destructive'>{err}</p>}
              <button onClick={handleSubmit} disabled={saving}
                className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60'>
                {saving ? <><Loader2 size={13} className='animate-spin' /> Saving…</> : myReview ? 'Update review' : 'Submit review'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className='px-6 py-8 text-center text-sm text-muted-foreground'>
          No reviews yet. Be the first to review this course.
        </div>
      ) : (
        <div className='divide-y divide-black/[0.04]'>
          {reviews.map((r) => (
            <div key={r.id} className='px-6 py-4'>
              <div className='flex items-center gap-2.5 mb-1.5'>
                <div className='w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0'>
                  {(r.learnerName ?? 'L')[0].toUpperCase()}
                </div>
                <div>
                  <p className='text-sm font-semibold text-foreground leading-none'>{r.learnerName ?? 'Learner'}</p>
                  <p className='text-[10px] text-muted-foreground mt-0.5'>
                    {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className='ml-auto'>
                  <Stars value={r.rating} />
                </div>
              </div>
              {r.comment && (
                <p className='text-sm text-muted-foreground leading-relaxed pl-9'>{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
