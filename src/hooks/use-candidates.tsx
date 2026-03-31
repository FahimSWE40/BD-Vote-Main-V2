import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Candidate {
  id: string;
  full_name: string;
  position: string;
  party: string | null;
  photo_url: string | null;
  manifesto: string | null;
  vote_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('position', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useCandidates() {
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('candidates-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['candidates'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['candidates'],
    queryFn: fetchCandidates,
    staleTime: 30 * 1000,
  });
}

// Upload candidate photo to storage
export async function uploadCandidatePhoto(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('candidate-photos')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('candidate-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Create a new candidate
export async function createCandidate(candidate: {
  full_name: string;
  position: string;
  party?: string;
  photo_url?: string;
  bio?: string;
}): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .insert(candidate)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update a candidate
export async function updateCandidate(
  id: string,
  updates: Partial<Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<Candidate> {
  const { data, error } = await supabase
    .from('candidates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a candidate
export async function deleteCandidate(id: string): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
