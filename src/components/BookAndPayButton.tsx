import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BookAndPayButtonProps {
  amount: number;
  landMemberStripeAccountId: string;
  propertyId: string;
  truckMemberEmail: string;
}

export default function BookAndPayButton({
  amount,
  landMemberStripeAccountId,
  propertyId,
  truckMemberEmail,
}: BookAndPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleBookAndPay = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          landMemberStripeAccountId,
          propertyId,
          truckMemberEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during payment');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleBookAndPay}
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : 'Book & Pay'}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
} 