'use client'

import Link from 'next/link'
import { usePathname, redirect } from 'next/navigation'

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  redirect('/auth')
  return null
}

export function LegacySignUpLayout() {
  redirect('/auth')
  return null
} 