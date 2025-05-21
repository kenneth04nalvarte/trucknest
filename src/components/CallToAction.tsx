'use client'

import Link from 'next/link'

export default function CallToAction() {
  return (
    <section className="py-16 bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of truckers and property owners who are already using TruckNest to find and provide safe, convenient parking solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=signup&role=truckmember"
              className="bg-orange hover:bg-orange-dark text-white px-8 py-3 rounded-md text-lg font-semibold shadow transition-colors"
            >
              Sign Up as Trucker
            </Link>
            <Link
              href="/auth?mode=signup&role=landmember"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md text-lg font-semibold shadow transition-colors"
            >
              List Your Space
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
} 