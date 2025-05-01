import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/SignupForms.module.css';

export default function VerifyEmail() {
  const router = useRouter();
  const { user, sendEmailVerification, signOut } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(true);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    // Load verification attempts from localStorage
    const attempts = parseInt(localStorage.getItem('verificationAttempts') || '0');
    setVerificationAttempts(attempts);

    if (user.emailVerified) {
      // Clear verification attempts on success
      localStorage.removeItem('verificationAttempts');
      router.push('/dashboard');
    }

    // Check email verification status every 5 seconds
    const interval = setInterval(async () => {
      try {
        await user.reload();
        if (user.emailVerified) {
          localStorage.removeItem('verificationAttempts');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking email verification status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, router]);

  useEffect(() => {
    let timer;
    if (!canResend && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown, canResend]);

  // Show support form after 3 verification attempts
  useEffect(() => {
    if (verificationAttempts >= 3) {
      setShowSupport(true);
    }
  }, [verificationAttempts]);

  const handleResendVerification = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError('');
    setMessage('');

    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
      setCanResend(false);
      setCountdown(60);
      
      // Increment verification attempts
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);
      localStorage.setItem('verificationAttempts', newAttempts.toString());
    } catch (error) {
      setError(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      setError('Failed to sign out');
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supportMessage = formData.get('supportMessage');
    
    try {
      // Here you would typically send this to your support endpoint
      console.log('Support message:', supportMessage);
      setMessage('Support request sent. We will contact you shortly.');
    } catch (error) {
      setError('Failed to send support request. Please try again.');
    }
  };

  if (!user) {
    return null; // Will redirect to sign in
  }

  return (
    <div className={styles.container}>
      <div className={styles.verificationBox}>
        <h1>Verify Your Email</h1>
        <p>
          We've sent a verification email to <strong>{user.email}</strong>.
          Please check your inbox and spam folder, then click the verification link.
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}

        <div className={styles.buttonGroup}>
          <button
            onClick={handleResendVerification}
            disabled={!canResend || isResending}
            className={styles.primaryButton}
          >
            {isResending 
              ? 'Sending...' 
              : canResend 
                ? 'Resend Verification Email' 
                : `Resend available in ${countdown}s`}
          </button>

          <button
            onClick={handleSignOut}
            className={styles.secondaryButton}
          >
            Sign Out
          </button>
        </div>

        {showSupport && (
          <div className={styles.supportSection}>
            <h2>Need Help?</h2>
            <p>If you're having trouble verifying your email, please let us know:</p>
            <form onSubmit={handleSupportSubmit} className={styles.supportForm}>
              <textarea
                name="supportMessage"
                placeholder="Describe the issue you're experiencing..."
                rows={4}
                className={styles.supportInput}
              />
              <button type="submit" className={styles.primaryButton}>
                Send Support Request
              </button>
            </form>
          </div>
        )}

        <div className={styles.note}>
          <h3>Troubleshooting Tips:</h3>
          <ul>
            <li>Check your spam/junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Add our email domain to your safe senders list</li>
            <li>Try using a different browser or device</li>
          </ul>
          <p>
            After clicking the verification link in your email,
            this page will automatically redirect you to the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
} 