import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ElectionConfig {
  id: string;
  election_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useElectionConfig() {
  return useQuery({
    queryKey: ['election-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('election_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as ElectionConfig | null;
    },
  });
}

export function useActiveElection() {
  return useQuery({
    queryKey: ['active-election'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('election_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return null;
      return data as ElectionConfig | null;
    },
  });
}

export function useSaveElectionConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      id?: string;
      election_name: string;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }) => {
      if (config.id) {
        const { data, error } = await supabase
          .from('election_config')
          .update({
            election_name: config.election_name,
            start_time: config.start_time,
            end_time: config.end_time,
            is_active: config.is_active,
          })
          .eq('id', config.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('election_config')
          .insert({
            election_name: config.election_name,
            start_time: config.start_time,
            end_time: config.end_time,
            is_active: config.is_active,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election-config'] });
      queryClient.invalidateQueries({ queryKey: ['active-election'] });
    },
  });
}
