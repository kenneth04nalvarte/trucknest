import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-8">Welcome to TruckNest Parking App</h1>
      <div className="flex gap-4">
        <Link href="/auth?mode=signin" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Sign In</Link>
        <Link href="/auth?mode=signup" className="px-6 py-3 bg-orange text-white rounded hover:bg-orange-dark font-semibold">Sign Up</Link>
      </div>
    </main>
  )
} 