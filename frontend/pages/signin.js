import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/SignupForms.module.css';

export default function SignIn() {
  const router = useRouter();
  const { signIn, sendPasswordResetEmail, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  // Load remembered email if exists
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Handle account lockout
  useEffect(() => {
    if (loginAttempts >= 5) {
      setIsLocked(true);
      const endTime = new Date().getTime() + 5 * 60 * 1000; // 5 minutes
      setLockoutEndTime(endTime);
      localStorage.setItem('lockoutEndTime', endTime.toString());
    }
  }, [loginAttempts]);

  // Check and update lockout status
  useEffect(() => {
    const storedEndTime = localStorage.getItem('lockoutEndTime');
    if (storedEndTime) {
      const endTime = parseInt(storedEndTime);
      if (endTime > new Date().getTime()) {
        setIsLocked(true);
        setLockoutEndTime(endTime);
      } else {
        localStorage.removeItem('lockoutEndTime');
        setLoginAttempts(0);
      }
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    let timer;
    if (isLocked && lockoutEndTime) {
      timer = setInterval(() => {
        const now = new Date().getTime();
        if (now >= lockoutEndTime) {
          setIsLocked(false);
          setLoginAttempts(0);
          localStorage.removeItem('lockoutEndTime');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutEndTime]);

  // If user is already signed in, redirect to appropriate dashboard
  if (user) {
    if (user.emailVerified) {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'trucker') {
        router.push('/dashboard/trucker');
      } else if (userRole === 'property-owner') {
        router.push('/dashboard/property-owner');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/verify-email');
    }
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!showResetForm && !formData.password) newErrors.password = 'Password is required';
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: 'Email is required for password reset' });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(formData.email);
      setResetEmailSent(true);
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to send password reset email'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isLocked) return;

    setIsSubmitting(true);
    try {
      const { user } = await signIn(formData.email, formData.password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      if (!user.emailVerified) {
        router.push('/verify-email');
        return;
      }

      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('lockoutEndTime');

      // Get user role and redirect
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('userRole', userData.role);
        
        if (userData.role === 'trucker') {
          router.push('/dashboard/trucker');
        } else if (userData.role === 'property-owner') {
          router.push('/dashboard/property-owner');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      setErrors({
        submit: error.message || 'Failed to sign in'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return <span className={styles.error}>{errors[fieldName]}</span>;
    }
    return null;
  };

  const getRemainingLockoutTime = () => {
    if (!lockoutEndTime) return '';
    const remaining = Math.max(0, Math.ceil((lockoutEndTime - new Date().getTime()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (resetEmailSent) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <h2>Password Reset Email Sent</h2>
          <p>Please check your email for instructions to reset your password.</p>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              setShowResetForm(false);
              setResetEmailSent(false);
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>{showResetForm ? 'Reset Password' : 'Sign In'}</h1>
      
      {isLocked && (
        <div className={styles.lockoutMessage}>
          <p>Account temporarily locked due to too many failed attempts.</p>
          <p>Please try again in {getRemainingLockoutTime()}</p>
        </div>
      )}

      <form onSubmit={showResetForm ? handlePasswordReset : handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? styles.errorInput : ''}
              autoComplete="email"
            />
            {renderError('email')}
          </div>

          {!showResetForm && (
            <div className={styles.inputGroup}>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? styles.errorInput : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.showPasswordButton}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {renderError('password')}
            </div>
          )}

          {!showResetForm && (
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember my email
              </label>
            </div>
          )}

          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSubmitting || isLocked}
          >
            {isSubmitting 
              ? (showResetForm ? 'Sending...' : 'Signing In...') 
              : (showResetForm ? 'Send Reset Link' : 'Sign In')}
          </button>

          <div className={styles.links}>
            {showResetForm ? (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => setShowResetForm(false)}
              >
                Back to Sign In
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setShowResetForm(true)}
                >
                  Forgot Password?
                </button>
                <Link href="/signup" className={styles.link}>
                  Don't have an account? Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
} 