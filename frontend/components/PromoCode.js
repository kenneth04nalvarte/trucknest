import { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const PromoCode = ({ userId, bookingAmount, onApplyPromo }) => {
    const [promoCode, setPromoCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);

    const validatePromoCode = async () => {
        setLoading(true);
        setError('');

        try {
            const promoQuery = query(
                collection(db, 'promoCodes'),
                where('code', '==', promoCode.toUpperCase())
            );
            const promoSnapshot = await getDocs(promoQuery);

            if (promoSnapshot.empty) {
                setError('Invalid promo code');
                return;
            }

            const promoData = promoSnapshot.docs[0].data();
            const now = new Date();
            const startDate = new Date(promoData.startDate);
            const endDate = new Date(promoData.endDate);

            // Validate promo code
            if (now < startDate || now > endDate) {
                setError('This promo code has expired');
                return;
            }

            if (promoData.usageLimit && promoData.usedCount >= promoData.usageLimit) {
                setError('This promo code has reached its usage limit');
                return;
            }

            if (promoData.minBookingAmount && bookingAmount < promoData.minBookingAmount) {
                setError(`Minimum booking amount of $${promoData.minBookingAmount} required`);
                return;
            }

            // Check if user has already used this promo
            if (promoData.oneTimeUse) {
                const usageQuery = query(
                    collection(db, 'promoUsage'),
                    where('userId', '==', userId),
                    where('promoCode', '==', promoCode.toUpperCase())
                );
                const usageSnapshot = await getDocs(usageQuery);
                
                if (!usageSnapshot.empty) {
                    setError('You have already used this promo code');
                    return;
                }
            }

            // Calculate discount
            let discountAmount;
            if (promoData.discountType === 'percentage') {
                discountAmount = (bookingAmount * promoData.discountValue) / 100;
                if (promoData.maxDiscount) {
                    discountAmount = Math.min(discountAmount, promoData.maxDiscount);
                }
            } else {
                discountAmount = promoData.discountValue;
            }

            const promoDetails = {
                code: promoCode.toUpperCase(),
                discountAmount,
                originalAmount: bookingAmount,
                finalAmount: bookingAmount - discountAmount,
                type: promoData.discountType,
                value: promoData.discountValue
            };

            setAppliedPromo(promoDetails);
            onApplyPromo(promoDetails);

        } catch (error) {
            console.error('Error validating promo code:', error);
            setError('Error validating promo code');
        } finally {
            setLoading(false);
        }
    };

    const removePromoCode = () => {
        setPromoCode('');
        setAppliedPromo(null);
        onApplyPromo(null);
    };

    return (
        <div className="space-y-4">
            {!appliedPromo ? (
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={validatePromoCode}
                        disabled={loading || !promoCode}
                        className={`px-4 py-2 rounded-lg ${
                            loading || !promoCode
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        {loading ? 'Validating...' : 'Apply'}
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                    <div>
                        <p className="font-semibold text-green-800">
                            {appliedPromo.code} applied!
                        </p>
                        <p className="text-sm text-green-600">
                            You saved ${appliedPromo.discountAmount.toFixed(2)}
                        </p>
                    </div>
                    <button
                        onClick={removePromoCode}
                        className="text-red-500 hover:text-red-700"
                    >
                        Remove
                    </button>
                </div>
            )}

            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Available Promos Section */}
            <div className="mt-6">
                <h3 className="font-semibold mb-3">Available Promotions</h3>
                <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">FIRSTBOOK</p>
                                <p className="text-sm text-gray-600">50% off your first booking (up to $50)</p>
                                <p className="text-xs text-gray-500 mt-1">Valid until Dec 31, 2024</p>
                            </div>
                            <button
                                onClick={() => setPromoCode('FIRSTBOOK')}
                                className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                    <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">WEEKEND25</p>
                                <p className="text-sm text-gray-600">25% off weekend bookings</p>
                                <p className="text-xs text-gray-500 mt-1">Valid for weekend bookings only</p>
                            </div>
                            <button
                                onClick={() => setPromoCode('WEEKEND25')}
                                className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoCode; 