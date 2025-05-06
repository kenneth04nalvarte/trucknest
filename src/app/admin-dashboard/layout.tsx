'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/config/firebase'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-lightgray">
      <nav className="w-full bg-navy text-white shadow-md py-4 px-6 flex justify-between items-center">
        <Link href="/admin-dashboard" className="text-2xl font-bold tracking-tight">
          <span>Truck</span><span style={{ color: '#FFA500' }}>Nest</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/admin-dashboard" className="bg-white text-navy border border-navy px-4 py-2 rounded hover:bg-navy hover:text-white transition">Dashboard</Link>
          <button 
            className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold" 
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 pt-16">{children}</main>
    </div>
  )
} 