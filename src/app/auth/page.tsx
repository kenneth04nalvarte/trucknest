"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import Image from "next/image";

const roles = [
  { label: "Trucker", value: "trucker" },
  { label: "Property Owner", value: "property-owner" },
];

export default function AuthPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [role, setRole] = useState(roles[0].value);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.push("/dashboard");
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await signUp(email, password, role);
        router.push(`/onboarding/${role}`);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        {/* Logo or App Name */}
        <div className="mb-6 flex flex-col items-center">
          <Image src="/logo.png" alt="TruckNest Logo" width={48} height={48} className="mb-2" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">TruckNest</h1>
        </div>
        <div className="w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="flex gap-2">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      className={`flex-1 py-2 rounded-md border ${role === r.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                      onClick={() => setRole(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field w-full"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="input-field w-full pr-10"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {mode === "signup" && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field w-full"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (mode === "signin" ? "Signing in..." : "Signing up...") : (mode === "signin" ? "Sign In" : "Sign Up")}
            </button>
          </form>
          {/* Social login placeholders */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 w-full justify-center" disabled>
                <span className="text-lg">🔒</span> Google
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 w-full justify-center" disabled>
                <span className="text-lg">📘</span> Facebook
              </button>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{' '}
                <button className="text-blue-600 hover:underline" onClick={() => setMode("signup")}>Sign up</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="text-blue-600 hover:underline" onClick={() => setMode("signin")}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 text-gray-400 text-xs text-center">&copy; {new Date().getFullYear()} TruckNest. Not affiliated with Airbnb.</div>
    </div>
  );
} 