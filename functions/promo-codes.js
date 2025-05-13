const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Create a new promo code
exports.createPromoCode = functions.https.onCall(async (data, context) => {
    // Verify admin status
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can create promo codes');
    }

    const {
        code,
        discountType,
        discountValue,
        startDate,
        endDate,
        usageLimit,
        minBookingAmount,
        maxDiscount,
        oneTimeUse,
        description
    } = data;

    // Validate inputs
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Check if promo code already exists
        const existingPromo = await db.collection('promoCodes').doc(code).get();
        if (existingPromo.exists) {
            throw new functions.https.HttpsError('already-exists', 'Promo code already exists');
        }

        // Create new promo code
        await db.collection('promoCodes').doc(code).set({
            code,
            discountType,
            discountValue,
            startDate,
            endDate,
            usageLimit: usageLimit || null,
            minBookingAmount: minBookingAmount || null,
            maxDiscount: maxDiscount || null,
            oneTimeUse: oneTimeUse || false,
            description: description || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            usedCount: 0,
            isActive: true
        });

        return { success: true, message: 'Promo code created successfully' };
    } catch (error) {
        console.error('Error creating promo code:', error);
        throw new functions.https.HttpsError('internal', 'Error creating promo code');
    }
});

// Track promo code usage
exports.trackPromoUsage = functions.firestore
    .document('bookings/{bookingId}')
    .onCreate(async (snap, context) => {
        const booking = snap.data();
        
        if (!booking.promoCode) return;

        try {
            const promoRef = db.collection('promoCodes').doc(booking.promoCode);
            const promoDoc = await promoRef.get();

            if (!promoDoc.exists) return;

            // Update usage count
            await promoRef.update({
                usedCount: admin.firestore.FieldValue.increment(1)
            });

            // Record usage
            await db.collection('promoUsage').add({
                promoCode: booking.promoCode,
                userId: booking.userId,
                bookingId: context.params.bookingId,
                usedAt: admin.firestore.FieldValue.serverTimestamp(),
                discountAmount: booking.discountAmount
            });

        } catch (error) {
            console.error('Error tracking promo usage:', error);
        }
    });

// Get promo code analytics
exports.getPromoAnalytics = functions.https.onCall(async (data, context) => {
    // Verify admin status
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can view analytics');
    }

    try {
        const promoCode = data.promoCode;
        const promoRef = db.collection('promoCodes').doc(promoCode);
        const usageRef = db.collection('promoUsage').where('promoCode', '==', promoCode);

        const [promoDoc, usageSnapshot] = await Promise.all([
            promoRef.get(),
            usageRef.get()
        ]);

        if (!promoDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Promo code not found');
        }

        const promoData = promoDoc.data();
        const usageData = usageSnapshot.docs.map(doc => doc.data());

        // Calculate analytics
        const totalUsage = usageData.length;
        const totalDiscount = usageData.reduce((sum, usage) => sum + (usage.discountAmount || 0), 0);
        const uniqueUsers = new Set(usageData.map(usage => usage.userId)).size;

        return {
            promoDetails: promoData,
            analytics: {
                totalUsage,
                totalDiscount,
                uniqueUsers,
                usageHistory: usageData
            }
        };
    } catch (error) {
        console.error('Error getting promo analytics:', error);
        throw new functions.https.HttpsError('internal', 'Error getting promo analytics');
    }
});

// Deactivate expired promo codes
exports.deactivateExpiredPromos = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
    try {
        const now = admin.firestore.Timestamp.now();
        const promosRef = db.collection('promoCodes')
            .where('isActive', '==', true)
            .where('endDate', '<=', now);

        const snapshot = await promosRef.get();
        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isActive: false });
        });

        await batch.commit();

        return null;
    } catch (error) {
        console.error('Error deactivating expired promos:', error);
        return null;
    }
}); 