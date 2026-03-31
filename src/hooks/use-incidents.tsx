import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  reported_by: string;
  constituency_id: string | null;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Incident[];
    },
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (incident: {
      title: string;
      description: string;
      severity: string;
      constituency_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('incidents' as any)
        .insert({
          ...incident,
          reported_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('incidents' as any)
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });
}
