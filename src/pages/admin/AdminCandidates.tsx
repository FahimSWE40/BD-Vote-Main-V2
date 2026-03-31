import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, Search, RefreshCw, Edit2, Trash2, User, 
  Users, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { useCandidates, deleteCandidate, updateCandidate, Candidate } from '@/hooks/use-candidates';
import { CandidateFormDialog } from '@/components/admin/CandidateFormDialog';
import { AdminCandidatesSkeleton } from '@/components/admin/AdminSkeletons';

function CandidateCard({ 
  candidate, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: { 
  candidate: Candidate; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Card className={`border-border transition-all ${!candidate.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          {/* Photo */}
          <div className="shrink-0">
            {candidate.photo_url ? (
              <img 
                src={candidate.photo_url} 
                alt={candidate.full_name}
                className="size-12 sm:size-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="size-12 sm:size-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <User className="size-6 sm:size-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{candidate.full_name}</h3>
                <p className="text-xs sm:text-sm text-primary font-medium">{candidate.position}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                {!candidate.is_active && (
                  <Badge variant="secondary" className="text-xs">নিষ্ক্রিয়</Badge>
                )}
                {candidate.party && (
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">{candidate.party}</Badge>
                )}
              </div>
            </div>
            
            {candidate.manifesto && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-2">{candidate.manifesto}</p>
            )}
            
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
              <Button size="sm" variant="outline" onClick={onEdit} className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                <Edit2 className="size-3 mr-1" /> সম্পাদনা
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggleActive} className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                {candidate.is_active ? (
                  <><ToggleRight className="size-3 mr-1" /> <span className="hidden sm:inline">নিষ্ক্রিয়</span></>
                ) : (
                  <><ToggleLeft className="size-3 mr-1" /> <span className="hidden sm:inline">সক্রিয়</span></>
                )}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 sm:h-8 text-xs sm:text-sm px-2 text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          <Skeleton className="size-12 sm:size-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 sm:h-5 w-2/3" />
            <Skeleton className="h-3 sm:h-4 w-1/3" />
            <Skeleton className="h-3 sm:h-4 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCandidates() {
  const queryClient = useQueryClient();
  const { data: candidates = [], isLoading, refetch, isRefetching } = useCandidates();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setInitialLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const query = searchQuery.toLowerCase();
    return candidates.filter(c => 
      c.full_name.toLowerCase().includes(query) ||
      c.position.toLowerCase().includes(query) ||
      c.party?.toLowerCase().includes(query)
    );
  }, [candidates, searchQuery]);

  // Group by position
  const groupedCandidates = useMemo(() => {
    const groups: Record<string, Candidate[]> = {};
    filteredCandidates.forEach(c => {
      if (!groups[c.position]) groups[c.position] = [];
      groups[c.position].push(c);
    });
    return groups;
  }, [filteredCandidates]);

  const handleEdit = useCallback((candidate: Candidate) => {
    setEditingCandidate(candidate);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`"${name}" প্রার্থী মুছে ফেলতে চান?`)) return;
    
    try {
      await deleteCandidate(id);
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('প্রার্থী মুছে ফেলা হয়েছে');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('মুছতে সমস্যা হয়েছে');
    }
  }, [queryClient]);

  const handleToggleActive = useCallback(async (candidate: Candidate) => {
    try {
      await updateCandidate(candidate.id, { is_active: !candidate.is_active });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success(candidate.is_active ? 'প্রার্থী নিষ্ক্রিয় করা হয়েছে' : 'প্রার্থী সক্রিয় করা হয়েছে');
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('পরিবর্তন করতে সমস্যা হয়েছে');
    }
  }, [queryClient]);

  const handleDialogSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['candidates'] });
    setEditingCandidate(null);
  }, [queryClient]);

  const openAddDialog = useCallback(() => {
    setEditingCandidate(null);
    setDialogOpen(true);
  }, []);

  // Early return AFTER all hooks
  if (initialLoading && isLoading) {
    return (
      <AdminLayout title="প্রার্থী ব্যবস্থাপনা" subtitle="লোড হচ্ছে...">
        <AdminCandidatesSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="প্রার্থী ব্যবস্থাপনা"
      subtitle="নির্বাচনের প্রার্থীদের তালিকা"
      actions={
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-2 sm:px-3"
          >
            <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openAddDialog} className="px-2 sm:px-3">
            <Plus className="size-4" />
            <span className="hidden sm:inline ml-1">প্রার্থী যোগ</span>
          </Button>
        </div>
      }
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="নাম, পদবী বা দল..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Users className="size-3.5 sm:size-4" />
          মোট: {candidates.length}
        </span>
        <span>সক্রিয়: {candidates.filter(c => c.is_active).length}</span>
        <span>পদবী: {Object.keys(groupedCandidates).length}</span>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => <CandidateSkeleton key={i} />)}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 sm:py-12 text-center">
            <Users className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium text-base sm:text-lg mb-1">কোনো প্রার্থী নেই</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'অনুসন্ধানে কোনো ফলাফল পাওয়া যায়নি' : 'প্রথম প্রার্থী যোগ করুন'}
            </p>
            {!searchQuery && (
              <Button onClick={openAddDialog} size="sm">
                <Plus className="size-4 mr-1" /> প্রার্থী যোগ করুন
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {Object.entries(groupedCandidates).map(([position, positionCandidates]) => (
            <div key={position}>
              <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
                {position}
                <Badge variant="secondary" className="text-xs">{positionCandidates.length}</Badge>
              </h3>
              <div className="grid gap-2 sm:gap-3">
                {positionCandidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onEdit={() => handleEdit(candidate)}
                    onDelete={() => handleDelete(candidate.id, candidate.full_name)}
                    onToggleActive={() => handleToggleActive(candidate)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <CandidateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidate={editingCandidate}
        onSuccess={handleDialogSuccess}
      />
    </AdminLayout>
  );
}
