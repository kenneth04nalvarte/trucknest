import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getAnalytics, logEvent } from 'firebase/analytics'
import { db } from '../config/firebase'

const AuthContext = createContext({})

// Error mapping for user-friendly messages
const ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Invalid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/email-already-in-use': 'An account already exists with this email',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastSignInTime, setLastSignInTime] = useState(null)
  const auth = getAuth()
  const analytics = typeof window !== 'undefined' ? getAnalytics() : null

  // Track authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            localStorage.setItem('userRole', userData.role)
            
            // Track successful sign-in
            if (analytics && !lastSignInTime) {
              logEvent(analytics, 'login', {
                method: 'email',
                role: userData.role
              })
              setLastSignInTime(new Date().getTime())
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          if (analytics) {
            logEvent(analytics, 'error', {
              error_code: 'firestore_fetch_failed',
              error_message: error.message
            })
          }
        }
      } else {
        localStorage.removeItem('userRole')
        setLastSignInTime(null)
      }
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [auth, analytics, lastSignInTime])

  const handleAuthError = (error) => {
    const errorMessage = ERROR_MESSAGES[error.code] || error.message
    if (analytics) {
      logEvent(analytics, 'auth_error', {
        error_code: error.code,
        error_message: errorMessage
      })
    }
    throw new Error(errorMessage)
  }

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      if (analytics) {
        logEvent(analytics, 'login_attempt', {
          method: 'email',
          success: true
        })
      }
      return result
    } catch (error) {
      if (analytics) {
        logEvent(analytics, 'login_attempt', {
          method: 'email',
          success: false,
          error_code: error.code
        })
      }
      handleAuthError(error)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      localStorage.removeItem('userRole')
      if (analytics) {
        logEvent(analytics, 'logout')
      }
    } catch (error) {
      handleAuthError(error)
    }
  }

  const sendPasswordResetEmail = async (email) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email)
      if (analytics) {
        logEvent(analytics, 'password_reset_email_sent')
      }
    } catch (error) {
      handleAuthError(error)
    }
  }

  const sendEmailVerification = async (user) => {
    try {
      await firebaseSendEmailVerification(user)
      if (analytics) {
        logEvent(analytics, 'verification_email_sent')
      }
    } catch (error) {
      handleAuthError(error)
    }
  }

  // Track user session time
  useEffect(() => {
    let sessionStartTime
    if (user && analytics) {
      sessionStartTime = new Date().getTime()
    }
    return () => {
      if (sessionStartTime && analytics) {
        const sessionDuration = Math.round((new Date().getTime() - sessionStartTime) / 1000)
        logEvent(analytics, 'session_end', {
          duration: sessionDuration
        })
      }
    }
  }, [user, analytics])

  const value = {
    user,
    loading,
    signIn,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    ERROR_MESSAGES
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 