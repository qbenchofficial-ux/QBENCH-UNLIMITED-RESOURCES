import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, verifyAdminProfile } from '../lib/supabase';
import type { AdminProfile } from '../types/project';

const LOCAL_ADMIN_SESSION_KEY = 'qbench_cms_admin_session_v1';

export interface UseAuthResult {
  adminProfile: AdminProfile | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthResult {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    let mounted = true;

    async function checkSession() {
      if (!isSupabaseConfigured) {
        try {
          const saved = localStorage.getItem(LOCAL_ADMIN_SESSION_KEY);
          if (saved && mounted) {
            setAdminProfile(JSON.parse(saved));
          }
        } catch {
          // Ignore
        }
        if (mounted) setLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setAdminProfile(null);
            setLoading(false);
          }
          return;
        }

        const check = await verifyAdminProfile(session.user.id, session.user.email);
        if (!check.isAdmin || !check.profile) {
          await supabase.auth.signOut();
          if (mounted) {
            setAdminProfile(null);
            setAuthError(
              check.error ||
                'Access denied. Only authorized admins (role = "admin") can access QBENCH CMS.'
            );
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setAdminProfile(check.profile);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setAdminProfile(null);
          setLoading(false);
          setAuthError(
            err instanceof Error ? err.message : 'Failed to verify admin session.'
          );
        }
      }
    }

    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        setAdminProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
        setAuthError('Email and password are required.');
        return false;
      }

      if (!isSupabaseConfigured) {
        const localProfile: AdminProfile = {
          id: 'local-admin-id',
          user_id: 'local-admin-user-id',
          email: cleanEmail,
          role: 'admin',
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, JSON.stringify(localProfile));
        setAdminProfile(localProfile);
        return true;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) {
        setAuthError(error?.message || 'Invalid email or password.');
        return false;
      }

      const check = await verifyAdminProfile(data.user.id, data.user.email);
      if (!check.isAdmin || !check.profile) {
        await supabase.auth.signOut();
        setAdminProfile(null);
        setAuthError(
          check.error ||
            'Access denied. Your account does not have an authorized admin profile (role = "admin").'
        );
        return false;
      }

      setAdminProfile(check.profile);
      return true;
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication error.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAdminProfile(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return {
    adminProfile,
    loading,
    authError,
    signIn,
    signOut,
    clearError,
  };
}
