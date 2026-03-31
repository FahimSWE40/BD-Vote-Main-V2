import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoterStats {
  total: number;
  verified: number;
  pending: number;
  voted: number;
}

async function fetchVoterStats(): Promise<VoterStats> {
  const { data, error } = await supabase
    .from('voters')
    .select('is_verified, has_voted');

  if (error) throw error;

  return {
    total: data?.length || 0,
    verified: data?.filter(v => v.is_verified).length || 0,
    pending: data?.filter(v => !v.is_verified).length || 0,
    voted: data?.filter(v => v.has_voted).length || 0,
  };
}

export function useVoterStats() {
  return useQuery({
    queryKey: ['voter-stats'],
    queryFn: fetchVoterStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

interface Voter {
  id: string;
  voter_id: string;
  full_name: string;
  department: string | null;
  session_year: string | null;
  is_verified: boolean;
  has_voted: boolean;
  created_at: string;
}

async function fetchVoters(): Promise<Voter[]> {
  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useVoters() {
  return useQuery({
    queryKey: ['voters'],
    queryFn: fetchVoters,
    staleTime: 30 * 1000,
  });
}

// Recent voter type (subset for activity feed)
interface RecentVoter {
  id: string;
  voter_id: string;
  full_name: string;
  is_verified: boolean | null;
  created_at: string;
}

// Fetch recent voters for activity feed
async function fetchRecentVoters(limit: number): Promise<RecentVoter[]> {
  const { data, error } = await supabase
    .from('voters')
    .select('id, voter_id, full_name, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export function useRecentVoters(limit: number = 5) {
  const queryClient = useQueryClient();

  // Subscribe to real-time changes on voters_master
  useEffect(() => {
    const channel = supabase
      .channel('voters-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voters' },
        () => {
          // Invalidate queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['recent-voters'] });
          queryClient.invalidateQueries({ queryKey: ['voter-stats'] });
          queryClient.invalidateQueries({ queryKey: ['voters'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['recent-voters', limit],
    queryFn: () => fetchRecentVoters(limit),
    staleTime: 30 * 1000,
  });
}
