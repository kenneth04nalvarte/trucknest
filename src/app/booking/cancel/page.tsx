'use client'

import { useRouter } from 'next/navigation'

export default function BookingCancel() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Cancelled
              </h2>
              <p className="text-gray-600">
                Your payment was cancelled. You can try again or contact support if you need help.
              </p>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact our support team at{' '}
                <a
                  href="mailto:support@trucknest.com"
                  className="text-orange-600 hover:text-orange-500"
                >
                  support@trucknest.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 