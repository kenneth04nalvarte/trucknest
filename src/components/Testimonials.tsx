'use client'

const testimonials = [
  {
    name: 'John Smith',
    role: 'Truck Driver',
    image: '/testimonials/john.jpg',
    quote:
      'TruckNest has made finding safe parking spots so much easier. The app is intuitive and the property owners are always responsive.',
    rating: 5,
  },
  {
    name: 'Sarah Johnson',
    role: 'Property Owner',
    image: '/testimonials/sarah.jpg',
    quote:
      'As a property owner, TruckNest has helped me monetize my empty lot while providing a valuable service to truckers. The platform is easy to use and the support team is fantastic.',
    rating: 5,
  },
  {
    name: 'Mike Wilson',
    role: 'Fleet Manager',
    image: '/testimonials/mike.jpg',
    quote:
      "Managing our fleet's parking needs has never been easier. TruckNest's platform is reliable and the booking process is seamless.",
    rating: 5,
  },
]

const placeholder = '/default-avatar.jpg'

export default function Testimonials() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-navy mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.image || placeholder}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = placeholder
                  }}
                />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-navy">
                    {testimonial.name}
                  </h3>
                  <p className="text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 