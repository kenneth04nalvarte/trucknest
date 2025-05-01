'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      {pathname === '/signup' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Choose your role</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select how you want to use TruckNest
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  href="/signup/trucker"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign up as a Trucker
                </Link>

                <Link
                  href="/signup/property-owner"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Sign up as a Property Owner
                </Link>
              </div>

              <div className="text-sm text-center">
                <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {pathname !== '/signup' && children}
    </div>
  )
} 