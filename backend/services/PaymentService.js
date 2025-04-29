const { db } = require('../firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

class PaymentService {
    static ESCROW_HOLD_DAYS = 5; // Maximum days to hold payment in escrow
    static MAX_RETRY_ATTEMPTS = 3;
    static PAYMENT_TRACKING_VERSION = '1.0';

    static async processBookingPayment(bookingId, amount, customerId, landownerId) {
        try {
            // Generate unique transaction ID
            const transactionId = this.generateTransactionId(bookingId);

            // Verify customer and landowner exist
            const [customerDoc, landownerDoc] = await Promise.all([
                db.collection('users').doc(customerId).get(),
                db.collection('users').doc(landownerId).get()
            ]);

            if (!customerDoc.exists || !landownerDoc.exists) {
                throw new Error('Invalid customer or landowner');
            }

            // Validate amount
            if (!this.isValidAmount(amount)) {
                throw new Error('Invalid payment amount');
            }

            // Create payment intent with additional security measures
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: 'usd',
                customer: customerId,
                metadata: {
                    bookingId,
                    landownerId,
                    type: 'parking_payment',
                    transactionId
                },
                statement_descriptor: 'TRUCKNEST PARKING',
                setup_future_usage: 'off_session',
                capture_method: 'manual' // Requires explicit capture
            });

            // Create detailed escrow record
            const escrowRef = await db.collection('paymentEscrow').add({
                bookingId,
                landownerId,
                customerId,
                amount,
                paymentIntentId: paymentIntent.id,
                transactionId,
                status: 'held',
                createdAt: new Date().toISOString(),
                scheduledReleaseDate: this.calculateReleaseDate(),
                released: false,
                releasedAt: null,
                disputeStatus: 'none',
                securityChecks: {
                    customerVerified: customerDoc.data().verified || false,
                    landownerVerified: landownerDoc.data().verified || false,
                    amountValidated: true,
                    riskLevel: await this.calculateRiskLevel(customerId, amount)
                },
                tracking: {
                    version: this.PAYMENT_TRACKING_VERSION,
                    ipAddress: null, // To be filled by the client
                    deviceInfo: null, // To be filled by the client
                    locationInfo: null, // To be filled by the client
                    attempts: 1,
                    lastAttempt: new Date().toISOString()
                },
                auditLog: [{
                    action: 'created',
                    timestamp: new Date().toISOString(),
                    details: 'Payment escrow created'
                }]
            });

            // Create initial payment tracking record
            await db.collection('paymentTracking').add({
                escrowId: escrowRef.id,
                transactionId,
                status: 'initiated',
                timeline: [{
                    status: 'initiated',
                    timestamp: new Date().toISOString(),
                    details: 'Payment process initiated'
                }],
                riskAssessment: {
                    score: await this.calculateRiskLevel(customerId, amount),
                    factors: ['amount', 'customer_history', 'location']
                },
                metadata: {
                    bookingId,
                    customerId,
                    landownerId,
                    amount
                }
            });

            return {
                escrowId: escrowRef.id,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                transactionId
            };
        } catch (error) {
            console.error('Error processing payment:', error);
            throw new Error('Payment processing failed');
        }
    }

    static async releasePayment(escrowId) {
        try {
            const escrowRef = db.collection('paymentEscrow').doc(escrowId);
            
            // Use transaction for atomic updates
            return await db.runTransaction(async (transaction) => {
                const escrow = await transaction.get(escrowRef);
                
                if (!escrow.exists) {
                    throw new Error('Escrow record not found');
                }

                const escrowData = escrow.data();
                
                // Additional security checks
                if (escrowData.released || 
                    escrowData.disputeStatus === 'pending' || 
                    escrowData.tracking.attempts >= this.MAX_RETRY_ATTEMPTS) {
                    throw new Error('Payment cannot be released');
                }

                // Verify holding period
                const holdingPeriodEnd = new Date(escrowData.createdAt);
                holdingPeriodEnd.setDate(holdingPeriodEnd.getDate() + this.ESCROW_HOLD_DAYS);
                if (new Date() < holdingPeriodEnd) {
                    throw new Error('Holding period not completed');
                }

                try {
                    // Capture the payment intent first
                    await stripe.paymentIntents.capture(escrowData.paymentIntentId);

                    // Transfer to landowner
                    const transfer = await stripe.transfers.create({
                        amount: escrowData.amount * 100,
                        currency: 'usd',
                        destination: escrowData.landowner_stripe_account_id,
                        transfer_group: escrowData.bookingId,
                        metadata: {
                            transactionId: escrowData.transactionId
                        }
                    });

                    // Update escrow record
                    transaction.update(escrowRef, {
                        status: 'released',
                        released: true,
                        releasedAt: new Date().toISOString(),
                        transferId: transfer.id,
                        'tracking.attempts': escrowData.tracking.attempts + 1,
                        'tracking.lastAttempt': new Date().toISOString(),
                        auditLog: [...escrowData.auditLog, {
                            action: 'released',
                            timestamp: new Date().toISOString(),
                            details: `Payment released. Transfer ID: ${transfer.id}`
                        }]
                    });

                    // Update payment tracking
                    const trackingRef = db.collection('paymentTracking')
                        .where('transactionId', '==', escrowData.transactionId)
                        .limit(1);
                    
                    const trackingDoc = await trackingRef.get();
                    if (!trackingDoc.empty) {
                        transaction.update(trackingDoc.docs[0].ref, {
                            status: 'completed',
                            timeline: admin.firestore.FieldValue.arrayUnion({
                                status: 'completed',
                                timestamp: new Date().toISOString(),
                                details: 'Payment successfully released to landowner'
                            })
                        });
                    }

                    // Create detailed transaction record
                    transaction.set(db.collection('transactions').doc(), {
                        type: 'payment_release',
                        escrowId,
                        transactionId: escrowData.transactionId,
                        bookingId: escrowData.bookingId,
                        landownerId: escrowData.landownerId,
                        customerId: escrowData.customerId,
                        amount: escrowData.amount,
                        transferId: transfer.id,
                        timestamp: new Date().toISOString(),
                        securityChecks: escrowData.securityChecks,
                        metadata: {
                            holdingPeriod: this.ESCROW_HOLD_DAYS,
                            releaseAttempts: escrowData.tracking.attempts + 1
                        }
                    });

                    return { success: true, transferId: transfer.id };
                } catch (error) {
                    // Log failed attempt
                    transaction.update(escrowRef, {
                        'tracking.attempts': escrowData.tracking.attempts + 1,
                        'tracking.lastAttempt': new Date().toISOString(),
                        'tracking.lastError': error.message,
                        auditLog: [...escrowData.auditLog, {
                            action: 'release_failed',
                            timestamp: new Date().toISOString(),
                            details: error.message
                        }]
                    });
                    throw error;
                }
            });
        } catch (error) {
            console.error('Error releasing payment:', error);
            throw new Error('Payment release failed');
        }
    }

    static async handleDispute(escrowId, disputeDetails) {
        try {
            const escrowRef = db.collection('paymentEscrow').doc(escrowId);
            
            return await db.runTransaction(async (transaction) => {
                const escrow = await transaction.get(escrowRef);

                if (!escrow.exists) {
                    throw new Error('Escrow record not found');
                }

                const escrowData = escrow.data();

                // Validate dispute eligibility
                if (escrowData.released || escrowData.disputeStatus !== 'none') {
                    throw new Error('Dispute cannot be created for this payment');
                }

                const disputeId = crypto.randomBytes(16).toString('hex');

                // Update escrow with dispute status
                transaction.update(escrowRef, {
                    disputeStatus: 'pending',
                    disputeId,
                    disputeDetails,
                    disputeCreatedAt: new Date().toISOString(),
                    auditLog: [...escrowData.auditLog, {
                        action: 'dispute_created',
                        timestamp: new Date().toISOString(),
                        details: 'Payment disputed'
                    }]
                });

                // Create comprehensive dispute record
                transaction.set(db.collection('disputes').doc(disputeId), {
                    escrowId,
                    disputeId,
                    bookingId: escrowData.bookingId,
                    landownerId: escrowData.landownerId,
                    customerId: escrowData.customerId,
                    amount: escrowData.amount,
                    details: disputeDetails,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    evidence: [],
                    resolution: null,
                    timeline: [{
                        status: 'created',
                        timestamp: new Date().toISOString(),
                        details: 'Dispute initiated'
                    }],
                    securityChecks: escrowData.securityChecks,
                    metadata: {
                        transactionId: escrowData.transactionId,
                        paymentIntentId: escrowData.paymentIntentId
                    }
                });

                // Update payment tracking
                const trackingRef = await db.collection('paymentTracking')
                    .where('transactionId', '==', escrowData.transactionId)
                    .limit(1)
                    .get();

                if (!trackingRef.empty) {
                    transaction.update(trackingRef.docs[0].ref, {
                        status: 'disputed',
                        timeline: admin.firestore.FieldValue.arrayUnion({
                            status: 'disputed',
                            timestamp: new Date().toISOString(),
                            details: 'Payment disputed by customer'
                        })
                    });
                }

                return { success: true, disputeId };
            });
        } catch (error) {
            console.error('Error handling dispute:', error);
            throw new Error('Dispute creation failed');
        }
    }

    // Helper methods
    static generateTransactionId(bookingId) {
        return `TXN-${bookingId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    static isValidAmount(amount) {
        return amount > 0 && amount <= 10000; // Example maximum amount
    }

    static async calculateRiskLevel(userId, amount) {
        // Implement risk scoring logic based on:
        // - User history
        // - Transaction amount
        // - Account age
        // - Previous disputes
        // Returns a risk score between 0-100
        return 0; // Placeholder
    }

    static calculateReleaseDate() {
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + this.ESCROW_HOLD_DAYS);
        return releaseDate.toISOString();
    }

    static async checkAndProcessScheduledReleases() {
        try {
            const now = new Date();
            const escrowRef = db.collection('paymentEscrow');
            
            // Find all unreleased payments that have passed their scheduled release date
            const snapshot = await escrowRef
                .where('released', '==', false)
                .where('scheduledReleaseDate', '<=', now.toISOString())
                .where('disputeStatus', '==', 'none')
                .get();

            const releases = [];
            snapshot.forEach(doc => {
                releases.push(this.releasePayment(doc.id));
            });

            await Promise.all(releases);
            return { success: true, releasedCount: releases.length };
        } catch (error) {
            console.error('Error processing scheduled releases:', error);
            throw new Error('Scheduled release processing failed');
        }
    }
}

module.exports = PaymentService; 