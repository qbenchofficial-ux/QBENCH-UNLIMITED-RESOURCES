import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  supabase,
  ensureSupabaseConfig,
  verifyAdminProfile,
} from '../lib/supabase';
import type { AdminProfile } from '../types/project';

export interface UseAuthResult {
  user: User | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const resolveAdminFromUser = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setAdminProfile(null);
      return false;
    }

    setUser(currentUser);
    const check = await verifyAdminProfile(currentUser.id, currentUser.email);
    if (!check.isAdmin || !check.profile) {
      await supabase.auth.signOut();
      setUser(null);
      setAdminProfile(null);
      setAuthError(
        check.error ||
          'Access denied. Only authorized admins (role = "admin" in public.admin_profiles) can access the QBENCH Admin Dashboard.'
      );
      return false;
    }

    setAdminProfile(check.profile);
    return true;
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    let mounted = true;

    async function initAuth() {
      try {
        await ensureSupabaseConfig();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          if (mounted) {
            setUser(null);
            setAdminProfile(null);
            setAuthError(error.message);
            setLoading(false);
          }
          return;
        }

        if (!session?.user) {
          if (mounted) {
            setUser(null);
            setAdminProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          await resolveAdminFromUser(session.user);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setUser(null);
          setAdminProfile(null);
          setAuthError(
            err instanceof Error ? err.message : 'Failed to verify Supabase session.'
          );
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setAdminProfile(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await resolveAdminFromUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [resolveAdminFromUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setAuthError(null);

      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
        setAuthError('Email and password are required.');
        return false;
      }

      setLoading(true);
      try {
        await ensureSupabaseConfig();

        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error || !data.user) {
          setAuthError(error?.message || 'Invalid email or password.');
          return false;
        }

        const ok = await resolveAdminFromUser(data.user);
        return ok;
      } catch (err: unknown) {
        setAuthError(
          err instanceof Error ? err.message : 'Authentication failed.'
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [resolveAdminFromUser]
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    setUser(null);
    setAdminProfile(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return {
    user,
    adminProfile,
    isAdmin: Boolean(adminProfile && adminProfile.role === 'admin'),
    loading,
    authError,
    login,
    logout,
    signIn: login,
    signOut: logout,
    clearError,
  };
}
