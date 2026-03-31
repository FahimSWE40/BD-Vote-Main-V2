import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, CheckCircle, Clock, Search as SearchIcon, Eye } from 'lucide-react';
import { useIncidents, useUpdateIncidentStatus } from '@/hooks/use-incidents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

const severityMap: Record<string, { label: string; color: string }> = {
  low: { label: 'নিম্ন', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  medium: { label: 'মাঝারি', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' },
  high: { label: 'উচ্চ', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  critical: { label: 'জরুরি', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
};

const statusMap: Record<string, { label: string; icon: React.ElementType }> = {
  open: { label: 'খোলা', icon: AlertTriangle },
  investigating: { label: 'তদন্তাধীন', icon: SearchIcon },
  resolved: { label: 'সমাধান', icon: CheckCircle },
  dismissed: { label: 'বাতিল', icon: Clock },
};

export default function AdminIncidents() {
  const { data: incidents = [], isLoading, refetch, isRefetching } = useIncidents();
  const updateStatus = useUpdateIncidentStatus();
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status === filter);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
    } catch {
      toast.error('আপডেট করতে সমস্যা');
    }
  };

  return (
    <AdminLayout
      title="ঘটনা রিপোর্ট"
      subtitle="অভিযোগ ও ঘটনা পরিচালনা"
      actions={
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল</SelectItem>
              <SelectItem value="open">খোলা</SelectItem>
              <SelectItem value="investigating">তদন্তাধীন</SelectItem>
              <SelectItem value="resolved">সমাধান</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>মোট: {incidents.length}</span>
        <span className="text-destructive">খোলা: {incidents.filter(i => i.status === 'open').length}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="size-10 mx-auto mb-3 opacity-50" />
              <p>কোনো ঘটনা রিপোর্ট নেই</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিরোনাম</TableHead>
                  <TableHead className="hidden sm:table-cell">তীব্রতা</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="hidden sm:table-cell">সময়</TableHead>
                  <TableHead className="w-[130px]">পরিবর্তন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(incident => {
                  const sev = severityMap[incident.severity] || severityMap.medium;
                  return (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{incident.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{incident.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={`${sev.color} border-0 text-xs`}>{sev.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{statusMap[incident.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true, locale: bn })}
                      </TableCell>
                      <TableCell>
                        <Select value={incident.status} onValueChange={(v) => handleStatusChange(incident.id, v)}>
                          <SelectTrigger className="h-8 text-xs w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">খোলা</SelectItem>
                            <SelectItem value="investigating">তদন্তাধীন</SelectItem>
                            <SelectItem value="resolved">সমাধান</SelectItem>
                            <SelectItem value="dismissed">বাতিল</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
