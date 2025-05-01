import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/schema';
import styles from '../../styles/Dashboard.module.css';

export default function PropertyOwnerDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      loadUserData();
    }
  }, [user, loading]);

  const loadUserData = async () => {
    try {
      const userData = await getUserProfile(user.uid);
      setProfile(userData);
      // Load properties and bookings
      // TODO: Implement these API calls
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Active Properties</h3>
          <p className={styles.statNumber}>{properties.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Active Bookings</h3>
          <p className={styles.statNumber}>
            {bookings.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Revenue</h3>
          <p className={styles.statNumber}>
            ${bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Verification Status</h3>
          <p className={styles.statNumber}>
            {profile?.verificationStatus || 'Pending'}
          </p>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        {bookings.slice(0, 5).map(booking => (
          <div key={booking.id} className={styles.activityItem}>
            <div className={styles.activityInfo}>
              <h4>{booking.truckerName}</h4>
              <p>{new Date(booking.startDate).toLocaleDateString()}</p>
            </div>
            <div className={styles.activityStatus}>
              <span className={styles[booking.status]}>{booking.status}</span>
              <p>${booking.totalAmount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className={styles.properties}>
      <div className={styles.header}>
        <h2>My Properties</h2>
        <button 
          onClick={() => router.push('/properties/new')}
          className={styles.addButton}
        >
          Add New Property
        </button>
      </div>

      <div className={styles.propertyGrid}>
        {properties.map(property => (
          <div key={property.id} className={styles.propertyCard}>
            <div className={styles.propertyImage}>
              <img src={property.photos[0] || '/placeholder.jpg'} alt={property.address} />
            </div>
            <div className={styles.propertyInfo}>
              <h3>{property.address}</h3>
              <p>{property.city}, {property.state}</p>
              <div className={styles.propertyStats}>
                <span>{property.spaceAvailable} sq ft</span>
                <span>{property.surfaceType}</span>
              </div>
              <div className={styles.propertyPricing}>
                <p>From ${property.pricing.hourly}/hour</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className={styles.bookings}>
      <h2>Bookings</h2>
      <div className={styles.bookingsList}>
        {bookings.map(booking => (
          <div key={booking.id} className={styles.bookingCard}>
            <div className={styles.bookingHeader}>
              <h3>{booking.truckerName}</h3>
              <span className={styles[booking.status]}>{booking.status}</span>
            </div>
            <div className={styles.bookingDetails}>
              <div>
                <p>Dates</p>
                <p>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Vehicle</p>
                <p>{booking.vehicleType}</p>
              </div>
              <div>
                <p>Amount</p>
                <p>${booking.totalAmount}</p>
              </div>
            </div>
            <div className={styles.bookingActions}>
              <button 
                onClick={() => handleBookingAction(booking.id, 'approve')}
                className={styles.approveButton}
              >
                Approve
              </button>
              <button 
                onClick={() => handleBookingAction(booking.id, 'reject')}
                className={styles.rejectButton}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.profile}>
          <div className={styles.profileImage}>
            <img src={user.photoURL || '/placeholder-avatar.jpg'} alt={profile.businessName} />
          </div>
          <h2>{profile.businessName}</h2>
          <p>{profile.email}</p>
        </div>
        
        <nav className={styles.nav}>
          <button
            className={`${styles.navButton} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'properties' ? styles.active : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'properties' && renderProperties()}
        {activeTab === 'bookings' && renderBookings()}
      </main>
    </div>
  );
} 