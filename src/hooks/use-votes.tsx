import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CastVoteResult {
  success: boolean;
  vote_id?: string;
  tx_hash?: string;
  voter_id_hash?: string;
  status?: string;
  message?: string;
  error?: string;
}

interface VoteTransaction {
  id: string;
  tx_hash: string | null;
  voter_id_hash: string | null;
  status: string;
  created_at: string;
  candidate_id: string;
}

export function useVotes() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<CastVoteResult | null>(null);
  const { toast } = useToast();

  /**
   * Cast a vote via edge function (FR-10, FR-11, FR-12)
   * Handles encryption, blockchain storage, and one-vote restriction
   */
  const castVote = async (voterId: string, candidateId: string): Promise<CastVoteResult> => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cast-vote', {
        body: { voter_id: voterId, candidate_id: candidateId },
      });

      if (error) {
        const result: CastVoteResult = {
          success: false,
          error: error.message || 'ভোট দিতে ব্যর্থ হয়েছে',
        };
        setLastResult(result);
        toast({
          title: 'ভোট ব্যর্থ',
          description: result.error,
          variant: 'destructive',
        });
        return result;
      }

      if (data?.error) {
        const result: CastVoteResult = {
          success: false,
          error: data.error,
        };
        setLastResult(result);
        toast({
          title: 'ভোট ব্যর্থ',
          description: data.error,
          variant: 'destructive',
        });
        return result;
      }

      const result: CastVoteResult = {
        success: true,
        vote_id: data.vote_id,
        tx_hash: data.tx_hash,
        voter_id_hash: data.voter_id_hash,
        status: data.status,
        message: data.message,
      };
      setLastResult(result);
      return result;
    } catch (err) {
      const result: CastVoteResult = {
        success: false,
        error: 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fetch recent blockchain transactions (for Results page)
   */
  const fetchRecentTransactions = async (limit = 10): Promise<VoteTransaction[]> => {
    const { data, error } = await supabase
      .from('votes')
      .select('id, tx_hash, voter_id_hash, status, created_at, candidate_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }

    return (data || []) as VoteTransaction[];
  };

  /**
   * Get vote statistics for results display
   */
  const fetchVoteStats = async () => {
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id, full_name, party, vote_count, photo_url')
      .eq('is_active', true)
      .order('vote_count', { ascending: false });

    if (error) {
      console.error('Failed to fetch vote stats:', error);
      return { candidates: [], totalVotes: 0 };
    }

    const totalVotes = (candidates || []).reduce((sum, c) => sum + (c.vote_count || 0), 0);

    return {
      candidates: candidates || [],
      totalVotes,
    };
  };

  return {
    castVote,
    isSubmitting,
    lastResult,
    fetchRecentTransactions,
    fetchVoteStats,
  };
}
