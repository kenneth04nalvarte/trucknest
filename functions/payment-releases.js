const functions = require('firebase-functions');
const PaymentService = require('../backend/services/PaymentService');
const admin = require('firebase-admin');

// Process scheduled payment releases every hour
exports.processScheduledReleases = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
        try {
            const result = await PaymentService.checkAndProcessScheduledReleases();
            console.log(`Successfully processed ${result.releasedCount} scheduled releases`);
            return null;
        } catch (error) {
            console.error('Error processing scheduled releases:', error);
            return null;
        }
    });

// Handle payment status updates
exports.handlePaymentStatusUpdate = functions.firestore
    .document('paymentEscrow/{escrowId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();
        const escrowId = context.params.escrowId;

        try {
            // If payment is released, notify the landowner
            if (newData.status === 'released' && previousData.status !== 'released') {
                const landowner = await admin.firestore()
                    .collection('users')
                    .doc(newData.landownerId)
                    .get();

                if (landowner.exists) {
                    // Create notification
                    await admin.firestore().collection('notifications').add({
                        userId: newData.landownerId,
                        type: 'payment_release',
                        title: 'Payment Released',
                        message: `Payment of $${newData.amount} for booking #${newData.bookingId} has been released to your account.`,
                        amount: newData.amount,
                        bookingId: newData.bookingId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        read: false
                    });

                    // Send email notification if email service is configured
                    // TODO: Implement email notification
                }
            }

            // If a dispute is created, notify admin and hold the payment
            if (newData.disputeStatus === 'pending' && previousData.disputeStatus !== 'pending') {
                await admin.firestore().collection('adminNotifications').add({
                    type: 'payment_dispute',
                    escrowId,
                    bookingId: newData.bookingId,
                    amount: newData.amount,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'unread'
                });
            }

            return null;
        } catch (error) {
            console.error('Error handling payment status update:', error);
            return null;
        }
    });

// Handle booking completion and trigger payment release
exports.handleBookingCompletion = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();
        const bookingId = context.params.bookingId;

        // If booking is completed successfully
        if (newData.status === 'completed' && previousData.status !== 'completed') {
            try {
                // Find associated escrow payment
                const escrowSnapshot = await admin.firestore()
                    .collection('paymentEscrow')
                    .where('bookingId', '==', bookingId)
                    .where('released', '==', false)
                    .get();

                if (!escrowSnapshot.empty) {
                    const escrowDoc = escrowSnapshot.docs[0];
                    const escrowData = escrowDoc.data();

                    // If no disputes and holding period has passed, release payment
                    if (escrowData.disputeStatus === 'none') {
                        const holdingPeriodEnd = new Date(escrowData.createdAt);
                        holdingPeriodEnd.setDate(holdingPeriodEnd.getDate() + PaymentService.ESCROW_HOLD_DAYS);

                        if (new Date() >= holdingPeriodEnd) {
                            await PaymentService.releasePayment(escrowDoc.id);
                        }
                    }
                }

                return null;
            } catch (error) {
                console.error('Error handling booking completion:', error);
                return null;
            }
        }

        return null;
    }); 