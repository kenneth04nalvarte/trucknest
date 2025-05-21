import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ConnectWithStripeButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const response = await fetch('/api/create-stripe-account-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user!.uid,
        email: user!.email,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error connecting with Stripe');
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-2 rounded font-semibold"
    >
      {loading ? 'Connecting...' : 'Connect with Stripe'}
    </button>
  );
} 