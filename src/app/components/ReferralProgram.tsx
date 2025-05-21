import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

function generateReferralCode(userId: string) {
  // Simple code: first 6 of userId, can be improved
  return userId.slice(0, 6).toUpperCase();
}

export default function ReferralProgram({ userId }: { userId: string }) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetchOrCreateCode = async () => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      let code = '';
      if (userSnap.exists() && userSnap.data().referralCode) {
        code = userSnap.data().referralCode;
      } else {
        code = generateReferralCode(userId);
        await setDoc(userRef, { referralCode: code }, { merge: true });
      }
      setReferralCode(code);
    };
    const fetchReferrals = async () => {
      const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
      const snapshot = await getDocs(q);
      setReferralCount(snapshot.size);
    };
    fetchOrCreateCode();
    fetchReferrals();
  }, [userId]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-lg font-bold mb-2 text-navy">Referral Program</h2>
      <div className="mb-2">Your Referral Code: <span className="font-mono bg-lightgray px-2 py-1 rounded">{referralCode}</span></div>
      <button className="bg-orange text-white px-4 py-2 rounded" onClick={copyCode}>{copied ? 'Copied!' : 'Copy Code'}</button>
      <div className="mt-4 text-sm text-darkgray">Referrals Tracked: {referralCount}</div>
      {/* TODO: Show input for referral code on sign-up */}
    </div>
  );
} 