import { supabase } from './supabase';
import type { User, AuthError } from '@supabase/supabase-js';

// Get Session type from Supabase auth response
export type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return {
      user: authData.user,
      session: authData.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    // Handle "Remember me" - set session persistence
    if (data.rememberMe) {
      // Supabase handles this automatically, but we can set it explicitly
      await supabase.auth.setSession({
        access_token: authData.session!.access_token,
        refresh_token: authData.session!.refresh_token,
      });
    }

    return {
      user: authData.user,
      session: authData.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

/**
 * Update user password (for password reset flow)
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    return {
      session: data.session,
      error,
    };
  } catch (error) {
    return {
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Get user-friendly error message from auth error
 */
export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return '';

  // Map common Supabase auth errors to user-friendly messages
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please check your email and confirm your account before signing in.',
    'User already registered': 'An account with this email already exists. Please sign in instead.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Email rate limit exceeded': 'Too many requests. Please try again later.',
    'For security purposes, you can only request this once every 60 seconds': 'Please wait a minute before requesting another password reset.',
  };

  return errorMessages[error.message] || error.message || 'An error occurred. Please try again.';
}

