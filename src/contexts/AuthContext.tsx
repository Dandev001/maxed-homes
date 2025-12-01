import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getSession, refreshSession, type Session } from '../lib/auth';
import { logDebug } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  const isInitializedRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current session (this is fast, reads from localStorage)
      const currentSession = await getSession();
      setSession(currentSession);
      sessionRef.current = currentSession;
      
      // Use user from session to avoid network call during initialization
      // The session already contains the user object
      if (currentSession?.user) {
        setUser(currentSession.user);
      } else {
        setUser(null);
      }
      
      // Optionally verify user in background (non-blocking)
      // This helps catch cases where the session is invalid
      if (currentSession) {
        getCurrentUser().then((user) => {
          // Only update if we still have a session (user might have signed out)
          if (sessionRef.current) {
            setUser(user);
          }
        }).catch((error) => {
          // If verification fails, the session might be invalid
          logDebug('User verification failed', { error }, 'AuthContext');
          // Don't clear session here - let onAuthStateChange handle it
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setSession(null);
      sessionRef.current = null;
    } finally {
      setLoading(false);
      isInitializedRef.current = true;
    }
  }, []);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    try {
      const { session: newSession, error } = await refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        // If refresh fails, try to get current session
        const currentSession = await getSession();
        setSession(currentSession);
        sessionRef.current = currentSession;
        
        if (currentSession?.user) {
          setUser(currentSession.user);
        } else {
          setUser(null);
          setSession(null);
          sessionRef.current = null;
        }
      } else {
        setSession(newSession);
        sessionRef.current = newSession;
        if (newSession?.user) {
          setUser(newSession.user);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
    }
  }, []);

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      sessionRef.current = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logDebug('Auth state changed', { event, email: newSession?.user?.email }, 'AuthContext');
      
      // Only process auth state changes after initial auth check is complete
      // This prevents the initial onAuthStateChange event from interfering with initialization
      if (isInitializedRef.current) {
        setSession(newSession);
        sessionRef.current = newSession;
        
        // Use user from session to avoid blocking network calls
        if (newSession?.user) {
          setUser(newSession.user);
        } else {
          setUser(null);
        }
      }
    });

    // Set up automatic token refresh (every 50 minutes)
    const refreshInterval = setInterval(() => {
      if (sessionRef.current) {
        refreshAuth();
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [initializeAuth, refreshAuth]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut: handleSignOut,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

