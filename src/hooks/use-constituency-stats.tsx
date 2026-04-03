import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConstituencyTurnout {
  constituency_id: string | null;
  constituency_name: string;
  constituency_code: string;
  total_voters: number;
  voted_count: number;
  turnout_percent: number;
}

async function fetchConstituencyTurnout(): Promise<ConstituencyTurnout[]> {
  // Fetch all voters with constituency info
  const { data: voters, error: voterError } = await supabase
    .from('voters')
    .select('constituency_id, has_voted');

  if (voterError) throw voterError;

  // Fetch constituency names
  const { data: constituencies, error: constError } = await supabase
    .from('constituencies')
    .select('id, constituency_name, constituency_code');

  if (constError) throw constError;

  // Build a map of constituency_id -> info
  const constMap = new Map<string, { name: string; code: string }>();
  for (const c of (constituencies || [])) {
    constMap.set(c.id, { name: c.constituency_name, code: c.constituency_code });
  }

  // Group voters by constituency_id
  const groups = new Map<string, { total: number; voted: number }>();

  for (const v of (voters || [])) {
    const key = v.constituency_id || '__unassigned__';
    if (!groups.has(key)) {
      groups.set(key, { total: 0, voted: 0 });
    }
    const g = groups.get(key)!;
    g.total++;
    if (v.has_voted) g.voted++;
  }

  // Convert to array
  const result: ConstituencyTurnout[] = [];
  for (const [id, stats] of groups) {
    const info = constMap.get(id);
    result.push({
      constituency_id: id === '__unassigned__' ? null : id,
      constituency_name: info?.name || 'অনির্ধারিত এলাকা',
      constituency_code: info?.code || '—',
      total_voters: stats.total,
      voted_count: stats.voted,
      turnout_percent: stats.total > 0 ? Math.round((stats.voted / stats.total) * 100) : 0,
    });
  }

  // Sort by constituency code
  result.sort((a, b) => (a.constituency_code || '').localeCompare(b.constituency_code || ''));

  return result;
}

export function useConstituencyStats() {
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('constituency-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, () => {
        queryClient.invalidateQueries({ queryKey: ['constituency-stats'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['constituency-stats'],
    queryFn: fetchConstituencyTurnout,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
