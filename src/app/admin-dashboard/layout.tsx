import Link from 'next/link'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lightgray">
      <nav className="w-full bg-navy text-white shadow-md py-4 px-6 flex justify-between items-center">
        <Link href="/admin-dashboard" className="text-2xl font-bold tracking-tight">
          <span>Truck</span><span style={{ color: '#FFA500' }}>Nest</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/admin-dashboard" className="bg-white text-navy border border-navy px-4 py-2 rounded hover:bg-navy hover:text-white transition">Dashboard</Link>
          <button className="bg-orange hover:bg-orange-dark text-white px-4 py-2 rounded font-semibold" onClick={() => {/* TODO: sign out logic */}}>Sign Out</button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 pt-16">{children}</main>
    </div>
  )
} 