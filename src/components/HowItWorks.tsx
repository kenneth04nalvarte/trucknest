'use client'

import Link from 'next/link'

const steps = [
  {
    title: 'For Property Members',
    icon: '🏡',
    items: [
      {
        title: 'Sign Up (Free)',
        description: 'Create a free account and list your land for truck parking.',
      },
      {
        title: 'Add Your Location',
        description: 'Click "Become a Property Member," set up your listing, and watch our quick video guide if needed.',
      },
      {
        title: 'Accept Bookings',
        description: 'Get instant email and text alerts when truckers book your space.',
      },
    ],
  },
  {
    title: 'For Truckers',
    icon: '🚛',
    items: [
      {
        title: 'Create Your Profile',
        description: 'Sign up free and add your truck, trailer, and company info.',
      },
      {
        title: 'Find & Book Parking',
        description: 'Reserve hourly, daily, weekly, or monthly spots wherever you need.',
      },
      {
        title: 'Park and Go',
        description: 'Message your Property Member for help. For support, visit our Contact page.',
      },
    ],
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-lightgray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-navy mb-12">
          How TruckNest Works
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          {steps.map((step) => (
            <div key={step.title} className="bg-white rounded-lg shadow p-8">
              <h3 className="text-2xl font-semibold text-navy mb-6 flex items-center gap-2">
                {step.icon} {step.title}
              </h3>
              <ol className="space-y-6">
                {step.items.map((item, index) => (
                  <li key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-navy mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/auth?mode=signup"
            className="inline-block bg-orange hover:bg-orange-dark text-white px-6 py-3 rounded-md text-lg font-semibold shadow transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </div>
    </section>
  )
} 