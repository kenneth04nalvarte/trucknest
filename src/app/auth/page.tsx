"use client";

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

function AuthPageContent() {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode')
  const mode = modeParam === 'signup' ? 'signup' : 'signin'

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-lightgray to-navy/10 py-12 px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-4xl font-extrabold text-navy">Truck</span>
          <span className="text-4xl font-extrabold" style={{ color: '#FFA500' }}>Nest</span>
        </div>
        <span className="text-lg text-darkgray font-semibold tracking-wide">Parking App</span>
      </div>
      <div className="w-full max-w-md">
        <AuthForm mode={mode} />
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  )
} 