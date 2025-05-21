"use client";

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'
import { useState } from 'react'
import { auth, db } from '@/config/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

function AuthPageContent() {
  const searchParams = useSearchParams()
  const modeParam = searchParams?.get('mode')
  const mode = modeParam === 'signup' ? 'signup' : 'signin'
  const role = searchParams?.get('role')

  const router = useRouter()
  const [welcomeMessage, setWelcomeMessage] = useState('')

  if (mode === 'signup' && !role) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-lightgray">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6 text-navy">Sign Up As</h1>
          <div className="flex flex-col gap-4">
            <button
              className="bg-orange hover:bg-orange-dark text-white px-6 py-3 rounded font-semibold shadow transition"
              onClick={() => router.push('/auth?mode=signup&role=truckmember')}
            >
              Truck Member
            </button>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold shadow transition"
              onClick={() => router.push('/auth?mode=signup&role=landmember')}
            >
              Land Member
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'signup' && role === 'landmember') {
    return <LandMemberSignUpForm setWelcomeMessage={setWelcomeMessage} />
  }
  if (mode === 'signup' && role === 'truckmember') {
    return <TruckMemberSignUpForm setWelcomeMessage={setWelcomeMessage} />
  }

  if (welcomeMessage) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-lightgray">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-6 text-navy">{welcomeMessage}</h1>
        </div>
      </div>
    )
  }

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

function LandMemberSignUpForm({ setWelcomeMessage }: { setWelcomeMessage: (msg: string) => void }) {
  const [form, setForm] = useState({
    fullName: '',
    businessName: '',
    businessAddress: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      // 2. Store extra info in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName: form.fullName,
        businessName: form.businessName,
        businessAddress: form.businessAddress,
        phone: form.phone,
        email: form.email,
        role: 'landmember',
        createdAt: new Date(),
      });
      // 3. Redirect to dashboard
      router.push('/landmember-dashboard');
      setWelcomeMessage('Welcome to the Land Member Dashboard!');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-lightgray">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-navy">Land Member Sign Up</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input className="input-field w-full" placeholder="Full Name" value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))} />
          <input className="input-field w-full" placeholder="Business Name" value={form.businessName} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} />
          <input className="input-field w-full" placeholder="Business Address" value={form.businessAddress} onChange={e => setForm(f => ({...f, businessAddress: e.target.value}))} />
          <input className="input-field w-full" placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          <input className="input-field w-full" placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          <input className="input-field w-full" type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold w-full mt-4" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  );
}

function TruckMemberSignUpForm({ setWelcomeMessage }: { setWelcomeMessage: (msg: string) => void }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    truckMake: '',
    truckModel: '',
    truckYear: '',
    licensePlate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      // 2. Store extra info in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName: form.fullName,
        email: form.email,
        truckMake: form.truckMake,
        truckModel: form.truckModel,
        truckYear: form.truckYear,
        licensePlate: form.licensePlate,
        role: 'truckmember',
        createdAt: new Date(),
      });
      // 3. Redirect to dashboard
      router.push('/trucker-dashboard');
      setWelcomeMessage('Welcome to the Trucker Dashboard!');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-lightgray">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-navy">Truck Member Sign Up</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input className="input-field w-full" placeholder="Full Name" value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))} />
          <input className="input-field w-full" placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          <input className="input-field w-full" type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
          <input className="input-field w-full" placeholder="Truck Make" value={form.truckMake} onChange={e => setForm(f => ({...f, truckMake: e.target.value}))} />
          <input className="input-field w-full" placeholder="Truck Model" value={form.truckModel} onChange={e => setForm(f => ({...f, truckModel: e.target.value}))} />
          <input className="input-field w-full" placeholder="Truck Year" value={form.truckYear} onChange={e => setForm(f => ({...f, truckYear: e.target.value}))} />
          <input className="input-field w-full" placeholder="License Plate Number" value={form.licensePlate} onChange={e => setForm(f => ({...f, licensePlate: e.target.value}))} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="bg-orange hover:bg-orange-dark text-white px-6 py-2 rounded font-semibold w-full mt-4" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  );
} 