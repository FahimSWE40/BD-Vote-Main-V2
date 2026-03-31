import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, UserCheck, Trash2, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVoters } from '@/hooks/use-voters';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminVotersSkeleton } from '@/components/admin/AdminSkeletons';
export default function AdminVoters() {
  const queryClient = useQueryClient();
  const { data: voters = [], isLoading, refetch, isRefetching } = useVoters();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setInitialLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleVerify = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('voters')
        .update({ is_verified: true })
        .eq('id', id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['voter-stats'] });
      toast.success('ভোটার ভেরিফাই করা হয়েছে');
    } catch (error) {
      console.error('Error verifying voter:', error);
      toast.error('ভেরিফাই করতে ব্যর্থ');
    }
  }, [queryClient]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ভোটারকে মুছে ফেলতে চান?')) return;
    
    try {
      const { error } = await supabase
        .from('voters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['voter-stats'] });
      toast.success('ভোটার মুছে ফেলা হয়েছে');
    } catch (error) {
      console.error('Error deleting voter:', error);
      toast.error('মুছে ফেলতে ব্যর্থ');
    }
  }, [queryClient]);

  const filteredVoters = useMemo(() => {
    return voters.filter(voter => {
      const matchesSearch = 
        voter.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.voter_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'verified' && voter.is_verified) ||
        (filter === 'pending' && !voter.is_verified);
      
      return matchesSearch && matchesFilter;
    });
  }, [voters, searchQuery, filter]);

  // Early return AFTER all hooks
  if (initialLoading && isLoading) {
    return (
      <AdminLayout title="ভোটার তালিকা" subtitle="লোড হচ্ছে...">
        <AdminVotersSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="ভোটার তালিকা"
      subtitle={`মোট ${voters.length}জন ভোটার`}
      actions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="gap-1.5"
        >
          <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">রিফ্রেশ</span>
        </Button>
      }
    >
      {/* Search & Filter */}
      <Card className="border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                সকল ({voters.length})
              </Button>
              <Button
                variant={filter === 'verified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('verified')}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <CheckCircle className="size-3 mr-1 hidden sm:inline" />
                ভেরিফাইড ({voters.filter(v => v.is_verified).length})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <Clock className="size-3 mr-1 hidden sm:inline" />
                পেন্ডিং ({voters.filter(v => !v.is_verified).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voters Table */}
      <Card className="border-border">
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg">
            ফলাফল ({filteredVoters.length}জন)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : filteredVoters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>কোনো ভোটার পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[120px]">নাম</TableHead>
                    <TableHead className="min-w-[80px]">আইডি</TableHead>
                    <TableHead className="w-[90px]">স্ট্যাটাস</TableHead>
                    <TableHead className="w-[70px] text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVoters.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell className="p-2 sm:p-4">
                        <span className="font-medium text-sm line-clamp-1">{voter.full_name}</span>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
                          {voter.voter_id}
                        </code>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex flex-col gap-1">
                          {voter.is_verified ? (
                            <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 w-fit text-xs">
                              <CheckCircle className="size-2.5" />
                              <span className="hidden sm:inline">ভেরিফাইড</span>
                              <span className="sm:hidden">✓</span>
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 w-fit text-xs">
                              <Clock className="size-2.5" />
                              <span className="hidden sm:inline">পেন্ডিং</span>
                              <span className="sm:hidden">...</span>
                            </Badge>
                          )}
                          {voter.has_voted && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 w-fit text-xs">
                              ভোট দিয়েছে
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex items-center justify-end gap-0.5">
                          {!voter.is_verified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 sm:size-8"
                              onClick={() => handleVerify(voter.id)}
                              title="ভেরিফাই"
                            >
                              <UserCheck className="size-3.5 sm:size-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 sm:size-8"
                            onClick={() => handleDelete(voter.id)}
                            title="মুছুন"
                          >
                            <Trash2 className="size-3.5 sm:size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
