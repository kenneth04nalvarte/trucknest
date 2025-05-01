import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from './context/AuthContext'
import { FirebaseApp } from 'firebase/app'
import { MonitoringProvider } from '../context/MonitoringContext'
import { getFirebaseApp } from '../config/firebase'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TruckNest Parking App',
  description: 'Find and book parking spots for your truck',
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const app = getFirebaseApp();

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MonitoringProvider app={app}>
            {children}
          </MonitoringProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 