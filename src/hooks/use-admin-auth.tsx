import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    isAuthenticated: false,
    userId: null,
    userEmail: null,
  });

  const checkAdminStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setState({
          isAdmin: false,
          isLoading: false,
          isAuthenticated: false,
          userId: null,
          userEmail: null,
        });
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setState({
          isAdmin: false,
          isLoading: false,
          isAuthenticated: true,
          userId: user.id,
          userEmail: user.email || null,
        });
        return;
      }

      setState({
        isAdmin: !!roles,
        isLoading: false,
        isAuthenticated: true,
        userId: user.id,
        userEmail: user.email || null,
      });
    } catch (error) {
      console.error('Error in admin auth check:', error);
      setState({
        isAdmin: false,
        isLoading: false,
        isAuthenticated: false,
        userId: null,
        userEmail: null,
      });
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    checkAdminStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      isAdmin: false,
      isLoading: false,
      isAuthenticated: false,
      userId: null,
      userEmail: null,
    });
  }, []);

  return { ...state, signOut, refetch: checkAdminStatus };
}

// Hook for protecting admin routes
export function useRequireAdmin(redirectTo: string = '/admin/login') {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAdminAuth();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        navigate(redirectTo, { replace: true });
      } else if (!auth.isAdmin) {
        toast({
          title: 'অ্যাক্সেস অস্বীকার',
          description: 'আপনার অ্যাডমিন অ্যাক্সেস নেই।',
          variant: 'destructive',
        });
        supabase.auth.signOut();
        navigate(redirectTo, { replace: true });
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin, navigate, redirectTo, toast]);

  return auth;
}
