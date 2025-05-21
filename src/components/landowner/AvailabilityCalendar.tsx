import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function AvailabilityCalendar({ propertyId }: { propertyId: string }) {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    // Load unavailable dates from Firestore
    const fetchDates = async () => {
      const colRef = collection(db, 'properties', propertyId, 'unavailableDates');
      const snapshot = await getDocs(colRef);
      setUnavailableDates(snapshot.docs.map(doc => doc.id));
    };
    fetchDates();
  }, [propertyId]);

  const blockDate = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (unavailableDates.includes(dateStr)) return;
    const colRef = collection(db, 'properties', propertyId, 'unavailableDates');
    await addDoc(colRef, { date: dateStr });
    setUnavailableDates(prev => [...prev, dateStr]);
  };

  const unblockDate = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const colRef = collection(db, 'properties', propertyId, 'unavailableDates');
    const snapshot = await getDocs(colRef);
    const docToDelete = snapshot.docs.find(d => d.data().date === dateStr);
    if (docToDelete) {
      await deleteDoc(doc(db, 'properties', propertyId, 'unavailableDates', docToDelete.id));
      setUnavailableDates(prev => prev.filter(d => d !== dateStr));
    }
  };

  const onDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    if (unavailableDates.includes(dateStr)) {
      unblockDate(date);
    } else {
      blockDate(date);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-lg font-bold mb-2 text-navy">Availability Calendar</h2>
      <Calendar
        onClickDay={onDateClick}
        tileClassName={({ date }) => {
          const dateStr = date.toISOString().split('T')[0];
          return unavailableDates.includes(dateStr) ? 'bg-orange text-white rounded-full' : '';
        }}
      />
      <div className="mt-2 text-sm text-darkgray">
        Click a date to block/unblock. Blocked dates are highlighted.
      </div>
    </div>
  );
} 