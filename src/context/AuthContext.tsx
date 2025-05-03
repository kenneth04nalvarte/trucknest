'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { CustomUser } from '@/types/user';

export interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  onAuthStateChange?: (user: CustomUser | null) => void;
  onError?: (error: Error) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children, onAuthStateChange, onError }: AuthProviderProps) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      try {
        const customUser = firebaseUser ? {
          ...firebaseUser,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          metadata: {
            creationTime: firebaseUser.metadata.creationTime,
            lastSignInTime: firebaseUser.metadata.lastSignInTime
          }
        } as CustomUser : null;

        setUser(customUser);
        onAuthStateChange?.(customUser);
      } catch (err) {
        const error = err as Error;
        console.error('Error processing auth state change:', error);
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [onAuthStateChange, onError]);

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      onAuthStateChange?.(null);
    } catch (err) {
      const error = err as Error;
      console.error('Error signing out:', error);
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        const customUser = {
          ...currentUser,
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime
          }
        } as CustomUser;
        setUser(customUser);
        onAuthStateChange?.(customUser);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error refreshing user:', error);
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 