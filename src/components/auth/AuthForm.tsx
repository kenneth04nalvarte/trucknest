"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { useAuth } from "@/context/AuthContext"

interface AuthFormProps {
  mode: "signin" | "signup"
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (!email || !password || (mode === "signup" && !confirmPassword)) {
        setError("Please fill in all fields.")
        setLoading(false)
        return
      }
      if (mode === "signup" && password !== confirmPassword) {
        setError("Passwords do not match.")
        setLoading(false)
        return
      }
      if (mode === "signin") {
        // Sign in with Firebase Auth
        const auth = getAuth()
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        // Fetch user role from Firestore
        const db = getFirestore()
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()
        let role = userData?.role
        if (typeof role === 'string') role = role.toLowerCase()
        console.log('User role at sign-in:', role)
        
        // Wait for auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Consistent role check
        if (["truckmember", "truck_member"].includes(role)) {
          await router.push("/trucker-dashboard")
        } else if (["landmember", "land_member"].includes(role)) {
          await router.push("/landmember-dashboard")
        } else {
          console.error('Unknown role:', role)
          setError('Invalid user role. Please contact support.')
        }
      } else {
        // For sign-up, always go to role selection
        await router.push("/auth?mode=signup")
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is being processed
  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-xl shadow text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold text-center mb-2">
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </h2>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      {mode === "signup" && (
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      )}
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="w-full mt-4 px-4 py-2 bg-orange text-white rounded-md hover:bg-orange-dark focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? (mode === "signin" ? "Signing in..." : "Signing up...") : (mode === "signin" ? "Sign In" : "Sign Up")}
      </button>
    </form>
  )
} 