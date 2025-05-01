import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import styles from '../styles/Signup.module.css';

export default function Signup() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    // If user is not logged in, redirect to home page
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    router.push(`/signup/${role}`);
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to TruckNest!</h1>
      <p className={styles.subtitle}>Please select your role to continue</p>
      
      <div className={styles.roleContainer}>
        <div 
          className={styles.roleCard}
          onClick={() => handleRoleSelection('property-owner')}
        >
          <div className={styles.roleIcon}>🏢</div>
          <h2>Property Owner</h2>
          <p>I want to list my property for truck parking</p>
          <ul>
            <li>List your available spaces</li>
            <li>Set your own rates</li>
            <li>Earn passive income</li>
          </ul>
        </div>

        <div 
          className={styles.roleCard}
          onClick={() => handleRoleSelection('trucker')}
        >
          <div className={styles.roleIcon}>🚛</div>
          <h2>Trucker</h2>
          <p>I'm looking for parking spaces</p>
          <ul>
            <li>Find safe parking spots</li>
            <li>Easy booking process</li>
            <li>24/7 support</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 