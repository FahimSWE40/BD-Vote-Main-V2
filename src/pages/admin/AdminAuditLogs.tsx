import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as AuditLog[];
    },
  });
}

export default function AdminAuditLogs() {
  const { data: logs = [], isLoading, refetch, isRefetching } = useAuditLogs();

  const actionColors: Record<string, string> = {
    login: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    vote: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    create: 'bg-primary/10 text-primary',
    update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  };

  return (
    <AdminLayout
      title="অডিট লগ"
      subtitle="সিস্টেমের নিরাপত্তা কার্যক্রম পর্যবেক্ষণ"
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="size-10 mx-auto mb-3 opacity-50" />
              <p>কোনো অডিট লগ নেই</p>
              <p className="text-sm mt-1">সিস্টেম কার্যক্রম এখানে দেখা যাবে</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কার্যক্রম</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead className="hidden sm:table-cell">বিবরণ</TableHead>
                  <TableHead>সময়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={`${actionColors[log.action] || 'bg-muted text-muted-foreground'} border-0 text-xs`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entity_type}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details).substring(0, 80) : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: bn })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
