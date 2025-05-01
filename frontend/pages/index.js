import { useAuth } from '../context/AuthContext'
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useState } from "react";
import { useRouter } from "next/router";
// For production, consider using @react-google-maps/api and a date picker library

export default function Home() {
  const { user, loading } = useAuth()
  const [address, setAddress] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [duration, setDuration] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>
  }

  function handleSignIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  function handleSignOut() {
    signOut(auth);
  }

  function handleSearch(e) {
    e.preventDefault();
    // Implement your search logic here
    alert('Search submitted!');
  }

  return (
    <div>
      {/* Nav Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        background: '#1F3A93',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '1px' }}>
          TruckNest
        </div>
        {/* Nav Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#" style={navLinkStyle}>Home</a>
          <a href="#how-it-works" style={navLinkStyle}>How It Works</a>
          <a href="#contact" style={navLinkStyle}>Contact</a>
          {user ? (
            <button onClick={handleSignOut} style={navButtonStyle}>Sign Out</button>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSignIn} style={navButtonStyle}>Sign In</button>
              <button onClick={() => router.push('/signup')} style={navButtonStyle}>Sign Up</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(rgba(31, 58, 147, 0.85), rgba(31, 58, 147, 0.85)), url("/images/hero.jpeg.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '60px 0 40px 0',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: 10 }}>Find Truck Parking Across America</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: 30 }}>Safe, easy, and reliable parking for truckers. List your land or find a spot now!</p>
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
          background: 'white',
          borderRadius: 12,
          padding: 16,
          maxWidth: 800,
          margin: '0 auto 30px auto',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
        }}>
          {/* Address Autocomplete */}
          <input
            type="text"
            placeholder="Enter address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            style={{ flex: 2, minWidth: 180, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
          />
          {/* Date Range */}
          <input
            type="date"
            value={dateRange.startDate}
            onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
            style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
            style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
          />
          {/* Duration */}
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
          >
            <option value="">Duration</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {/* Vehicle Type */}
          <select
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            required
          >
            <option value="">Vehicle Type</option>
            <option value="semi">Semi-Truck</option>
            <option value="box_truck">Box Truck</option>
            <option value="rv">RV/Motorhome</option>
            <option value="trailer">Trailer</option>
            <option value="container">Container</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" style={{
            background: '#FFA500',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '10px 24px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>Search</button>
        </form>
      </section>

      {/* Stats Section */}
      <section style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
        background: '#f8f8f8',
        padding: '40px 0'
      }}>
        <Stat number="3.6M" label="US Truckers" />
        <Stat number="40,000+" label="Truckers Without Safe Parking Daily" />
        <Stat number="1:11" label="Parking Spot to Driver Ratio" />
        <Stat number="21%" label="Truckers Reported Crime Last Year" />
      </section>

      {/* Google Map Section */}
      <section style={{ width: '100%', height: 400, margin: '0 auto' }}>
        {/* Replace with your Google Maps component or embed */}
        <iframe
          title="TruckNest Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0, borderRadius: 12 }}
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyCSY-0WgJnF4gtL23hbldUeiw_8P6NX08w&q=truck+parking+usa"
          allowFullScreen
        ></iframe>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>How TruckNest Works</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>🏡 For Property Owners:</h3>
            <ol>
              <li><b>1. Sign Up (Free)</b><br />Create a free account and list your land for truck parking.</li>
              <li style={{ marginTop: 10 }}><b>2. Add Your Location</b><br />Click "Become a Property Member," set up your listing, and watch our quick video guide if needed.</li>
              <li style={{ marginTop: 10 }}><b>3. Accept Bookings</b><br />Get instant email and text alerts when truckers book your space.</li>
            </ol>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 10 }}>🚛 For Truckers:</h3>
            <ol>
              <li><b>1. Create Your Profile</b><br />Sign up free and add your truck, trailer, and company info.</li>
              <li style={{ marginTop: 10 }}><b>2. Find & Book Parking</b><br />Reserve hourly, daily, weekly, or monthly spots wherever you need.</li>
              <li style={{ marginTop: 10 }}><b>3. Park and Go</b><br />Message your Property Member for help.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Contact Section (optional placeholder) */}
      <section id="contact" style={{ maxWidth: 900, margin: '40px auto', padding: 20, textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 16 }}>Contact</h2>
        <p>For support or inquiries, email <a href="mailto:support@trucknest.com" style={{ color: '#1F3A93', textDecoration: 'underline' }}>support@trucknest.com</a></p>
      </section>
    </div>
  )
}

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '1.1rem',
  transition: 'color 0.2s',
};

const navButtonStyle = {
  background: '#FFA500',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '8px 18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1.1rem',
};

// Stats component
function Stat({ number, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#1F3A93' }}>{number}</div>
      <div style={{ fontSize: '1.1rem', color: '#333', marginTop: 6 }}>{label}</div>
    </div>
  )
} 