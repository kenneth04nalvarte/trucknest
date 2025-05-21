'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User
} from 'firebase/auth'
import { auth, db } from '@/app/config/firebase'
import { setDoc, doc } from 'firebase/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, role: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
  resetPassword: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    }, (error) => {
      if (mounted) {
        console.error('Auth state change error:', error)
        setError(error)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing in:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, role: string) => {
    try {
      setLoading(true)
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        verificationStatus: 'pending',
      })
    } catch (error) {
      console.error('Error signing up:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setError(null)
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Error resetting password:', error)
      setError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    resetPassword
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 