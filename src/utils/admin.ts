import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

/**
 * Check if an email is an admin email by querying the database
 * @param email - Email address to check
 * @returns Promise that resolves to true if email is an admin
 */
export const isAdminEmail = async (email: string | null | undefined): Promise<boolean> => {
  if (!email) return false;
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Query the admins table to check if the email exists and is active
    const { data, error } = await supabase
      .from('admins')
      .select('id, status')
      .eq('email', normalizedEmail)
      .eq('status', 'active')
      .single();
    
    if (error) {
      // If no row found, error.code will be 'PGRST116'
      // This is expected for non-admin users, so we return false
      if (error.code === 'PGRST116') {
        return false;
      }
      // For other errors, log and return false
      console.error('Error checking admin status:', error);
      return false;
    }
    
    // If data exists and status is active, user is an admin
    return !!data && data.status === 'active';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * React hook to check if the current user is an admin
 * Uses database query to check admin status
 * @returns true if current user is an admin, false otherwise
 * Note: Returns false while loading to prevent unauthorized access
 */
export const useIsAdmin = (): boolean => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to finish loading before checking admin status
      if (authLoading) {
        return;
      }

      if (!user?.email) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const adminStatus = await isAdminEmail(user.email);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.email, authLoading]);

  // Return false while loading to prevent unauthorized access
  // This ensures we don't grant access before verification completes
  if (authLoading || isLoading) return false;
  
  return isAdmin;
};

