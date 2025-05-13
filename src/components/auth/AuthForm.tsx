"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"

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
        const role = userData?.role
        if (role === "trucker") {
          router.push("/trucker-dashboard")
        } else if (role === "property-owner" || role === "landmember") {
          router.push("/landowner-dashboard")
        } else {
          router.push("/dashboard") // fallback
        }
      } else {
        // For sign-up, keep your existing logic or onboarding
        router.push("/onboarding/trucker") // Change as needed
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
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
          className="input input-bordered w-full"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="input input-bordered w-full"
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
            className="input input-bordered w-full"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      )}
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="btn btn-primary w-full mt-2"
        disabled={loading}
      >
        {loading ? (mode === "signin" ? "Signing in..." : "Signing up...") : (mode === "signin" ? "Sign In" : "Sign Up")}
      </button>
    </form>
  )
} 