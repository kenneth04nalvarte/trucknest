import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../lib/schema';
import styles from '../../styles/Dashboard.module.css';

export default function TruckerDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
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
      // Load bookings and favorites
      // TODO: Implement these API calls
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Active Bookings</h3>
          <p className={styles.statNumber}>
            {bookings.filter(b => b.status === 'active').length}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Spent</h3>
          <p className={styles.statNumber}>
            ${bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Favorite Spots</h3>
          <p className={styles.statNumber}>{favorites.length}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Verification Status</h3>
          <p className={styles.statNumber}>
            {profile?.verificationStatus || 'Pending'}
          </p>
        </div>
      </div>

      <div className={styles.vehicleInfo}>
        <h2>Vehicle Information</h2>
        <div className={styles.vehicleDetails}>
          <div>
            <h4>Type</h4>
            <p>{profile?.vehicle?.type}</p>
          </div>
          <div>
            <h4>Dimensions</h4>
            <p>
              {profile?.vehicle?.dimensions?.length}' x {profile?.vehicle?.dimensions?.width}' x {profile?.vehicle?.dimensions?.height}'
            </p>
          </div>
          <div>
            <h4>License Plate</h4>
            <p>{profile?.vehicle?.licensePlate}</p>
          </div>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Bookings</h2>
        {bookings.slice(0, 5).map(booking => (
          <div key={booking.id} className={styles.activityItem}>
            <div className={styles.activityInfo}>
              <h4>{booking.propertyAddress}</h4>
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

  const renderBookings = () => (
    <div className={styles.bookings}>
      <h2>My Bookings</h2>
      <div className={styles.bookingsList}>
        {bookings.map(booking => (
          <div key={booking.id} className={styles.bookingCard}>
            <div className={styles.bookingHeader}>
              <h3>{booking.propertyAddress}</h3>
              <span className={styles[booking.status]}>{booking.status}</span>
            </div>
            <div className={styles.bookingDetails}>
              <div>
                <p>Dates</p>
                <p>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Duration</p>
                <p>{booking.duration}</p>
              </div>
              <div>
                <p>Amount</p>
                <p>${booking.totalAmount}</p>
              </div>
            </div>
            {booking.status === 'active' && (
              <div className={styles.bookingActions}>
                <button 
                  onClick={() => handleBookingAction(booking.id, 'extend')}
                  className={styles.extendButton}
                >
                  Extend Stay
                </button>
                <button 
                  onClick={() => handleBookingAction(booking.id, 'cancel')}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className={styles.favorites}>
      <h2>Favorite Spots</h2>
      <div className={styles.propertyGrid}>
        {favorites.map(property => (
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
              <button 
                onClick={() => router.push(`/properties/${property.id}`)}
                className={styles.bookButton}
              >
                Book Now
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
            <img src={user.photoURL || '/placeholder-avatar.jpg'} alt={`${profile.firstName} ${profile.lastName}`} />
          </div>
          <h2>{profile.firstName} {profile.lastName}</h2>
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
            className={`${styles.navButton} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            My Bookings
          </button>
          <button
            className={`${styles.navButton} ${activeTab === 'favorites' ? styles.active : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'favorites' && renderFavorites()}
      </main>
    </div>
  );
} 