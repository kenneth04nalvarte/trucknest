import { Suspense } from 'react';
import BookingSuccess from './BookingSuccess';

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSuccess />
    </Suspense>
  );
} 