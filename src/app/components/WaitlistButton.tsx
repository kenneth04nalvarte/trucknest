import { useState } from 'react';
import { db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function WaitlistButton({ propertyId, userId }: { propertyId: string, userId: string }) {
  const [joined, setJoined] = useState(false);

  const joinWaitlist = async () => {
    setJoined(true);
    await setDoc(doc(db, 'waitlists', propertyId, 'users', userId), {
      userId,
      joinedAt: new Date(),
    });
    // TODO: Trigger notification when a spot opens
  };

  return (
    <button
      className={`px-4 py-2 rounded ${joined ? 'bg-gray-400 text-white' : 'bg-orange text-white'}`}
      onClick={joinWaitlist}
      disabled={joined}
    >
      {joined ? 'Joined Waitlist' : 'Join Waitlist'}
    </button>
  );
} 