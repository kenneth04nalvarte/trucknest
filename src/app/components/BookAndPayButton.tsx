import React, { useState } from 'react'

interface BookAndPayButtonProps {
  propertyId: string
  price: number
  onSuccess?: () => void
}

const BookAndPayButton: React.FC<BookAndPayButtonProps> = ({ propertyId, price, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBookAndPay = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId, price }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      window.location.href = data.url
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleBookAndPay}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
      >
        {loading ? 'Processing...' : 'Book & Pay'}
      </button>
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </div>
  )
}

export default BookAndPayButton 