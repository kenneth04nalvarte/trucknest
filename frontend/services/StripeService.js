import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

class StripeService {
    static async createRefund(paymentIntentId, amount) {
        try {
            const response = await fetch('/api/refunds/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentIntentId,
                    amount: Math.round(amount * 100), // Convert to cents
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to process refund');
            }

            return await response.json();
        } catch (error) {
            console.error('Stripe refund error:', error);
            throw error;
        }
    }

    static async getPaymentIntent(paymentIntentId) {
        try {
            const response = await fetch(`/api/payments/${paymentIntentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch payment intent');
            }

            return await response.json();
        } catch (error) {
            console.error('Stripe payment intent error:', error);
            throw error;
        }
    }

    static async createPaymentIntent(amount, metadata = {}) {
        try {
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'usd',
                    metadata,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create payment intent');
            }

            return await response.json();
        } catch (error) {
            console.error('Stripe payment intent creation error:', error);
            throw error;
        }
    }

    static async getStripeInstance() {
        return await stripePromise;
    }
}

export default StripeService; 