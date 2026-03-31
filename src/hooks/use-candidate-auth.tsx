import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CandidateSession {
  id: string;
  full_name: string;
  position: string;
  party: string | null;
  photo_url: string | null;
}

const CANDIDATE_SESSION_KEY = 'bd-vote-candidate-session';

export function useCandidateAuth() {
  const [candidate, setCandidate] = useState<CandidateSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(CANDIDATE_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (candidateId: string, accessCode: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, full_name, position, party, photo_url')
        .eq('id', candidateId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      // Verify access code (last 6 chars of candidate ID)
      const expectedCode = data.id.slice(-6).toUpperCase();
      if (accessCode.toUpperCase() !== expectedCode) {
        return false;
      }

      const session: CandidateSession = {
        id: data.id,
        full_name: data.full_name,
        position: data.position,
        party: data.party,
        photo_url: data.photo_url,
      };

      sessionStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(session));
      setCandidate(session);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(CANDIDATE_SESSION_KEY);
    setCandidate(null);
  }, []);

  return {
    candidate,
    isAuthenticated: !!candidate,
    isLoading,
    login,
    logout,
  };
}
