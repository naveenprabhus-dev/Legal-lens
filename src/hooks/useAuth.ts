import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
  syncUserProfile,
} from '../services/firebase/auth';
import { testFirestoreConnection } from '../services/firebase/config';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  useEffect(() => {
    // Check Firestore connectivity on initial boot
    testFirestoreConnection();

    const unsubscribe = subscribeToAuthState(async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
        } catch (err) {
          console.warn('Profile synchronization note:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
      return loggedUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      // Suppress popup closed by user noise
      if (!msg.includes('auth/popup-closed-by-user')) {
        setError(msg);
      }
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  return {
    user,
    loading,
    error,
    isSigningIn,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };
}
