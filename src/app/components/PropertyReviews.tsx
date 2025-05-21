import { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    const fetchReviews = async () => {
      const q = query(collection(db, 'properties', propertyId, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setReviews(snapshot.docs.map(doc => doc.data()));
    };
    fetchReviews();
  }, [propertyId, submitting]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    await addDoc(collection(db, 'properties', propertyId, 'reviews'), {
      userId: user.uid,
      displayName: user.displayName || user.email,
      rating,
      text,
      createdAt: new Date(),
    });
    setText('');
    setRating(5);
    setSubmitting(false);
  };

  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : 'N/A';

  return (
    <div className="bg-white rounded shadow p-4 mt-6">
      <h2 className="text-lg font-bold mb-2 text-navy">Reviews & Ratings</h2>
      <div className="mb-2">Average Rating: <span className="font-semibold">{avgRating}</span> / 5</div>
      <ul className="mb-4">
        {reviews.length === 0 ? <li>No reviews yet.</li> : reviews.map((r, i) => (
          <li key={i} className="mb-2 border-b pb-2">
            <div className="font-semibold">{r.displayName}</div>
            <div className="text-orange">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <div className="text-darkgray">{r.text}</div>
            <div className="text-xs text-gray-400">{r.createdAt?.toDate?.().toLocaleString?.() || ''}</div>
          </li>
        ))}
      </ul>
      {user && (
        <form onSubmit={submitReview} className="flex flex-col gap-2">
          <label className="font-semibold">Your Rating:</label>
          <select value={rating} onChange={e => setRating(Number(e.target.value))} className="w-24 border rounded px-2 py-1">
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your review..."
            className="border rounded px-2 py-1"
            required
          />
          <button type="submit" className="bg-orange text-white px-4 py-2 rounded" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
        </form>
      )}
    </div>
  );
} 