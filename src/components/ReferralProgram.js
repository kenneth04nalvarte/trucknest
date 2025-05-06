import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/app/config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    updateDoc
} from 'firebase/firestore';

interface Referral {
    id: string;
    code: string;
    referredBy: string;
    status: 'pending' | 'completed';
    rewardAmount: number;
    createdAt: string;
}

interface ReferralStats {
    totalReferrals: number;
    earnedRewards: number;
    pendingRewards: number;
}

export default function ReferralProgram() {
    const { user } = useAuth();
    const [referralStats, setReferralStats] = useState<ReferralStats>({
        totalReferrals: 0,
        earnedRewards: 0,
        pendingRewards: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        if (user) {
            loadReferralData();
        }
    }, [user]);

    const loadReferralData = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const userData = userDoc.data();

            // Generate referral code if not exists
            if (!userData.referralCode) {
                const code = generateReferralCode(userData.email);
                await updateDoc(doc(db, 'users', userId), {
                    referralCode: code
                });
                setReferralCode(code);
            } else {
                setReferralCode(userData.referralCode);
            }

            // Get referral stats
            const referralsQuery = query(
                collection(db, 'referrals'),
                where('referrerId', '==', userId)
            );
            const referralsSnapshot = await getDocs(referralsQuery);
            
            const stats = {
                totalReferrals: referralsSnapshot.size,
                pendingRewards: 0,
                earnedRewards: userData.earnedRewards || 0
            };

            referralsSnapshot.forEach(doc => {
                const referral = doc.data();
                if (referral.status === 'pending') {
                    stats.pendingRewards += referral.rewardAmount;
                }
            });

            setReferralStats(stats);
            setLoading(false);
        } catch (error) {
            console.error('Error loading referral data:', error);
            setLoading(false);
        }
    };

    const generateReferralCode = (email) => {
        const username = email.split('@')[0];
        const randomString = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${username.substring(0, 5).toUpperCase()}-${randomString}`;
    };

    const shareReferralLink = async (platform) => {
        const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
        const message = `Join TruckNest Parking App! Use my referral code ${referralCode} to get $50 off your first booking. Sign up here: ${referralLink}`;

        switch (platform) {
            case 'copy':
                navigator.clipboard.writeText(message);
                alert('Referral link copied to clipboard!');
                break;
            case 'email':
                window.location.href = `mailto:?subject=Join TruckNest Parking App&body=${encodeURIComponent(message)}`;
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                break;
            case 'sms':
                window.location.href = `sms:?body=${encodeURIComponent(message)}`;
                break;
        }

        // Log share activity
        await addDoc(collection(db, 'referralShares'), {
            userId,
            platform,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Refer & Earn</h2>
                <p className="text-gray-600">
                    Invite friends to TruckNest and earn $50 when they complete their first booking!
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Referral Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-blue-800">{referralStats.totalReferrals}</h3>
                            <p className="text-sm text-blue-600">Total Referrals</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-green-800">${referralStats.earnedRewards}</h3>
                            <p className="text-sm text-green-600">Earned Rewards</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <h3 className="text-lg font-semibold text-yellow-800">${referralStats.pendingRewards}</h3>
                            <p className="text-sm text-yellow-600">Pending Rewards</p>
                        </div>
                    </div>

                    {/* Referral Code */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-8">
                        <p className="text-sm text-gray-600 mb-2">Your Referral Code</p>
                        <div className="flex items-center justify-between bg-white p-3 rounded border">
                            <span className="font-mono text-lg">{referralCode}</span>
                            <button
                                onClick={() => shareReferralLink('copy')}
                                className="text-blue-500 hover:text-blue-700"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="space-y-4">
                        <h3 className="font-semibold mb-2">Share Your Referral Link</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => shareReferralLink('email')}
                                className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                Email
                            </button>
                            <button
                                onClick={() => shareReferralLink('whatsapp')}
                                className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                            </button>
                            <button
                                onClick={() => shareReferralLink('sms')}
                                className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3.293 3.293 3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                                SMS
                            </button>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="mt-8 border-t pt-6">
                        <h3 className="font-semibold mb-4">How It Works</h3>
                        <ol className="space-y-3">
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-3 flex-shrink-0">1</span>
                                <p>Share your unique referral code with friends</p>
                            </li>
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-3 flex-shrink-0">2</span>
                                <p>Friends sign up using your code and make their first booking</p>
                            </li>
                            <li className="flex items-start">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-3 flex-shrink-0">3</span>
                                <p>You earn $50 reward credit after their booking is completed</p>
                            </li>
                        </ol>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReferralProgram; 