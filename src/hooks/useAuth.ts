import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, ensureSupabaseConfig } from '../lib/supabase';
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

  // In-flight verification tracking to prevent race conditions
  const activeVerificationRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);

  /**
   * Authoritatively verify the authenticated Supabase session using the `is_qbench_admin` RPC.
   *
   * Flow:
   * 1. Obtain current Supabase user via `supabase.auth.getUser()`.
   * 2. If unauthenticated, clear admin state.
   * 3. Call `supabase.rpc('is_qbench_admin')`.
   * 4. If adminError occurs, display system error (do NOT show "not registered as admin").
   * 5. If returned value is NOT strictly true (false/null/other), sign out and show:
   *    "Access denied. Your account is not registered as an admin (role = "admin") in public.admin_profiles."
   * 6. If strictly true, set adminProfile and allow access.
   */
  const verifyCurrentAdminSession = useCallback(async (): Promise<boolean> => {
    // If a verification is already executing, reuse the promise to prevent race conditions
    if (activeVerificationRef.current) {
      return activeVerificationRef.current;
    }

    const verificationPromise = (async () => {
      try {
        await ensureSupabaseConfig();

        // 1. Obtain the current Supabase session/user after establishing auth
        const {
          data: { user: currentUser },
          error: sessionError,
        } = await supabase.auth.getUser();

        if (sessionError || !currentUser) {
          if (mountedRef.current) {
            setUser(null);
            setAdminProfile(null);
          }
          return false;
        }

        // 2. Call the existing PostgreSQL RPC: supabase.rpc('is_qbench_admin')
        const { data: isAdmin, error: adminError } = await supabase.rpc(
          'is_qbench_admin'
        );

        let isAuthorized = false;

        // 3. Handle RPC errors separately from a legitimate false result.
        // Do not incorrectly display "not registered as admin" when the RPC itself failed.
        if (adminError) {
          const isFuncPermDenied =
            adminError.code === '42501' ||
            (adminError.message || '')
              .toLowerCase()
              .includes('permission denied for function is_qbench_admin');

          if (isFuncPermDenied) {
            // If EXECUTE permission on public.is_qbench_admin() was revoked in PostgreSQL,
            // verify the identical condition (user_id = auth.uid() AND role = 'admin')
            // via the authenticated user's own RLS-protected row.
            const { data: ownRow, error: rowError } = await supabase
              .from('admin_profiles')
              .select('user_id, role')
              .eq('user_id', currentUser.id)
              .eq('role', 'admin')
              .maybeSingle();

            if (rowError) {
              if (mountedRef.current) {
                setUser(null);
                setAdminProfile(null);
                setAuthError(
                  `Authentication error: ${rowError.message || adminError.message || 'Failed to verify admin status.'}`
                );
              }
              return false;
            }

            isAuthorized = Boolean(
              ownRow &&
                ownRow.user_id === currentUser.id &&
                ownRow.role === 'admin'
            );
          } else {
            if (mountedRef.current) {
              setUser(null);
              setAdminProfile(null);
              setAuthError(
                `Authentication error: ${adminError.message || 'Failed to verify admin status.'}`
              );
            }
            return false;
          }
        } else {
          // 4. Treat the returned boolean strictly as a boolean
          isAuthorized = isAdmin === true;
        }

        if (!isAuthorized) {
          // If it returns false, sign the user out and show the existing access-denied message.
          await supabase.auth.signOut();
          if (mountedRef.current) {
            setUser(null);
            setAdminProfile(null);
            setAuthError(
              'Access denied. Your account is not registered as an admin (role = "admin") in public.admin_profiles.'
            );
          }
          return false;
        }

        // 5. Authenticated admin — construct the session admin representation from the Supabase user
        const profile: AdminProfile = {
          id: currentUser.id,
          user_id: currentUser.id,
          email: currentUser.email || '',
          role: 'admin',
        };

        if (mountedRef.current) {
          setUser(currentUser);
          setAdminProfile(profile);
          setAuthError(null);
        }
        return true;
      } catch (err: unknown) {
        if (mountedRef.current) {
          setUser(null);
          setAdminProfile(null);
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Failed to verify admin authentication session.'
          );
        }
        return false;
      } finally {
        activeVerificationRef.current = null;
      }
    })();

    activeVerificationRef.current = verificationPromise;
    return verificationPromise;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function initSession() {
      setLoading(true);
      try {
        await ensureSupabaseConfig();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mountedRef.current) {
            setUser(null);
            setAdminProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mountedRef.current) {
          await verifyCurrentAdminSession();
        }
      } catch (err: unknown) {
        if (mountedRef.current) {
          setUser(null);
          setAdminProfile(null);
          setAuthError(
            err instanceof Error
              ? err.message
              : 'Failed to restore Supabase session.'
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setAdminProfile(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Keep authentication state synchronized while preventing race conditions
          setLoading(true);
          try {
            await verifyCurrentAdminSession();
          } finally {
            if (mountedRef.current) {
              setLoading(false);
            }
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [verifyCurrentAdminSession]);

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

        // 1. User signs in using the existing Supabase Auth login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error || !data.user) {
          setAuthError(error?.message || 'Invalid email or password.');
          return false;
        }

        // 2. Authoritatively verify admin status using the RPC
        const ok = await verifyCurrentAdminSession();
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
    [verifyCurrentAdminSession]
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut network errors
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setAdminProfile(null);
      }
    }
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
