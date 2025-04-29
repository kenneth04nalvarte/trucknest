import Stripe from 'stripe';
import { auth } from '../../../firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization token' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await auth.verifyIdToken(token);

        // Verify admin status
        const adminUser = await auth.getUser(decodedToken.uid);
        if (!adminUser.customClaims?.admin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { paymentIntentId, amount } = req.body;

        if (!paymentIntentId || !amount) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Create refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(amount), // Amount should already be in cents
            reason: 'requested_by_customer',
        });

        return res.status(200).json(refund);
    } catch (error) {
        console.error('Refund creation error:', error);
        return res.status(500).json({ message: error.message });
    }
} 